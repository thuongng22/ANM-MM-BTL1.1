# RFC 5116 - Authenticated Encryption with Associated Data (AEAD) & NIST SP 800-38D (AES-GCM)

## 1. TỔNG QUAN
- **Tiêu chuẩn:** RFC 5116 (IETF) & NIST SP 800-38D.
- **Tên đầy đủ:** *An Interface and Algorithms for Authenticated Encryption with Associated Data (AEAD)*.
- **Mục tiêu:** Cung cấp đồng thời cả tính **Bí mật (Confidentiality)** và tính **Xác thực / Toàn vẹn (Authenticity / Integrity)** trong một thao tác mật mã duy nhất, loại bỏ rủi ro do việc tự kết hợp độc lập thuật toán mã hóa (CBC mode) và hàm băm (HMAC) gây ra (như tấn công Padding Oracle).

---

## 2. NGUYÊN LÝ HOẠT ĐỘNG CỦA AES-GCM (GALOIS/COUNTER MODE)

AES-GCM là chế độ kết hợp giữa:
1. **CTR Mode (Counter Mode):** Đảm bảo mã hóa dữ liệu thành dòng (stream-like) với hiệu năng xử lý song song cực cao.
2. **GMAC (Galois Message Authentication Code):** Sử dụng nhân đa thức trên trường hữu hạn $GF(2^{128})$ để tính toán mã xác thực (Authentication Tag).

### Cấu trúc dữ liệu đầu vào:
- **Khóa bí mật ($K$):** 256-bit (AES-256) mang lại độ bảo mật chống giải mã cao nhất.
- **Vector khởi tạo ngẫu nhiên ($IV$ hay Nonce):** 96-bit (12 bytes) được sinh ngẫu nhiên cho **mỗi lần mã hóa**. Không tái sử dụng cùng một bộ $(K, IV)$ để đảm bảo an toàn.
- **Bản rõ ($Plaintext$):** Nội dung tin nhắn văn bản (UTF-8) hoặc tệp Base64 (Ảnh, Tài liệu).
- **Dữ liệu xác thực bổ sung ($AAD$ - Optional):** Metadata không cần mã hóa nhưng cần được bảo vệ toàn vẹn.

### Cấu trúc dữ liệu đầu ra:
- **Bản mã ($Ciphertext$):** Dữ liệu sau khi mã hóa bằng bộ sinh khóa dòng CTR.
- **Thẻ xác thực ($AuthTag$):** 128-bit (16 bytes) chứng minh tính toàn vẹn của Ciphertext và AAD.

---

## 3. ÁP DỤNG TRONG DỰ ÁN E2EE CHAT

- **Thực thi:** Sử dụng chuẩn `Web Crypto API` (`window.crypto.subtle`) sẵn có trong trình duyệt:
  ```javascript
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivArray },
    cryptoKey,
    encodedPlaintext
  );
  ```
- **Quy trình truyền tin:**
  - Client A sinh `IV` ngẫu nhiên 12-byte cho mỗi tin nhắn hoặc file.
  - Mã hóa bản rõ với `roomKey` đối xứng 256-bit.
  - Gói tin gửi qua Socket.io: `{ text: base64Ciphertext, iv: base64IV, isEncrypted: true, hmac: hmacSig }`.
  - Server Node.js đóng vai trò Relay trung chuyển, lưu trữ bản mã mà **hoàn toàn không có khóa để giải mã**.
  - Client B nhận gói tin, sử dụng `roomKey` và `iv` đính kèm để giải mã về bản rõ.
