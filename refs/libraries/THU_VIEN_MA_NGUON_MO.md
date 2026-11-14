# DANH MỤC THƯ VIỆN MÃ NGUỒN MỞ VÀ CÔNG CỤ SỬ DỤNG

Dự án **E2EE Chat (Mã hóa đầu cuối)** tuân thủ nguyên tắc sử dụng các thư viện mã nguồn mở có giấy phép tự do (MIT / Apache 2.0 / W3C), không can thiệp hoặc sử dụng các thư viện vi phạm bản quyền.

---

## 1. BẢNG TỔNG HỢP THƯ VIỆN CLIENT (FRONTEND)

| Tên thư viện | Phiên bản | Giấy phép | Nhà phát triển / Tổ chức | Mục đích sử dụng trong dự án | Trang chủ / Kho mã nguồn |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Web Crypto API** | Chuẩn W3C | W3C Standard | W3C & Browser Vendors | Cung cấp các hàm mật mã bảo mật cấp phần cứng trong trình duyệt: AES-256-GCM, PBKDF2, HMAC-SHA256 | [W3C Spec](https://www.w3.org/TR/WebCryptoAPI/) |
| **jsencrypt** | `^3.5.4` | MIT | Travis Tidwell | Sinh cặp khóa bất đối xứng RSA, thực hiện mã hóa RSA-OAEP / PKCS#1 v1.5 để gửi Khóa phiên (Room Session Key) | [GitHub jsencrypt](https://github.com/travist/jsencrypt) |
| **crypto-js** | `^4.2.0` | MIT | Evan Vosberg | Tính toán mã xác thực thông điệp HMAC-SHA256, mã hóa chuỗi & tệp Base64 phụ trợ | [GitHub crypto-js](https://github.com/brix/crypto-js) |
| **socket.io-client**| `^4.8.1` | MIT | Automattic / Socket.io Team | Kết nối WebSocket thời gian thực tới Backend Relay Server, nhận/gửi sự kiện | [socket.io](https://socket.io/) |
| **react** | `^19.3.1` | MIT | Meta Platforms, Inc. | Thư viện xây dựng giao diện người dùng tương tác dạng Single Page Application (SPA) | [react.dev](https://react.dev/) |
| **react-dom** | `^19.3.1` | MIT | Meta Platforms, Inc. | Gắn kết và điều phối cây DOM cho ứng dụng React trên trình duyệt | [react.dev](https://react.dev/) |
| **vite** | `^8.3.4` | MIT | Evan You / Vite Contributors | Công cụ đóng gói mã nguồn và máy chủ phát triển cục bộ tốc độ cao (ESM HMR) | [vitejs.dev](https://vitejs.dev/) |
| **tailwindcss** | `^3.4.17` | MIT | Tailwind Labs, Inc. | Framework CSS tiện ích giúp xây dựng Dark Mode tối giản, responsive | [tailwindcss.com](https://tailwindcss.com/) |
| **lucide-react** | `^1.16.0` | ISC | Lucide Project | Bộ biểu tượng vector chất lượng cao (Shield, Lock, Key, Send, File, Image...) | [lucide.dev](https://lucide.dev/) |

---

## 2. BẢNG TỔNG HỢP THƯ VIỆN MÁY CHỦ (BACKEND)

| Tên thư viện | Phiên bản | Giấy phép | Nhà phát triển / Tổ chức | Mục đích sử dụng trong dự án | Trang chủ / Kho mã nguồn |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | MIT | OpenJS Foundation | Môi trường thực thi JavaScript phía máy chủ | [nodejs.org](https://nodejs.org/) |
| **express** | `^4.21.2` | MIT | OpenJS Foundation | Web Framework xây dựng các REST API (`/api/register`, `/api/login`) | [expressjs.com](https://expressjs.com/) |
| **socket.io** | `^4.8.1` | MIT | Automattic / Socket.io Team | Máy chủ truyền thông thời gian thực trung chuyển tin nhắn (Relay Server) và quản lý room | [socket.io](https://socket.io/) |
| **cors** | `^2.8.5` | MIT | Troy Goode | Middleware xử lý Cross-Origin Resource Sharing, cho phép client gọi API qua mạng LAN | [npm cors](https://www.npmjs.com/package/cors) |
| **dotenv** | `^16.4.7` | BSD-2-Clause | Mot Dotla | Tải biến môi trường cấu hình từ file `.env` | [npm dotenv](https://www.npmjs.com/package/dotenv) |

---

## 3. CÔNG CỤ ĐIỀU PHỐI & PHÁT TRIỂN (DEVELOPMENT TOOLS)

| Tên công cụ | Phiên bản | Vai trò |
| :--- | :---: | :--- |
| **concurrently** | `^9.1.2` | Cho phép chạy song song cả Backend Express và Frontend Vite qua một lệnh duy nhất (`npm run dev`) |
| **Wireshark** | `4.x` | Phần mềm phân tích giao thức mạng, dùng để bắt gói tin kiểm thử tính bí mật của bản mã và phân tích tấn công MitM |
| **Npcap** | `1.7+` | Thư viện thu thập gói tin mạng cho Windows, hỗ trợ bắt gói tin trên loopback adapter (`127.0.0.1`) |
