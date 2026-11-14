# RFC 2104 - HMAC: Keyed-Hashing for Message Authentication

## 1. TỔNG QUAN
- **Tiêu chuẩn:** RFC 2104 (IETF Network Working Group) & FIPS PUB 198-1.
- **Tác giả:** H. Krawczyk, M. Bellare, R. Canetti.
- **Mục tiêu:** Cung cấp cơ chế xác thực nguồn gốc thông điệp và kiểm tra tính toàn vẹn của dữ liệu dựa trên các hàm băm mật mã lặp (như MD5, SHA-1, SHA-256) kết hợp với một khóa bí mật chia sẻ chung giữa hai bên.

---

## 2. CÔNG THỨC TOÁN HỌC CỦA HMAC

Cho:
- $H$: Hàm băm mật mã (trong dự án sử dụng **SHA-256**, cho đầu ra 256-bit).
- $B$: Kích thước khối của hàm băm (đối với SHA-256 là 64 bytes = 512 bits).
- $L$: Chiều dài đầu ra của hàm băm (đối với SHA-256 là 32 bytes = 256 bits).
- $K$: Khóa bí mật chia sẻ giữa người gửi và người nhận.
- $ipad$: Hằng số đệm bên trong (inner pad), lặp lại byte `0x36` độ dài $B$ bytes.
- $opad$: Hằng số đệm bên ngoài (outer pad), lặp lại byte `0x5C` độ dài $B$ bytes.

Công thức tính:
$$HMAC(K, m) = H\Big((K \oplus opad) \;\parallel\; H\big((K \oplus ipad) \parallel m\big)\Big)$$

Trong đó:
- $\oplus$: Phép XOR bit-by-bit.
- $\parallel$: Phép nối chuỗi (concatenation).

### Ưu điểm vượt trội so với băm thông thường:
1. **Chống tấn công mở rộng chiều dài (Length Extension Attack):** Việc băm hai lớp lồng nhau bảo vệ trạng thái nội bộ của hàm băm Merkle-Damgård, ngăn kẻ tấn công nối thêm dữ liệu vào cuối thông điệp mà không biết khóa $K$.
2. **Độ an toàn gắn liền với độ an toàn của hàm băm nền tảng:** Miễn là SHA-256 chống va chạm tốt, HMAC-SHA256 là tuyệt đối an toàn trước mọi nỗ lực giả mạo.

---

## 3. ÁP DỤNG TRONG DỰ ÁN E2EE CHAT

- **Dẫn xuất khóa HMAC:** Từ Khóa phiên phòng chat `roomKey`, hệ thống thực hiện dẫn xuất ra một khóa bí mật riêng biệt chuyên dùng cho xác thực `hmacKey` (ví dụ: `HMAC_KEY = SHA256(roomKey + ":HMAC_SIGNING_SALT")`).
- **Gắn mã xác thực:** Trước khi phát đi một tin nhắn đã mã hóa `ciphertext`, Client tính toán:
  $$tag = HMAC\text{-}SHA256(hmacKey, ciphertext + iv + sender)$$
- **Kiểm tra tại Client nhận:**
  - Client nhận tính lại $tag'$ dựa trên $ciphertext$ và $iv$ nhận được.
  - So sánh $tag' == tag$.
  - Nếu bằng nhau: Hiển thị huy hiệu `HMAC OK` màu xanh, khẳng định tin nhắn nguyên vẹn và xuất phát từ thành viên hợp lệ trong phòng.
  - Nếu sai lệch: Báo cảnh báo giả mạo hoặc loại bỏ gói tin (chống tấn công sửa đổi MitM).
