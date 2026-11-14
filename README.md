# E2EE Chat - Ứng dụng Chat Realtime Mã hóa Đầu cuối (End-to-End Encryption)

Ứng dụng chat Khách - Chủ (Client-Server) thời gian thực hỗ trợ mã hóa đầu cuối (**End-to-End Encryption - E2EE**), phân phối Khóa phòng qua hệ mật bất đối xứng **RSA 1024-bit**, mã hóa nội dung tin nhắn và tệp tin qua **AES-256-GCM**, và xác thực toàn vẹn bằng **HMAC-SHA256** theo mô hình **Zero-Knowledge Relay Server**.

---

## 1. Tính năng chính

- **Mã hóa đầu cuối (E2EE):** Toàn bộ tin nhắn văn bản và tệp đa phương tiện được mã hóa AES-256 với Vector khởi tạo ($IV$) ngẫu nhiên cho từng gói tin ngay tại trình duyệt của người gửi trước khi truyền lên mạng.
- **Trao đổi Khóa phòng RSA (1024-bit) & Watermarking MSSV:** Các thành viên trong phòng thống nhất Khóa phòng đối xứng qua kênh mạng công cộng bằng thuật toán RSA; nhúng mã số sinh viên (MSSV) và thông điệp đóng dấu bản quyền nhóm vào gói tin bắt tay; Máy chủ trung chuyển hoàn toàn không nắm giữ khóa (Zero-Knowledge).
- **Xác thực toàn vẹn & Chống giả mạo (HMAC-SHA256):** Gắn chữ ký HMAC trên bản mã và danh tính người gửi theo chuẩn RFC 2104, giúp phát hiện và ngăn chặn triệt để tấn công kẻ đứng giữa (MitM) sửa đổi dữ liệu và tấn công giả mạo người gửi (Spoofing).
- **Truyền tệp tin đa phương tiện:** Hỗ trợ truyền hình ảnh (xem trước trực tiếp - inline preview) và tệp tài liệu (PDF, Word, TXT...) với dung lượng lên đến 25MB dưới dạng Base64 đã mã hóa.
- **Đối soát khóa & Handshake Timeline:** Hộp thoại trực quan (KeyDetailsModal) cho phép kiểm tra cặp khóa RSA cá nhân, Khóa phòng AES tất định và dòng thời gian chi tiết các bước bắt tay.
- **Reset tiến trình test:** Hỗ trợ dọn sạch dữ liệu phòng chat trong cơ sở dữ liệu và đồng bộ đăng xuất người dùng để kiểm thử lại chu trình bắt tay từ đầu một cách thuận tiện.
- **Xác thực tài khoản:** Đăng ký, đăng nhập và lưu trữ bền vững trên cơ sở dữ liệu JSON (`database.json`).

---

## 2. Kiến trúc & Công nghệ

| Thành phần | Công nghệ / Thư viện | Phiên bản | Vai trò |
| :--- | :--- | :---: | :--- |
| **Frontend Framework** | React | `^19.3.1` | Xây dựng giao diện ứng dụng web đơn trang (SPA) |
| **Build Tool** | Vite | `^8.3.4` | Build và máy chủ phát triển cục bộ |
| **Mật mã bất đối xứng** | jsencrypt | `^3.5.4` | Sinh cặp khóa RSA 1024-bit và mã hóa/giải mã gói tin bắt tay |
| **Mật mã đối xứng & Hash** | crypto-js | `^4.2.0` | Mã hóa AES, tính mã HMAC-SHA256 và hàm băm SHA-256 |
| **Giao diện & Icon** | Tailwind CSS / Lucide React | `^3.4.17` / `^1.16.0` | Định kiểu giao diện Dark Mode và hệ thống icon |
| **Backend Runtime** | Node.js | `>= 18` | Môi trường thực thi phía máy chủ |
| **Web Server** | Express | `^4.21.2` | REST API đăng ký, đăng nhập tài khoản |
| **Realtime Engine** | Socket.io | `^4.8.1` | WebSocket Relay Server chuyển tiếp bản mã và sự kiện phòng |
| **Database** | Node.js File System (`fs`) | Built-in | Lưu trữ người dùng và bản mã tin nhắn vào `database.json` |
| **Điều phối khởi chạy** | Concurrently | `^9.1.2` | Chạy đồng thời Backend và Frontend trên một terminal duy nhất |

---

## 3. Cấu trúc thư mục dự án

```text
ANM&MM/
├── README.doc                 # Tài liệu hướng dẫn sử dụng hệ thống (Định dạng Word)
├── README.md                  # Hướng dẫn sử dụng và tổng quan hệ thống (Markdown)
├── BaoCao_BTL1.pdf            # Báo cáo kỹ thuật Bài tập lớn số 1
│
├── srcs/                      # TOÀN BỘ MÃ NGUỒN CHƯƠNG TRÌNH
│   ├── package.json           # Điều phối script chạy đồng thời Backend và Frontend
│   ├── package-lock.json
│   ├── backend/               # Server Node.js Express & Socket.io (Port 5000)
│   │   ├── package.json       # Dependencies: express, socket.io, cors
│   │   ├── database.json      # Cơ sở dữ liệu JSON lưu người dùng và bản mã tin nhắn
│   │   └── server.js          # REST API & Socket.io Relay Server (Zero-Knowledge)
│   └── frontend/              # Ứng dụng Web Client (React 19, Vite, Tailwind CSS)
│       ├── package.json       # Dependencies: react, socket.io-client, jsencrypt, crypto-js...
│       ├── vite.config.js     # Cấu hình Vite Dev Server
│       ├── index.html         # Entry HTML
│       └── src/
│           ├── crypto/        # Module mật mã: rsa.js, hmac.js
│           ├── services/      # Module mã hóa đối xứng: aes_service.js
│           ├── components/    # Giao diện Chat, Auth, Header, KeyDetailsModal...
│           └── socket.js      # Socket.io client singleton
│
└── refs/                      # TÀI LIỆU VÀ MÃ NGUỒN MỞ THAM KHẢO
    ├── DANH_MUC_TAI_LIEU_THAM_KHAO.md    # Danh mục tổng hợp giáo trình và tài liệu tham khảo
    ├── libraries/                        # Danh mục thư viện mã nguồn mở và giấy phép
    │   └── THU_VIEN_MA_NGUON_MO.md
    └── rfcs/                             # Tóm tắt các tiêu chuẩn RFC (RFC 5116, 3447, 2104, 6455)
        ├── RFC2104_HMAC.md
        ├── RFC3447_RSA_PKCS1_v2_1.md
        ├── RFC5116_AES_GCM_AEAD.md
        └── RFC6455_WebSocket.md
```

---

## 4. Danh sách các cổng mạng (Ports)

| Dịch vụ | Địa chỉ kết nối | Mô tả |
| :--- | :--- | :--- |
| **Backend Server** | `http://localhost:5000` | REST API (`/api/register`, `/api/login`) & Socket.io Server |
| **Frontend Client** | `http://localhost:5173` | Giao diện người dùng Web (React Vite SPA) |

---

## 5. Hướng dẫn cài đặt và khởi chạy

### 5.1. Yêu cầu hệ thống
- **Node.js** phiên bản `>= 18.0.0` (khuyên dùng Node 20 LTS hoặc Node 22 LTS).
- **npm** phiên bản `>= 9.0.0`.

Kiểm tra phiên bản trong terminal:
```bash
node -v
npm -v
```

### 5.2. Cài đặt thư viện (Installation)
Chuyển vào thư mục `srcs` và chạy lệnh cài đặt tự động cho cả Backend và Frontend:
```bash
cd srcs
npm run install:all
```

*(Hoặc cài đặt thủ công từng phần):*
```bash
cd srcs
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 5.3. Khởi chạy ứng dụng

**Cách 1: Khởi chạy đồng thời bằng một lệnh duy nhất (Khuyên dùng)**
```bash
cd srcs
npm run dev
```
Lệnh trên sẽ tự động khởi động song song:
- Backend Socket.io tại `http://localhost:5000`.
- Frontend Client tại `http://localhost:5173`.

**Cách 2: Khởi chạy trên hai terminal riêng biệt**
- Terminal 1 (Backend):
  ```bash
  cd srcs/backend
  npm run dev
  ```
- Terminal 2 (Frontend):
  ```bash
  cd srcs/frontend
  npm run dev
  ```

---

## 6. Hướng dẫn kiểm thử tính năng (Kịch bản thực nghiệm từ Báo cáo kỹ thuật)

Chi tiết kịch bản kiểm thử bảo mật được xây dựng theo chuẩn thực nghiệm trong **Chương 3 của Báo cáo kỹ thuật (`BaoCao_BTL1.pdf`)**, sử dụng mô hình hai thực thể kinh điển trong mật mã học: **`Alice`** (Chủ phòng / Người tạo và phân phối khóa) và **`Bob`** (Thành viên tham gia / Người nhận khóa).

### Bước 1: Xác thực tài khoản
1. Mở trình duyệt thứ nhất truy cập `http://localhost:5173`.
2. Vào tab **Đăng ký**, tạo tài khoản chủ phòng: `Alice` (mật khẩu: `123456`). Chuyển sang tab **Đăng nhập** để vào ứng dụng.
3. Mở trình duyệt thứ hai (hoặc cửa sổ ẩn danh Incognito) truy cập `http://localhost:5173`.
4. Vào tab **Đăng ký**, tạo tài khoản thành viên: `Bob` (mật khẩu: `123456`) và đăng nhập.

### Bước 2: Kiểm thử bắt tay RSA & Trao đổi Khóa phòng (Handshake & Watermark MSSV)
1. Tài khoản **`Alice`** vào phòng `#general` trước:
   - Vì phòng chưa có ai trực tuyến, Server phát sự kiện `init_room_key_holder`.
   - `Alice` tự động khởi tạo Khóa phòng $K_{\text{master}}$ 256-bit tất định được băm SHA-256 từ 4 MSSV của nhóm:
     `Kmaster = SHA-256("2433220_2410482_2213078_2252211_general")`
   - Huy hiệu Header hiển thị: **Khóa E2EE: Sẵn sàng** (Chủ phòng INITIATOR).
2. Tài khoản **`Bob`** tham gia cùng phòng `#general`:
   - Phía `Bob` gửi sự kiện `join_room` kèm khóa công khai $K_{\text{pub}}^{\text{Bob}}$ lên Server.
   - Server phát hiện `Alice` đang trực tuyến (`onlineDistributor`) và phát sự kiện `req_room_key_distribution`.
   - `Alice` đóng gói Khóa phòng $K_{\text{master}}$ cùng thông điệp Watermarking:
     ```json
     {
       "key": "<Kmaster_Hex>",
       "message": "Hello, We are 2433220, 2410482, 2213078, 2252211"
     }
     ```
   - Hàm `rsaEncrypt` tự động chia nhỏ chuỗi JSON thành các khối tối đa 80 ký tự (Chunked RSA), mã hóa bằng $K_{\text{pub}}^{\text{Bob}}$, ghép nối bằng ký tự `|` và gửi lên Server qua sự kiện `send_encrypted_room_key`.
   - Server chuyển tiếp gói tin tới `Bob` qua sự kiện `receive_encrypted_room_key`.
   - `Bob` dùng khóa riêng $K_{\text{priv}}^{\text{Bob}}$ giải mã từng phân đoạn, khôi phục chuỗi JSON và in thông điệp bản rõ ra DevTools Console:
     `[Handshake Plaintext]: Hello, We are 2433220, 2410482, 2213078, 2252211`
   - Bấm vào biểu tượng **Khóa E2EE: Sẵn sàng** trên thanh Header để mở **KeyDetailsModal**: xem trực quan cặp khóa RSA 1024-bit, Khóa phòng AES, khóa con HMAC và dòng thời gian các sự kiện bắt tay (**Handshake Timeline**).

### Bước 3: Kiểm thử truyền tin nhắn và tệp đa phương tiện mã hóa (AES-256-GCM + HMAC-SHA256)
1. **Gửi tin nhắn văn bản:**
   - Từ tài khoản `Alice`, nhập tin nhắn `hello` và nhấn Gửi.
   - Tin nhắn được mã hóa AES-256 với vector khởi tạo $IV$ ngẫu nhiên và ký xác thực bằng `HMAC-SHA256`.
   - Tài khoản `Bob` nhận được tin nhắn tức thì, hiển thị bong bóng chat với huy hiệu **AES-256** và **HMAC OK** màu xanh lục, xác nhận giải mã thành công tại máy khách.
2. **Gửi tệp đa phương tiện (Hình ảnh / Tài liệu):**
   - Bấm biểu tượng kẹp giấy, chọn gửi tệp hình ảnh (ví dụ: `cat.png`, `images.jfif`) hoặc tệp tài liệu (PDF, Word, dung lượng tối đa 25MB).
   - Dữ liệu tệp được chuyển sang Base64, mã hóa AES-256-GCM và gắn chữ ký HMAC riêng biệt.
   - Phía người nhận hiển thị ảnh xem trước trực tiếp (inline preview) hoặc thẻ tải tài liệu về máy an toàn.

### Bước 4: Kiểm thử bắt gói tin Wireshark & Đánh giá an toàn thực nghiệm (Mục 3.3 Báo cáo)
1. Mở Wireshark, chọn card mạng `Adapter for loopback traffic capture` (hoặc card mạng Wi-Fi nếu thử nghiệm qua mạng LAN).
2. Nhập bộ lọc hiển thị:
   ```text
   tcp.port == 5000 && websocket
   ```
3. Quan sát các gói tin được bắt:
   - **Gói tin bắt tay RSA (`send_encrypted_room_key` / `receive_encrypted_room_key`):** Trường `encryptedKey` hoàn toàn là chuỗi Base64 bản mã phân đoạn. Kẻ nghe lén hoặc Server không có khóa riêng $K_{\text{priv}}^{\text{Bob}}$ nên không thể giải mã để lấy Khóa phòng hay đọc thông điệp Watermark.
   - **Gói tin tin nhắn / tệp (`send_message` / `receive_message`):** Toàn bộ trường `text` và `attachment.data` đều là chuỗi Base64 Ciphertext ngẫu nhiên, vector $IV$ thay đổi độc lập cho từng gói tin, trường `hmac` bảo vệ toàn vẹn. Server chỉ hoạt động như đường ống chuyển tiếp mù (Zero-Knowledge Blind Relay).

### Bước 5: Thực nghiệm 4 kịch bản tấn công theo mô hình đe dọa Dolev-Yao (Mục 3.3.4 Báo cáo)
1. **Kịch bản 1 - Tấn công nghe lén (Sniffing):**
   - Kẻ tấn công dùng Wireshark bắt gói tin trên cổng 5000. Dữ liệu văn bản và tệp tin đều ở dạng bản mã Base64, không lộ bất kỳ thông tin bản rõ nào.
2. **Kịch bản 2 - Can thiệp sửa đổi gói tin (MitM Tampering):**
   - Dùng Burp Suite bắt chặn (Intercept) gói tin `send_message` từ `Alice` gửi đến Server.
   - Sửa đổi một vài ký tự trong chuỗi bản mã Base64 của trường `text`, sau đó nhấn Forward.
   - Khi gói tin đến máy `Bob`, hàm `verifyHMAC` phát hiện chữ ký không khớp với nội dung, lập tức từ chối giải mã và hiển thị bong bóng chat màu đỏ với cảnh báo: **CẢNH BÁO BỊ GIẢ MẠO (MitM)**.
3. **Kịch bản 3 - Tấn công giả mạo danh tính (Spoofing) từ bên trong:**
   - Kẻ tấn công trong phòng dùng Burp Suite Repeater sửa đổi trường `sender` từ `"Alice"` thành `"Bob"`.
   - Do kẻ tấn công không sở hữu khóa bí mật $K_{\text{HMAC}}$ của phòng để tạo lại chữ ký hợp lệ, máy nhận `verifyHMAC` phát hiện sai lệch và lập tức hất văng gói tin, nổ cảnh báo đỏ trên giao diện chat.
4. **Kịch bản 4 - Máy chủ bị xâm phạm (Compromised Server - Đọc trộm & Sửa cơ sở dữ liệu):**
   - *Thực nghiệm 1 (Honest-but-curious):* Mở tệp `srcs/backend/database.json`. Toàn bộ nội dung trò chuyện lưu trên đĩa đều là bản mã Base64 ngẫu nhiên, quản trị viên không thể đọc lén nội dung.
   - *Thực nghiệm 2 (Data Tampering at Rest):* Quản trị viên can thiệp trực tiếp vào `database.json`, sửa `sender: "Bob"` thành `sender: "Alice"`. Khi người dùng F5 tải lại trang, máy khách đối soát HMAC thất bại và hiển thị cảnh báo đỏ **CẢNH BÁO: BỊ GIẢ MẠO (MitM)**.

### Bước 6: Kiểm thử tính năng Reset tiến trình test
1. Bấm nút **Reset tiến trình test** trên thanh Header.
2. Hệ thống phát sự kiện `reset_room_test`: xóa toàn bộ tin nhắn của phòng trong cơ sở dữ liệu, hủy khóa phòng trong `localStorage`, và tự động đồng bộ đăng xuất tất cả các tab trình duyệt về màn hình đăng nhập để sẵn sàng cho phiên kiểm thử mới.
