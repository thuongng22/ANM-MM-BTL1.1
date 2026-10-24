import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Cho phép mọi domain/IP kết nối đến (Localhost & LAN)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
// Hỗ trợ body json dung lượng lớn cho REST nếu cần
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper đọc dữ liệu từ file database.json
function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = { users: [], messages: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Đọc database.json thất bại:', error.message);
    return { users: [], messages: [] };
  }
}

// Helper ghi dữ liệu vào file database.json
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Ghi database.json thất bại:', error.message);
    return false;
  }
}

// Khởi tạo file database.json nếu chưa tồn tại
readDatabase();

// --- REST API: Xác thực người dùng ---

// 1. Đăng ký tài khoản
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ Tên đăng nhập và Mật khẩu.'
    });
  }

  const cleanUsername = username.trim();
  const db = readDatabase();

  const userExists = db.users.some(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (userExists) {
    return res.status(409).json({
      success: false,
      message: 'Tên người dùng này đã tồn tại. Vui lòng chọn tên khác.'
    });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    password: password.trim(),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDatabase(db);

  return res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản thành công.',
    user: {
      id: newUser.id,
      username: newUser.username
    }
  });
});

// 2. Đăng nhập
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập Tên đăng nhập và Mật khẩu.'
    });
  }

  const cleanUsername = username.trim();
  const db = readDatabase();

  const user = db.users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Tên đăng nhập không tồn tại.'
    });
  }

  if (user.password !== password.trim()) {
    return res.status(401).json({
      success: false,
      message: 'Mật khẩu không chính xác.'
    });
  }

  return res.json({
    success: true,
    message: 'Đăng nhập thành công.',
    user: {
      id: user.id,
      username: user.username
    }
  });
});

// --- Socket.io: Thời gian thực & Hỗ trợ truyền tệp Base64 ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // Nâng giới hạn buffer Socket.io lên 100MB để truyền file Base64 an toàn
  maxHttpBufferSize: 1e8
});

const activeSockets = new Map();

io.on('connection', (socket) => {
  // 1. Tham gia phòng và trả về lịch sử tin nhắn đã lưu (bao gồm file)
  socket.on('join_room', ({ username, room }) => {
    if (!username || !room) return;

    const prevSession = activeSockets.get(socket.id);
    if (prevSession?.room) {
      socket.leave(prevSession.room);
    }

    socket.join(room);
    activeSockets.set(socket.id, { username, room });

    // Đọc lịch sử tin nhắn của phòng từ database.json
    const db = readDatabase();
    const roomMessages = db.messages.filter((msg) => msg.room === room);

    // Gửi toàn bộ lịch sử tin nhắn kèm attachment cho socket vừa vào
    socket.emit('room_history', roomMessages);

    // Thông báo cho các thành viên khác
    socket.to(room).emit('receive_message', {
      id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'Hệ thống',
      text: `${username} đã tham gia phòng.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
      room
    });
  });

  // 2. Nhận tin nhắn mới (văn bản và/hoặc tệp đính kèm Base64), lưu vào database.json và phát tới các thành viên
  socket.on('send_message', (messageData) => {
    const { room, sender, text, attachment } = messageData;
    const hasText = Boolean(text && text.trim().length > 0);
    const hasAttachment = Boolean(attachment && attachment.data);

    // Phải có ít nhất nội dung văn bản hoặc tệp đính kèm
    if (!room || (!hasText && !hasAttachment)) return;

    // Đóng gói tin nhắn chuẩn hóa
    const formattedMessage = {
      id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: sender || 'Ẩn danh',
      text: hasText ? text.trim() : '',
      // Tệp đính kèm Base64 (nếu có)
      attachment: hasAttachment
        ? {
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            data: attachment.data // Chuỗi Base64 Data URL
          }
        : null,
      timestamp: messageData.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      room,
      isSystem: false
    };

    // Lưu vào file database.json bằng fs.writeFileSync
    const db = readDatabase();
    db.messages.push(formattedMessage);
    writeDatabase(db);

    // Phát tin nhắn (kèm attachment Base64) tới tất cả client trong phòng
    io.to(room).emit('receive_message', formattedMessage);
  });

  // 3. Xử lý khi ngắt kết nối
  socket.on('disconnect', () => {
    const session = activeSockets.get(socket.id);
    if (session) {
      const { username, room } = session;
      socket.to(room).emit('receive_message', {
        id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'Hệ thống',
        text: `${username} đã rời phòng.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
        room
      });
      activeSockets.delete(socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Backend đang hoạt động tại cổng ${PORT} (Đã bind 0.0.0.0 cho mạng LAN & Localhost)`);
});
