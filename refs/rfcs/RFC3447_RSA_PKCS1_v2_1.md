# RFC 3447 / RFC 8017 - PKCS #1: RSA Cryptography Specifications Version 2.2

## 1. TỔNG QUAN
- **Tiêu chuẩn:** RFC 3447 (PKCS #1 v2.1) & RFC 8017 (PKCS #1 v2.2).
- **Tên đầy đủ:** *Public-Key Cryptography Standards (PKCS) #1: RSA Cryptography Specifications*.
- **Tác giả:** J. Jonsson, B. Kaliski (RSA Laboratories).
- **Mục tiêu:** Định nghĩa chuẩn biểu diễn khóa, thuật toán sinh khóa, sơ đồ mã hóa bất đối xứng và sơ đồ chữ ký số dựa trên bài toán phân tích thừa số nguyên tố lớn của RSA.

---

## 2. NGUYÊN LÝ TOÁN HỌC CỦA HỆ MẬT RSA

1. **Sinh cặp khóa:**
   - Chọn hai số nguyên tố rất lớn bí mật $p$ và $q$.
   - Tính modulo $n = p \times q$. Độ dài của $n$ quyết định độ dài khóa (ví dụ 1024-bit hoặc 2048-bit).
   - Tính giá trị hàm phi Euler: $\phi(n) = (p - 1)(q - 1)$.
   - Chọn số mũ công khai $e$ thỏa mãn $1 < e < \phi(n)$ và $\gcd(e, \phi(n)) = 1$ (thông thường chọn $e = 65537 = 2^{16} + 1$).
   - Tính số mũ bí mật $d$ là nghịch đảo modulo của $e$: $d \equiv e^{-1} \pmod{\phi(n)}$.
   - **Khóa công khai (Public Key):** $(e, n)$.
   - **Khóa bí mật (Private Key):** $(d, n)$.

2. **Mã hóa (Encryption) & Giải mã (Decryption):**
   - Mã hóa bản rõ $m$ (với $0 \le m < n$): $c = m^e \pmod{n}$.
   - Giải mã bản mã $c$: $m = c^d \pmod{n}$.

3. **Cơ chế đệm an toàn:**
   - Mã hóa RSA thuần túy (Textbook RSA) có tính chất đồng hình nhân, dễ bị tấn công nếu dữ liệu ngắn.
   - Chuẩn PKCS #1 định nghĩa hai cơ chế đệm:
     - **PKCS#1 v1.5 Padding:** Thêm byte ngẫu nhiên trước dữ liệu để chống tấn công đoán trước bản rõ.
     - **RSA-OAEP (Optimal Asymmetric Encryption Padding):** Sử dụng các hàm băm ngẫu nhiên (MGF1) tạo ra mức độ an toàn ngữ nghĩa IND-CCA2.

---

## 3. ÁP DỤNG TRONG DỰ ÁN E2EE CHAT

- **Vấn đề cần giải quyết:** Thuật toán mã hóa đối xứng AES-GCM rất nhanh nhưng đòi hỏi hai bên phải có cùng một khóa đối xứng bí mật. Nếu gửi khóa AES này dưới dạng bản rõ lên Server thì Server sẽ đọc được (mất tính E2EE).
- **Giải pháp Asymmetric Key Exchange:**
  - Mỗi Client khi vào phòng sẽ sinh một cặp khóa RSA (hoặc Client chủ phòng / Master Client).
  - Client công khai `PublicKey` (chuỗi định dạng PEM) lên Server để chuyển tiếp tới các thành viên trong phòng.
  - Khóa phiên đối xứng (`roomKey`) sẽ được mã hóa bằng `PublicKey` của người nhận:
    $$\text{EncryptedSessionKey} = \text{RSA\_Encrypt}(\text{PublicKey}_{\text{Bob}}, \text{RoomKey})$$
  - Chỉ người nhận (Bob) nắm giữ `PrivateKey` tương ứng mới có thể giải mã để lấy ra `RoomKey`:
    $$\text{RoomKey} = \text{RSA\_Decrypt}(\text{PrivateKey}_{\text{Bob}}, \text{EncryptedSessionKey})$$
  - Relay Server chỉ chuyển tiếp chuỗi mã hóa mà **hoàn toàn không thể suy ra khóa bí mật của người dùng**.
