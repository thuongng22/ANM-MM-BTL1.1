import { io } from 'socket.io-client';

// Kết nối động (Dynamic URL) dựa vào hostname trình duyệt đang truy cập (localhost hoặc IP LAN)
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

// Khởi tạo instance socket đơn nhất (Singleton)
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
