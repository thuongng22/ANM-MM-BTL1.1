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
const userStatuses = new Map(); // username -> 'online' | 'away' | 'offline'
const roomJoinedHistory = new Set(); // Set lưu `${room}:${username}` để xác định lần đầu tham gia

// Khởi tạo lịch sử tham gia phòng từ database
function initRoomHistory() {
  const db = readDatabase();
  if (Array.isArray(db.joinedHistory)) {
    db.joinedHistory.forEach((item) => roomJoinedHistory.add(item));
  } else if (Array.isArray(db.messages)) {
    db.messages.forEach((m) => {
      if (m.room && m.sender && !m.isSystem) {
        roomJoinedHistory.add(`${m.room}:${m.sender}`);
      }
    });
  }
}
initRoomHistory();

// Helper lấy danh sách thành viên trong phòng kèm trạng thái (online, away, offline)
function getRoomMembers(room) {
  const membersMap = new Map();
  const db = readDatabase();

  // 1. Các user đang có socket kết nối trong phòng
  const activeUsernames = new Set();
  for (const [id, s] of activeSockets.entries()) {
    if (s.room === room) {
      activeUsernames.add(s.username);
      membersMap.set(s.username, {
        socketId: s.socketId,
        username: s.username,
        publicKey: s.publicKey || null,
        joinedAt: s.joinedAt,
        status: s.status || 'online' // 'online' | 'away'
      });
    }
  }

  // 2. Thêm các user đã từng tham gia phòng nhưng hiện đang offline
  for (const record of roomJoinedHistory) {
    const [r, u] = record.split(':');
    if (r === room && !membersMap.has(u)) {
      membersMap.set(u, {
        socketId: null,
        username: u,
        publicKey: null,
        joinedAt: 0,
        status: 'offline'
      });
    }
  }

  const list = Array.from(membersMap.values());
  const statusWeight = { online: 3, away: 2, offline: 1 };
  return list.sort((a, b) => (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0));
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

    // Lưu phiên hoạt động kèm RSA Public Key và trạng thái 'online'
    const sessionData = {
      socketId: socket.id,
      username,
      room,
      publicKey: publicKey || null,
      joinedAt: Date.now(),
      status: 'online'
    };
    activeSockets.set(socket.id, sessionData);
    userStatuses.set(username, 'online');

    // Đọc lịch sử tin nhắn của phòng từ database.json
    const db = readDatabase();
    const roomMessages = db.messages.filter((msg) => msg.room === room);
    const currentResetId = db.roomResetIds?.[room] || 'initial';

    // Gửi toàn bộ lịch sử tin nhắn kèm attachment và resetId cho socket vừa vào
    socket.emit('room_history', { messages: roomMessages, resetId: currentResetId });

    // Phát danh sách toàn bộ thành viên phòng hiện tại cho mọi người trong phòng
    io.to(room).emit('room_users', getRoomMembers(room));

    // CHỈ THÔNG BÁO KHI NGƯỜI DÙNG THAM GIA PHÒNG LẦN ĐẦU TIÊN
    const userRoomKey = `${room}:${username}`;
    if (!roomJoinedHistory.has(userRoomKey)) {
      roomJoinedHistory.add(userRoomKey);
      db.joinedHistory = Array.from(roomJoinedHistory);
      writeDatabase(db);

      socket.to(room).emit('receive_message', {
        id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'Hệ thống',
        text: `${username} đã tham gia phòng.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
        room
      });
    }

    // Trao doi khoa phong RSA
    const onlineDistributors = [];
    for (const [id, s] of activeSockets.entries()) {
      if (s.room === room && id !== socket.id && s.publicKey) {
        onlineDistributors.push(s);
      }
    }
    onlineDistributors.sort((a, b) => a.joinedAt - b.joinedAt);

    if (onlineDistributors.length === 0) {
      console.log(`[Handshake] "${username}" là thành viên online duy nhất trong phòng "${room}".`);
      socket.emit('init_room_key_holder', {
        room,
        isInitiator: true,
        message: 'Bạn là thành viên trực tuyến duy nhất. Khóa phòng được kích hoạt.'
      });
    } else {
      const distributor = onlineDistributors[0];
      console.log(`[Handshake] "${username}" tham gia phòng "${room}". Yêu cầu "${distributor.username}" gửi khóa.`);

      io.to(distributor.socketId).emit('req_room_key_distribution', {
        requesterSocketId: socket.id,
        requesterUsername: username,
        requesterPublicKey: publicKey,
        room
      });

      socket.emit('handshake_pending', {
        room,
        distributorUsername: distributor.username,
        message: `Đang chờ thành viên trực tuyến (${distributor.username}) gửi khóa phòng đã mã hóa RSA...`
      });
    }
  });

  // Chuyen tiep khoa da ma hoa RSA
  socket.on('send_encrypted_room_key', ({ targetSocketId, encryptedKey, room, sender }) => {
    if (!targetSocketId || !encryptedKey) return;

    console.log(`[Handshake] Chuyển tiếp khóa phòng mã hóa từ "${sender}" tới "${targetSocketId}".`);

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
    
    // Tìm các thành viên đang online thực sự (socketId hợp lệ, có publicKey)
    const onlineDistributors = [];
    for (const [id, s] of activeSockets.entries()) {
      if (s.room === room && id !== socket.id && s.publicKey) {
        onlineDistributors.push(s);
      }
    }
    onlineDistributors.sort((a, b) => a.joinedAt - b.joinedAt);

    if (onlineDistributors.length > 0) {
      const distributor = onlineDistributors[0];
      io.to(distributor.socketId).emit('req_room_key_distribution', {
        requesterSocketId: socket.id,
        requesterUsername: session.username,
        requesterPublicKey: session.publicKey,
        room
      });
      socket.emit('handshake_pending', {
        room,
        distributorUsername: distributor.username,
        message: `Đang chờ thành viên trực tuyến (${distributor.username}) gửi lại khóa phòng...`
      });
    } else {
      socket.emit('init_room_key_holder', {
        room,
        isInitiator: true,
        message: 'Không có thành viên trực tuyến khác. Tự tạo khóa phòng mới.'
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
      iv: messageData.iv || null,
      isEncrypted: Boolean(messageData.isEncrypted),
      // Chữ ký xác thực toàn vẹn HMAC-SHA256 (nếu có)
      hmac: messageData.hmac || null,
      // Tệp đính kèm Base64 (nếu có)
      attachment: hasAttachment
        ? {
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            data: attachment.data,
            iv: attachment.iv || null,
            isEncrypted: Boolean(attachment.isEncrypted)
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

  // Reset phong chat
  socket.on('reset_room_test', ({ room }) => {
    if (!room) return;
    const session = activeSockets.get(socket.id);
    const username = session?.username || 'Người dùng';

    const db = readDatabase();
    db.messages = db.messages.filter((msg) => msg.room !== room);

    for (const record of Array.from(roomJoinedHistory)) {
      if (record.startsWith(`${room}:`)) {
        roomJoinedHistory.delete(record);
      }
    }
    db.joinedHistory = Array.from(roomJoinedHistory);

    db.roomResetIds = db.roomResetIds || {};
    db.roomResetIds[room] = `reset_${Date.now()}`;
    writeDatabase(db);

    console.log(`[Reset Test] "${username}" da reset phong "${room}".`);

    io.emit('room_test_reset', {
      room,
      resetBy: username
    });

    for (const [id, s] of activeSockets.entries()) {
      if (s.room === room) {
        userStatuses.set(s.username, 'offline');
        activeSockets.delete(id);
      }
    }
  });

  // Hỗ trợ sự kiện cũ clear_room_messages (tự động chuyển sang reset_room_test)
  socket.on('clear_room_messages', ({ room }) => {
    const session = activeSockets.get(socket.id);
    const username = session?.username || 'Người dùng';
    const db = readDatabase();
    db.messages = db.messages.filter((msg) => msg.room !== room);
    for (const record of Array.from(roomJoinedHistory)) {
      if (record.startsWith(`${room}:`)) {
        roomJoinedHistory.delete(record);
      }
    }
    db.joinedHistory = Array.from(roomJoinedHistory);
    db.roomResetIds = db.roomResetIds || {};
    db.roomResetIds[room] = `reset_${Date.now()}`;
    writeDatabase(db);

    io.to(room).emit('room_test_reset', { room, resetBy: username });
  });

  // 6. Cập nhật trạng thái người dùng (online, away, offline)
  socket.on('update_status', ({ status }) => {
    const session = activeSockets.get(socket.id);
    if (!session) return;
    if (['online', 'away', 'offline'].includes(status)) {
      session.status = status;
      userStatuses.set(session.username, status);
      io.to(session.room).emit('room_users', getRoomMembers(session.room));
    }
  });

  // 7. Xử lý khi ngắt kết nối (Chuyển sang offline, không phát tin nhắn rời phòng)
  socket.on('disconnect', () => {
    const session = activeSockets.get(socket.id);
    if (session) {
      const { username, room } = session;
      activeSockets.delete(socket.id);
      userStatuses.set(username, 'offline');

      // Cập nhật lại danh sách thành viên trong phòng kèm trạng thái mới
      io.to(room).emit('room_users', getRoomMembers(room));
      console.log(`[Socket] "${username}" đã ngắt kết nối (offline) khỏi phòng "${room}".`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Server listening on port ${PORT}:`);
  console.log(`  Frontend: http://localhost:5173/`);
  console.log(`  Backend:  http://localhost:${PORT}/ (0.0.0.0)\n`);
});
