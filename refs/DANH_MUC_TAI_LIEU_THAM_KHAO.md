# DANH MỤC TÀI LIỆU VÀ MÃ NGUỒN MỞ THAM KHẢO
## BÀI TẬP LỚN MÔN: MẬT MÃ VÀ AN NINH MẠNG - ĐHBK TP.HCM
**Đề tài 1.1: Xây dựng hệ thống Chat và truyền tệp mã hóa đầu cuối (E2EE Chat & File Transfer)**

---

### I. TIÊU CHUẨN MẬT MÃ QUỐC TẾ (RFC & NIST STANDARDS)

1. **RFC 5116 - An Interface and Algorithms for Authenticated Encryption with Associated Data (AEAD)**
   - *Tổ chức ban hành:* Internet Engineering Task Force (IETF).
   - *Nội dung áp dụng:* Định nghĩa chuẩn giao diện mã hóa có xác thực (AEAD), cơ chế kết hợp giữa mã hóa bảo mật (Confidentiality) và xác thực toàn vẹn (Integrity) thông qua thuật toán AES-GCM (Galois/Counter Mode).
   - *Áp dụng trong dự án:* Mã hóa toàn bộ nội dung tin nhắn và tệp đính kèm Base64 giữa các client.
   - *Đường dẫn:* [https://datatracker.ietf.org/doc/html/rfc5116](https://datatracker.ietf.org/doc/html/rfc5116)
   - *Tài liệu tóm tắt nội bộ:* [`./rfcs/RFC5116_AES_GCM_AEAD.md`](./rfcs/RFC5116_AES_GCM_AEAD.md)

2. **NIST SP 800-38D - Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM)**
   - *Tổ chức ban hành:* National Institute of Standards and Technology (NIST).
   - *Nội dung áp dụng:* Hướng dẫn chuẩn hóa chế độ mã hóa khối GCM và tính toán GMAC với kích thước IV (96-bit/12-byte) và Authentication Tag (128-bit/16-byte).
   - *Đường dẫn:* [https://csrc.nist.gov/publications/detail/sp/800-38d/final](https://csrc.nist.gov/publications/detail/sp/800-38d/final)

3. **RFC 3447 / RFC 8017 - Public-Key Cryptography Standards (PKCS) #1: RSA Cryptography Specifications Version 2.2**
   - *Tổ chức ban hành:* RSA Laboratories / IETF.
   - *Nội dung áp dụng:* Định nghĩa cấu trúc khóa RSA (khóa công khai $PublicKey = (n, e)$, khóa bí mật $PrivateKey = (n, d)$), cơ chế đệm PKCS#1 v1.5 và RSA-OAEP (Optimal Asymmetric Encryption Padding).
   - *Áp dụng trong dự án:* Trao đổi Khóa phòng (Room Session Key) an toàn giữa các client tham gia phiên chat.
   - *Đường dẫn:* [https://datatracker.ietf.org/doc/html/rfc8017](https://datatracker.ietf.org/doc/html/rfc8017)
   - *Tài liệu tóm tắt nội bộ:* [`./rfcs/RFC3447_RSA_PKCS1_v2_1.md`](./rfcs/RFC3447_RSA_PKCS1_v2_1.md)

4. **RFC 2104 - HMAC: Keyed-Hashing for Message Authentication**
   - *Tổ chức ban hành:* IETF (H. Krawczyk, M. Bellare, R. Canetti).
   - *Nội dung áp dụng:* Cơ chế tạo mã xác thực thông điệp dựa trên hàm băm mật mã (HMAC-SHA256) sử dụng khóa bí mật chia sẻ:
     $$HMAC(K, m) = H((K \oplus opad) \parallel H((K \oplus ipad) \parallel m))$$
   - *Áp dụng trong dự án:* Gắn chữ ký xác thực vào gói tin WebSocket để chống tấn công giả mạo hoặc chỉnh sửa nội dung trên đường truyền (Tamper-proofing).
   - *Đường dẫn:* [https://datatracker.ietf.org/doc/html/rfc2104](https://datatracker.ietf.org/doc/html/rfc2104)
   - *Tài liệu tóm tắt nội bộ:* [`./rfcs/RFC2104_HMAC.md`](./rfcs/RFC2104_HMAC.md)

5. **RFC 6455 - The WebSocket Protocol**
   - *Tổ chức ban hành:* IETF.
   - *Nội dung áp dụng:* Giao thức truyền thông hai chiều toàn phần (Full-Duplex) trên một kết nối TCP duy nhất, nâng cấp từ HTTP handshake (`Upgrade: websocket`).
   - *Áp dụng trong dự án:* Vận chuyển dữ liệu thời gian thực giữa Client và Relay Server.
   - *Đường dẫn:* [https://datatracker.ietf.org/doc/html/rfc6455](https://datatracker.ietf.org/doc/html/rfc6455)
   - *Tài liệu tóm tắt nội bộ:* [`./rfcs/RFC6455_WebSocket.md`](./rfcs/RFC6455_WebSocket.md)

---

### II. GIÁO TRÌNH & TÀI LIỆU LÝ THUYẾT NỀN TẢNG

1. **Giáo trình Mật mã & An ninh Mạng - Đại học Bách Khoa TP.HCM**
   - *Nội dung tham khảo:* Các mô hình phân phối khóa (Key Distribution Center vs. Asymmetric Key Exchange), cấu trúc mã hóa khối, tấn công Man-in-the-Middle (MitM) và nguyên lý bảo mật đầu cuối (End-to-End Encryption).

2. **Cryptography and Network Security: Principles and Practice (7th/8th Edition)**
   - *Tác giả:* William Stallings.
   - *Chương tham khảo:*
     - Chapter 3 & 7: Block Ciphers, Advanced Encryption Standard (AES) & Modes of Operation (GCM).
     - Chapter 9 & 10: Public-Key Cryptography, RSA and Diffie-Hellman Key Exchange.
     - Chapter 11 & 12: Cryptographic Hash Functions & Message Authentication Codes (MAC / HMAC).

---

### III. THƯ VIỆN MÃ NGUỒN MỞ ĐÃ SỬ DỤNG (OPEN-SOURCE LIBRARIES)

Chi tiết đầy đủ về phiên bản, giấy phép và tài liệu tra cứu xem tại: [`./libraries/THU_VIEN_MA_NGUON_MO.md`](./libraries/THU_VIEN_MA_NGUON_MO.md).

1. **Web Crypto API (W3C Recommendation)**
   - API mật mã nguyên bản chuẩn hóa chạy trực tiếp trong trình duyệt hiện đại (Chromium, Firefox, Safari).
   - Sử dụng cho: `crypto.subtle.generateKey`, `crypto.subtle.encrypt`, `crypto.subtle.decrypt` (AES-256-GCM) và `crypto.subtle.sign` (HMAC).

2. **JSEncrypt (v3.5.4)**
   - Thư viện JavaScript mã nguồn mở cho mật mã bất đối xứng RSA trong trình duyệt.
   - Sử dụng cho: Sinh cặp khóa RSA 1024/2048-bit trên Client, mã hóa Public Key khóa phiên phòng chat.

3. **Crypto-JS (v4.2.0)**
   - Thư viện JavaScript hỗ trợ đầy đủ các thuật toán mật mã chuẩn (AES, SHA-256, HMAC, PBKDF2).
   - Sử dụng cho: Tạo mã xác thực thông điệp HMAC-SHA256, hỗ trợ dẫn xuất khóa và chuyển đổi Base64/Hex an toàn.

4. **Socket.io (v4.8.1) & Socket.io-client**
   - Thư viện mạng thời gian thực Client-Server hai chiều dựa trên nền tảng WebSocket và fallback polling.
   - Sử dụng cho: Vận chuyển gói tin mã hóa, quản lý phòng chat (`room`), phân phối Public Key và chuyển tiếp gói tin (Relay Server).

5. **Express.js (v4.21.2) & CORS (v2.8.5)**
   - Framework Node.js tối giản xử lý REST API đăng ký, đăng nhập tài khoản.

6. **React (v19.3.1) & Vite (v8.3.4)**
   - Nền tảng xây dựng Single Page Application hiện đại với cơ chế Hot Module Replacement (HMR).

---

### IV. TÀI LIỆU KIỂM THỬ AN TOÀN TRUYỀN THÔNG & TẤN CÔNG NGHE LÉN (MitM)

Chi tiết kịch bản bắt gói tin Wireshark, bộ lọc và kết quả kiểm thử an toàn thực nghiệm được trình bày đầy đủ tại: **Báo cáo kỹ thuật (`BaoCao_BTL1.pdf` - Chương 3: Thực nghiệm và Đánh giá An toàn Hệ thống)**.

- Cấu hình bắt gói tin trên card mạng Loopback (Npcap / Wireshark).
- Cú pháp bộ lọc gói tin: `tcp.port == 5000` hoặc bộ lọc WebSocket.
- Phân tích tính an toàn của giao thức: Chứng minh máy chủ trung chuyển (Relay Server) và kẻ nghe lén trung gian hoàn toàn không thể giải mã nội dung tin nhắn hoặc tệp đính kèm do không sở hữu khóa bí mật RSA / Khóa đối xứng AES-GCM.
