# RFC 6455 - The WebSocket Protocol

## 1. TỔNG QUAN
- **Tiêu chuẩn:** RFC 6455 (IETF).
- **Tên giao thức:** *The WebSocket Protocol*.
- **Tác giả:** I. Fette, A. Melnikov.
- **Mục tiêu:** Cung cấp kênh truyền thông hai chiều toàn phần (Full-Duplex Communication), hướng thông điệp (Message-based) trên một kết nối TCP duy nhất giữa trình duyệt (Client) và máy chủ (Server) với độ trễ tối thiểu và overhead gói tin cực nhỏ so với HTTP Polling truyền thống.

---

## 2. NGUYÊN LÝ BẮT TAY & TRUYỀN DỮ LIỆU

### 2.1. Quá trình bắt tay nâng cấp (HTTP Upgrade Handshake)
Client gửi yêu cầu HTTP GET với các header đặc thù:
```http
GET /socket.io/?EIO=4&transport=websocket HTTP/1.1
Host: localhost:5000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```
Server phản hồi mã trạng thái `101 Switching Protocols`:
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
Sau bước này, kết nối TCP được giữ nguyên và chuyển sang truyền các khung dữ liệu nhị phân/văn bản (WebSocket Frames) thay vì gửi lại HTTP Request Header cồng kềnh.

### 2.2. Khung dữ liệu (Frame Format)
Mỗi khung dữ liệu WebSocket có phần header nhỏ chỉ từ 2 đến 10 bytes:
- **FIN (1 bit):** Báo hiệu frame cuối cùng của thông điệp.
- **Opcode (4 bits):** Loại thông điệp (`0x1` cho text UTF-8, `0x2` cho nhị phân, `0x8` cho đóng kết nối, `0x9`/`0xA` cho Ping/Pong giữ nhịp tim).
- **MASK (1 bit):** Bắt buộc phải bật khi Client gửi lên Server để ngăn chặn tấn công Cache Poisoning ở các proxy trung gian.
- **Payload Length:** Chiều dài dữ liệu thực tế.

---

## 3. VAI TRÒ CỦA SOCKET.IO TRONG HỆ THỐNG E2EE CHAT

- **Kênh vận chuyển bản mã:** Socket.io trừu tượng hóa WebSocket, cung cấp cơ chế phân phòng (`socket.join(room)`), phát thông điệp tới phòng (`io.to(room).emit(...)`) và tự động kết nối lại (auto-reconnect).
- **Relay Server không tin cậy (Zero-Knowledge Relay Server):**
  - Mọi dữ liệu đi qua đường truyền WebSocket đều là chuỗi Base64 đã được mã hóa ở tầng ứng dụng bằng AES-GCM và ký xác thực bằng HMAC.
  - Server chuyển tiếp gói tin đến đúng phòng mà không có khả năng đọc trộm hoặc chỉnh sửa dữ liệu của người dùng.
