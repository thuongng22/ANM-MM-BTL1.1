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

// Helper lấy danh sách thành viên đang hoạt động trong phòng
function getRoomMembers(room) {
  const members = [];
  for (const [id, s] of activeSockets.entries()) {
    if (s.room === room) {
      members.push({
        socketId: s.socketId,
        username: s.username,
        publicKey: s.publicKey || null,
        joinedAt: s.joinedAt
      });
    }
  }
  // Sắp xếp theo thứ tự tham gia (người vào trước đứng đầu để làm distributor)
  return members.sort((a, b) => a.joinedAt - b.joinedAt);
}

io.on('connection', (socket) => {
  // 1. Tham gia phòng và xử lý Bắt tay trao đổi khóa RSA (RSA Handshake)
  socket.on('join_room', ({ username, room, publicKey }) => {
    if (!username || !room) return;

    const prevSession = activeSockets.get(socket.id);
    const prevRoom = prevSession?.room;
    if (prevRoom && prevRoom !== room) {
      socket.leave(prevRoom);
      // Cập nhật danh sách thành viên cho phòng cũ
      io.to(prevRoom).emit('room_users', getRoomMembers(prevRoom).filter(m => m.socketId !== socket.id));
    }

    socket.join(room);

    // Lưu phiên hoạt động kèm RSA Public Key
    const sessionData = {
      socketId: socket.id,
      username,
      room,
      publicKey: publicKey || null,
      joinedAt: Date.now()
    };
    activeSockets.set(socket.id, sessionData);

    // Đọc lịch sử tin nhắn của phòng từ database.json
    const db = readDatabase();
    const roomMessages = db.messages.filter((msg) => msg.room === room);

    // Gửi toàn bộ lịch sử tin nhắn kèm attachment cho socket vừa vào
    socket.emit('room_history', roomMessages);

    // Lấy danh sách thành viên đã có mặt trước đó trong phòng
    const existingMembers = getRoomMembers(room).filter(m => m.socketId !== socket.id);

    // Phát danh sách toàn bộ thành viên phòng hiện tại cho mọi người trong phòng
    io.to(room).emit('room_users', getRoomMembers(room));

    // Thông báo cho các thành viên khác
    socket.to(room).emit('receive_message', {
      id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'Hệ thống',
      text: `${username} đã tham gia phòng.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
      room
    });

    // --- LUỒNG BẮT TAY TRAO ĐỔI KHÓA RSA (RSA HANDSHAKE PROTOCOL) ---
    if (existingMembers.length === 0) {
      // Trường hợp A: Phòng chưa có ai => User này là NGƯỜI ĐẦU TIÊN (Key Initiator)
      console.log(`[Handshake] "${username}" là người đầu tiên trong phòng "${room}". Yêu cầu khởi tạo khóa phòng.`);
      socket.emit('init_room_key_holder', {
        room,
        isInitiator: true,
        message: 'Bạn là thành viên đầu tiên. Khóa phòng sẽ được khởi tạo tự động.'
      });
    } else {
      // Trường hợp B: Phòng ĐÃ CÓ người cũ => Người cũ gửi khóa cho người mới
      // Chọn người có mặt lâu nhất trong phòng làm distributor
      const distributor = existingMembers[0];
      console.log(`[Handshake] "${username}" tham gia phòng "${room}". Yêu cầu người cũ "${distributor.username}" phân phối khóa phòng.`);

      // Gửi yêu cầu phân phối khóa tới người cũ
      io.to(distributor.socketId).emit('req_room_key_distribution', {
        requesterSocketId: socket.id,
        requesterUsername: username,
        requesterPublicKey: publicKey,
        room
      });

      // Báo cho người mới biết đang chờ nhận khóa
      socket.emit('handshake_pending', {
        room,
        distributorUsername: distributor.username,
        message: `Đang chờ người cũ (${distributor.username}) gửi khóa phòng đã mã hóa RSA...`
      });
    }
  });

  // 2. Chuyển tiếp Khóa phòng đã được mã hóa RSA từ Người cũ sang Người mới (E2EE Relay)
  socket.on('send_encrypted_room_key', ({ targetSocketId, encryptedKey, room, sender }) => {
    if (!targetSocketId || !encryptedKey) return;

    console.log(`[Handshake] Chuyển tiếp khóa phòng mã hóa từ "${sender}" tới target "${targetSocketId}" trong phòng "${room}".`);

    // Server chỉ chuyển tiếp Ciphertext, hoàn toàn KHÔNG THỂ giải mã nội dung vì không có Private Key
    io.to(targetSocketId).emit('receive_encrypted_room_key', {
      encryptedKey,
      room,
      sender: sender || activeSockets.get(socket.id)?.username || 'Thành viên cũ'
    });
  });

  // 3. User yêu cầu cấp lại khóa phòng khi cần thiết
  socket.on('request_room_key_refresh', ({ room }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;
    const existingMembers = getRoomMembers(room).filter(m => m.socketId !== socket.id);
    if (existingMembers.length > 0) {
      const distributor = existingMembers[0];
      io.to(distributor.socketId).emit('req_room_key_distribution', {
        requesterSocketId: socket.id,
        requesterUsername: session.username,
        requesterPublicKey: session.publicKey,
        room
      });
    } else {
      socket.emit('init_room_key_holder', {
        room,
        isInitiator: true,
        message: 'Không có thành viên khác. Tự tạo khóa phòng mới.'
      });
    }
  });

  // 4. Nhận tin nhắn mới (văn bản và/hoặc tệp đính kèm Base64), lưu vào database.json và phát tới các thành viên
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
      // Chữ ký xác thực toàn vẹn HMAC-SHA256 (nếu có)
      hmac: messageData.hmac || null,
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

  // 5. Xử lý khi ngắt kết nối
  socket.on('disconnect', () => {
    const session = activeSockets.get(socket.id);
    if (session) {
      const { username, room } = session;
      activeSockets.delete(socket.id);

      socket.to(room).emit('receive_message', {
        id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'Hệ thống',
        text: `${username} đã rời phòng.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
        room
      });

      // Cập nhật lại danh sách thành viên còn lại trong phòng
      io.to(room).emit('room_users', getRoomMembers(room));
      console.log(`[Socket] "${username}" đã rời phòng "${room}". Còn lại: ${getRoomMembers(room).length} thành viên.`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Backend đang hoạt động tại cổng ${PORT} (Đã bind 0.0.0.0 cho mạng LAN & Localhost)`);
});
