# E2EE Chat - Ứng dụng Chat Realtime Mã hóa Đầu cuối

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**E2EE Chat** là ứng dụng nhắn tin thời gian thực (Realtime Chat Application) client-server, được xây dựng theo kiến trúc hiện đại, giao diện Dark Mode tối giản, sang trọng (*Ink-violet night, Indigo action pills*). 

Hệ thống hỗ trợ xác thực tài khoản, phân chia phòng chat linh hoạt, lưu trữ và tải lại lịch sử tin nhắn tự động từ tệp tin JSON thông qua Node.js `fs`, cùng khả năng truyền tải hình ảnh và tệp tài liệu trực tiếp dưới dạng chuỗi Base64 qua WebSocket.

---

## 🌟 Tính năng nổi bật

- **Giao diện Dark Mode tối giản**: Thiết kế hiện đại, màu nền đêm tím mực (`#171721`), các nút hành động viên thuốc Indigo (`#5266eb`), thẻ tin nhắn nổi (`#1e1e2a`), phông chữ Inter thanh mảnh.
- **Hệ thống Đăng nhập / Đăng ký**: Hỗ trợ tạo tài khoản và đăng nhập với cơ chế lưu trữ bảo đảm qua REST API (`/api/register`, `/api/login`).
- **Lưu trữ JSON Database (`fs`)**: Dữ liệu người dùng và toàn bộ tin nhắn được ghi nhận bền vững vào file `backend/database.json`.
- **Nhắn tin thời gian thực (Socket.io)**: Kết nối hai chiều với độ trễ cực thấp giữa các client, tự động nhận biết trạng thái kết nối trực tuyến/mất kết nối.
- **Tự động khôi phục lịch sử**: Khi người dùng vào hoặc đổi phòng (`join_room`), toàn bộ tin nhắn cũ của phòng đó được nạp lại tự động (`room_history`).
- **Truyền tệp đính kèm (Media & File Transfer)**:
  - **Hình ảnh (`image/*`)**: Xem ảnh trực tiếp (inline preview) trong bong bóng chat kèm kích thước và tên tệp.
  - **Tài liệu (PDF, Word, TXT, ZIP...)**: Hiển thị dưới dạng thẻ tải về tiện lợi, bấm để tải ngay về máy tính.
- **Bộ điều phối khởi chạy một lệnh (Single Command Runner)**: Điều phối song song cả Backend và Frontend qua `concurrently`, hỗ trợ an toàn ký tự đặc biệt trên hệ điều hành Windows.

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)

| Thành phần | Công nghệ | Phiên bản | Vai trò |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.3.1` | Xây dựng giao diện Single Page Application (SPA) |
| **Build Tool** | Vite | `^8.3.4` | Hot Module Replacement (HMR), build siêu tốc |
| **Styling** | Tailwind CSS | `^3.4.17` | Utility-first CSS thiết kế Dark Mode tối giản |
| **Icon Set** | Lucide React | `^1.16.0` | Bộ biểu tượng vector tối giản, sắc nét |
| **Backend Runtime** | Node.js | `>= 18` | Môi trường thực thi JavaScript phía máy chủ |
| **Web Server** | Express | `^4.21.2` | Xử lý REST API endpoints và Middleware |
| **Realtime Engine** | Socket.io | `^4.8.1` | Giao thức WebSocket truyền tin nhắn và tệp hai chiều |
| **Database** | Node.js File System (`fs`) | Built-in | Đọc/ghi dữ liệu vào `database.json` |
| **Dev Orchestration** | Concurrently | `^9.1.2` | Chạy đồng thời Backend và Frontend trên cùng 1 terminal |

---

## 📁 Cấu trúc thư mục dự án

```text
ANM&MM/
├── DESIGN.md                  # Bản quy chuẩn thiết kế giao diện (Design Tokens)
├── ARCHITECTURE.md            # Tài liệu kiến trúc kỹ thuật sâu & Sơ đồ luồng
├── README.md                  # Tài liệu tổng quan & hướng dẫn sử dụng dự án
├── package.json               # Script khởi chạy đồng bộ môi trường gốc
│
├── backend/                   # Môi trường Máy chủ (Server)
│   ├── package.json           # Dependencies: express, socket.io, cors
│   ├── database.json          # Cơ sở dữ liệu JSON: { "users": [], "messages": [] }
│   └── server.js              # REST API xác thực & Socket.io Event Handlers
│
└── frontend/                  # Môi trường Giao diện (Client)
    ├── package.json           # Dependencies: react, socket.io-client, lucide-react, tailwindcss
    ├── vite.config.js         # Cấu hình Vite Dev Server
    ├── tailwind.config.js     # Thiết lập Theme Dark Mode (Night, Indigo, Slate, Periwinkle)
    ├── postcss.config.js      # PostCSS configuration
    ├── index.html             # Entry HTML với SEO metadata chuẩn
    └── src/
        ├── index.css          # Import Google Fonts Inter & Tailwind directives
        ├── main.jsx           # Điểm khởi tạo ứng dụng React
        ├── socket.js          # Socket.io client singleton
        ├── App.jsx            # Điều phối phiên làm việc (Auth vs Chat Session)
        └── components/
            ├── Auth.jsx         # Form Đăng nhập & Đăng ký tài khoản
            ├── Chat.jsx         # Component quản trị phòng chat & lịch sử
            ├── Header.jsx       # Header điều hướng, chuyển đổi phòng & Đăng xuất
            ├── MessageList.jsx  # Danh sách bong bóng chat, hình ảnh & file đính kèm
            └── MessageInput.jsx # Thanh soạn thảo văn bản & bộ chuyển đổi Base64
```

---

## 🔌 Danh sách các cổng mạng (Ports)

| Dịch vụ | Địa chỉ kết nối | Mô tả |
| :--- | :--- | :--- |
| **Backend Server** | `http://localhost:5000` | REST API (`/api/register`, `/api/login`) & Socket.io WebSocket Server |
| **Frontend Client** | `http://localhost:5173` | Giao diện người dùng Web (React Vite SPA) |

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Yêu cầu tiên quyết (Prerequisites)
- Đã cài đặt **Node.js** phiên bản `>= 18.0.0` (Khuyên dùng Node 20 LTS hoặc Node 24).
- Trình quản lý gói **npm** phiên bản `>= 9.0.0`.

Kiểm tra phiên bản trong terminal:
```bash
node -v
npm -v
```

---

### 2. Cài đặt các gói thư viện (Installation)

Đứng tại thư mục gốc của dự án (`e:\BTL\ANM&MM`), chạy lệnh sau để tự động cài đặt dependencies cho cả thư mục gốc, backend và frontend:

```bash
npm run install:all
```

*(Hoặc cài đặt thủ công từng thư mục nếu muốn):*
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

### 3. Khởi chạy ứng dụng (How to Run)

#### Cách 1: Khởi chạy đồng thời cả hai môi trường (Khuyên dùng)
Ngay tại thư mục gốc của dự án, chạy lệnh:

```bash
npm run dev
```

Lệnh này sẽ tự động khởi động:
- `[BACKEND]`: Server Socket.io tại `http://localhost:5000` (có cơ chế tự reload `--watch`).
- `[FRONTEND]`: Ứng dụng React Vite tại `http://localhost:5173`.
- Terminal sẽ hiển thị log màu tách biệt: màu **tím hồng (magenta)** cho Backend và màu **xanh lơ (cyan)** cho Frontend.

#### Cách 2: Khởi chạy trên 2 terminal độc lập

- **Terminal 1 (Backend):**
  ```bash
  cd backend
  npm run dev
  ```

- **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🧪 Hướng dẫn kiểm thử tính năng (Testing Flow)

1. **Khởi chạy ứng dụng**: Chạy `npm run dev` và mở trình duyệt tới địa chỉ `http://localhost:5173`.
2. **Đăng ký tài khoản mới**:
   - Chọn tab **Đăng ký**, nhập Tên đăng nhập và Mật khẩu (ví dụ: `Alice` / `123456`).
   - Nhấn **Tạo tài khoản**. Hệ thống lưu tài khoản vào `backend/database.json`.
3. **Đăng nhập**:
   - Chuyển sang tab **Đăng nhập**, nhập thông tin vừa tạo và bấm **Đăng nhập**.
4. **Kiểm thử nhắn tin đa người dùng**:
   - Mở thêm một tab trình duyệt khác (hoặc cửa sổ ẩn danh `Incognito`).
   - Đăng ký và đăng nhập với tài khoản thứ hai (ví dụ: `Bob`).
   - Cả 2 tài khoản cùng vào phòng `#general`.
   - Gõ tin nhắn từ Tab 1 $\rightarrow$ Tab 2 nhận được ngay lập tức theo thời gian thực.
   - Tin nhắn của bạn hiển thị bên phải với màu **Indigo Action Pill** (`#5266eb`), tin người khác hiển thị bên trái với màu **Night-raised** (`#1e1e2a`).
5. **Kiểm thử gửi tệp đính kèm (Base64)**:
   - Bấm vào biểu tượng **Kẹp giấy (Paperclip)** ở thanh nhập tin nhắn.
   - Chọn một bức ảnh hoặc tệp tài liệu (PDF, Word, TXT...).
   - Quan sát khung preview xuất hiện phía trên ô nhập. Có thể nhập thêm văn bản chú thích nếu muốn.
   - Bấm **Gửi**. Phía người nhận sẽ hiển thị ảnh trực tiếp (đối với ảnh) hoặc khối tải về với nút Download (đối với tài liệu).
6. **Kiểm thử lưu trữ & tải lại lịch sử**:
   - F5 (Reload) lại trình duyệt hoặc bấm **Đăng xuất** rồi đăng nhập lại.
   - Toàn bộ tin nhắn và tệp đính kèm đã gửi trước đó vẫn được tải lại đầy đủ từ `database.json`.

---

