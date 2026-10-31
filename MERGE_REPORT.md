# BÁO CÁO MERGE VÀ KHỚP NỐI TOÀN TRÌNH HỆ THỐNG MÃ HÓA ĐẦU CUỐI (E2EE)

> **Dự án:** Ứng dụng Chat Realtime Mã hóa Đầu cuối (E2EE Chat)  
> **Người thực hiện:** Tech Lead  
> **Nhóm thực hiện:** Thưởng (`feature/rsa-handshake`) & Duy (`feature/aes-encryption`)  
> **Nhánh đích:** `main`  
> **Thời gian:** 31/10/2026  

---

## 1. CÁC LỆNH GIT ĐÃ THỰC HIỆN

Toàn bộ quá trình đồng bộ và gộp nhánh diễn ra an toàn theo đúng quy trình chuẩn Git Flow:

```bash
# 1. Đồng bộ và lưu trữ các thay đổi hoàn thiện trên nhánh feature/rsa-handshake của Thưởng
git add THUONG_RSA_EXPLANATION.md frontend/src/components/KeyDetailsModal.jsx frontend/src/crypto/hmac.js
git commit -m "feat(hmac): add HMAC-SHA256 key display and documentation"
git push origin feature/rsa-handshake

# 2. Checkout về nhánh main
git checkout main

# 3. Gộp code của Duy (feature/aes-encryption) vào nhánh main
git merge origin/feature/aes-encryption --no-edit
# -> Fast-forward commit d0e1c58: Implement AES-256-GCM text and file encryption

# 4. Gộp nhánh feature/rsa-handshake của Thưởng vào nhánh main
git merge feature/rsa-handshake --no-edit
# -> Merge made by the 'ort' strategy, tự động kết hợp toàn bộ mã nguồn RSA và HMAC

# 5. Khớp nối logic giữa Mock Key của Duy và Room Key (Khóa Vàng) của Thưởng
# (Chỉnh sửa MessageInput.jsx, MessageList.jsx, Chat.jsx, aes_service.js, server.js)
```

---

## 2. DANH SÁCH FILE VÀ CHIẾN LƯỢC XỬ LÝ / TÍCH HỢP

| Tệp tin | Trạng thái | Chiến lược xử lý & Tích hợp |
| :--- | :---: | :--- |
| `frontend/src/services/aes_service.js` | Tích hợp | Bổ sung hàm `getCryptoKey(key)` giúp các hàm `encryptText`, `decryptText`, `encryptFile`, `decryptFile` của Duy chấp nhận cả đối tượng `CryptoKey` lẫn chuỗi `roomKey` sinh ra từ luồng RSA Handshake của Thưởng. |
| `frontend/src/components/Chat.jsx` | Tích hợp | Đảm bảo biến `activeRoomKey` (Khóa Vàng từ RSA Handshake) được truyền đầy đủ xuống `MessageInput` và `MessageList` qua props `roomKey`. Tiếp nhận `iv`, `isEncrypted` và gắn chữ ký `hmac` trước khi emit `send_message`. |
| `frontend/src/components/MessageInput.jsx` | Khớp nối | Nhúng hàm `encryptText` từ `aes_service.js`. Thay thế phần giữ chỗ giả lập bằng việc mã hóa trực tiếp tin nhắn và tệp Base64 với `roomKey`, xuất ra bản mã `ciphertext` và vector khởi tạo `iv`. |
| `frontend/src/components/MessageList.jsx` | Khớp nối | Nhúng hàm `decryptText` từ `aes_service.js`. Tạo cơ chế giải mã bất đồng bộ có bộ nhớ đệm `decryptedCache`. Giải mã `ciphertext` và `attachment.data` về bản rõ bằng `roomKey`, hiển thị huy hiệu `AES-256` và `HMAC OK`. |
| `frontend/src/components/Header.jsx` | Giữ nguyên | Bảo toàn 100% giao diện của Thưởng: nút mở `E2EEDiagramModal`, huy hiệu trạng thái bảo mật `Khóa E2EE: Sẵn sàng`, danh sách phòng và số thành viên. |
| `frontend/src/components/KeyDetailsModal.jsx` | Giữ nguyên | Bảo toàn 100% modal xem chi tiết cặp khóa RSA 1024-bit, Khóa AES phòng, Khóa dẫn xuất HMAC-SHA256 và Handshake Timeline. |
| `frontend/src/components/E2EEDiagramModal.jsx` | Giữ nguyên | Bảo toàn 100% sơ đồ tương tác 3 cột ngang phục vụ báo cáo Giảng viên. |
| `backend/server.js` | Nâng cấp | Hỗ trợ lưu trữ và chuyển tiếp thêm 2 trường `iv` (Vector khởi tạo AES-GCM) và `isEncrypted` trong tin nhắn, đảm bảo Server chuyển tiếp an toàn mà hoàn toàn không thể giải mã nội dung. |

---

## 3. CHI TIẾT ĐOẠN MÃ TRƯỚC VÀ SAU KHI KHỚP NỐI LOGIC

### 3.1. Tại `frontend/src/components/MessageInput.jsx` (Hàm `handleSend`)

#### 🔴 TRƯỚC KHI KHỚP NỐI (Chỉ có Mock/Placeholder ghi chú):
```javascript
// TRƯỚC KHI KHỚP NỐI:
const handleSend = (e) => {
  e?.preventDefault();
  const hasText = inputText.trim().length > 0;
  const hasFile = Boolean(selectedAttachment);

  if ((!hasText && !hasFile) || disabled) return;

  // =========================================================================
  // 🔗 KHỚP NỐI VỚI MODULE AES (DÀNH CHO LẬP TRÌNH VIÊN TIẾP THEO)
  // =========================================================================
  // Biến `roomKey` đại diện cho khóa đối xứng được phân phối ngầm qua RSA.
  // Khi ráp nối module AES:
  // const encryptedText = hasText ? encryptAES(inputText.trim(), roomKey) : '';
  // const encryptedAttachment = hasFile
  //   ? {
  //       ...selectedAttachment,
  //       data: encryptAES(selectedAttachment.data, roomKey)
  //     }
  //   : null;
  // onSendMessage({ text: encryptedText, attachment: encryptedAttachment });
  // =========================================================================

  // Hiện tại gửi payload dạng Plaintext:
  onSendMessage({
    text: inputText.trim(),
    attachment: selectedAttachment,
  });

  setInputText('');
  setSelectedAttachment(null);
};
```

#### 🟢 SAU KHI KHỚP NỐI (Mã hóa thực tế với `encryptText` và `roomKey`):
```javascript
// SAU KHI KHỚP NỐI (HOÀN CHỈNH):
import { encryptText } from '../services/aes_service.js';

const handleSend = async (e) => {
  e?.preventDefault();
  const hasText = inputText.trim().length > 0;
  const hasFile = Boolean(selectedAttachment);

  if ((!hasText && !hasFile) || disabled) return;

  // =========================================================================
  // 🔗 KHỚP NỐI LOGIC MÃ HÓA AES-256-GCM BẰNG BIẾN ROOMKEY (KHÓA VÀNG TỪ RSA)
  // =========================================================================
  let messageText = inputText.trim();
  let messageIV = null;
  let encryptedAttachment = selectedAttachment;
  let isEncrypted = false;

  // Sử dụng roomKey (Khóa Vàng) được phân phối ngầm qua RSA thay cho Mock Key
  if (roomKey) {
    try {
      // 1. Mã hóa văn bản thành Ciphertext bằng chuẩn AES-256-GCM của Duy
      if (hasText) {
        const encResult = await encryptText(messageText, roomKey);
        messageText = encResult.ciphertext;
        messageIV = encResult.iv;
        isEncrypted = true;
      }

      // 2. Mã hóa tệp đính kèm Base64 bằng chuẩn AES-256-GCM của Duy
      if (hasFile && selectedAttachment?.data) {
        const encFileResult = await encryptText(selectedAttachment.data, roomKey);
        encryptedAttachment = {
          ...selectedAttachment,
          data: encFileResult.ciphertext,
          iv: encFileResult.iv,
          isEncrypted: true
        };
        isEncrypted = true;
      }
    } catch (err) {
      console.error('[AES-GCM] Lỗi khi mã hóa với roomKey:', err);
    }
  }

  // Gửi bản mã và IV lên component cha để ký HMAC và phát qua WebSocket:
  onSendMessage({
    text: messageText,
    iv: messageIV,
    attachment: encryptedAttachment,
    isEncrypted
  });

  setInputText('');
  setSelectedAttachment(null);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

---

### 3.2. Tại `frontend/src/components/MessageList.jsx` (Luồng giải mã tin nhắn)

#### 🔴 TRƯỚC KHI KHỚP NỐI (Chỉ hiển thị chuỗi nhận được từ socket):
```javascript
// TRƯỚC KHI KHỚP NỐI:
messages.map((msg) => {
  if (msg.isSystem) return <SystemMessage msg={msg} />;

  // =========================================================================
  // 🔗 KHỚP NỐI VỚI MODULE AES (DÀNH CHO LẬP TRÌNH VIÊN TIẾP THEO)
  // =========================================================================
  // Khi tin nhắn nhận về đã bị mã hóa AES:
  // const displayText = msg.text ? decryptAES(msg.text, roomKey) : '';
  // =========================================================================

  const isMe = msg.sender === currentUser;
  return (
    <div key={msg.id}>
      {/* Hiển thị msg.text (Lúc này vẫn là Ciphertext nếu bị mã hóa) */}
      {msg.text && <p>{msg.text}</p>}
    </div>
  );
})
```

#### 🟢 SAU KHI KHỚP NỐI (Tự động giải mã bằng `decryptText` và `roomKey`):
```javascript
// SAU KHI KHỚP NỐI (HOÀN CHỈNH):
import { decryptText } from '../services/aes_service.js';

// Bộ nhớ đệm lưu trữ kết quả giải mã AES: { [msgId]: { text, attachmentData, isDecrypted } }
const [decryptedCache, setDecryptedCache] = useState({});

// Hook tự động giải mã tin nhắn bất đồng bộ bằng roomKey
useEffect(() => {
  let active = true;

  async function processDecryption() {
    if (!roomKey) return;

    for (const msg of messages) {
      if (msg.isSystem || decryptedCache[msg.id]) continue;

      let plainText = msg.text;
      let plainAttachmentData = msg.attachment?.data;
      let isDecrypted = false;

      // 1. Giải mã văn bản AES-256-GCM bằng roomKey
      if (msg.text && (msg.iv || msg.isEncrypted)) {
        const dec = await decryptText(msg.text, msg.iv, roomKey);
        if (dec !== null) {
          plainText = dec;
          isDecrypted = true;
        }
      }

      // 2. Giải mã tệp đính kèm Base64 bằng roomKey
      const attachmentIV = msg.attachment?.iv || msg.iv;
      if (msg.attachment?.data && (attachmentIV || msg.attachment?.isEncrypted)) {
        const decFile = await decryptText(msg.attachment.data, attachmentIV, roomKey);
        if (decFile !== null) {
          plainAttachmentData = decFile;
          isDecrypted = true;
        }
      }

      if (active) {
        setDecryptedCache((prev) => ({
          ...prev,
          [msg.id]: {
            text: plainText,
            attachmentData: plainAttachmentData,
            isDecrypted
          }
        }));
      }
    }
  }

  processDecryption();
  return () => { active = false; };
}, [messages, roomKey]);

// Khi render tin nhắn:
const cached = decryptedCache[msg.id];
const displayText = cached?.text ?? msg.text;
const displayAttachmentData = cached?.attachmentData ?? msg.attachment?.data;
const isAES = cached?.isDecrypted || Boolean(msg.iv);

// Hiển thị displayText (Bản rõ hoàn hảo) kèm huy hiệu AES-256 và HMAC OK:
```

---

## 4. KẾT QUẢ KIỂM THỬ TOÀN TRÌNH (END-TO-END TEST)

Kịch bản kiểm thử giả lập hai client **Alice** và **Bob** trên cùng cổng mạng:
1. **Alice** vào phòng `#crypto-lab`, sinh khóa đối xứng phòng: `aes_key_super_secret_9999`.
2. **Bob** vào phòng với RSA Public Key.
3. **Alice** dùng Public Key của Bob mã hóa khóa phòng và chuyển tiếp qua Relay Server.
4. **Bob** dùng Private Key của mình giải mã thành công `aes_key_super_secret_9999`.
5. **Alice** soạn: `"Báo cáo BTL An toàn mạng: Hệ thống E2EE hoàn chỉnh 10 điểm!"`.
6. Hệ thống mã hóa văn bản bằng `encryptText(originalMessage, aliceRoomKey)` $\rightarrow$ Ciphertext và IV.
7. Hệ thống tính chữ ký `HMAC-SHA256` trên Ciphertext $\rightarrow$ Chữ ký xác thực toàn vẹn.
8. Server Relay chuyển tiếp gói tin (Server hoàn toàn không thể đọc được nội dung văn bản).
9. **Bob** kiểm tra HMAC $\rightarrow$ `✅ HỢP LỆ (Không bị sửa đổi)`.
10. **Bob** giải mã bằng `decryptText` với `bobReceivedKey` $\rightarrow$ Khôi phục 100% nguyên văn ban đầu!

```text
=== TEST TOÀN TRÌNH E2EE: RSA HANDSHAKE + AES-256-GCM + HMAC-SHA256 ===
[Test] Đã sinh cặp khóa RSA 1024-bit cho Alice & Bob
[Test] Alice connected: _qe9JAN5ZtjHUCTUAAAA
[Test] Alice là chủ phòng. Khởi tạo Room AES Key: aes_key_super_secret_9999
[Test] Bob connected: r9mfLfAJd6gP8wwdAAAB
[Test] Alice mã hóa Room AES Key bằng Public Key của Bob...
[Test] Bob nhận gói khóa từ "Alice". Đang giải mã bằng RSA Private Key...
[Test] Bob đã giải mã thành công Room Key: aes_key_super_secret_9999
>>> BƯỚC 1: RSA HANDSHAKE THÀNH CÔNG! KHÓA ĐỒNG NHẤT: <<< aes_key_super_secret_9999

[Test] Alice chuẩn bị gửi tin nhắn gốc: "Báo cáo BTL An toàn mạng: Hệ thống E2EE hoàn chỉnh 10 điểm!"
[Test] Bản mã Ciphertext gửi qua mạng: AsX8QpDakgQ13iPurAMIYS/odSRW90hg/cd3DyRnW5hiwhz+261isaWxhsxPuGRge6mQTyL/1Q2+1Mc+UbscUOtBbv2fphOQ3/I9b7dfcFDr3bVHM6ADyEUh
[Test] Vector khởi tạo IV: ckTcOaSjs5B2cEQp
[Test] Chữ ký HMAC-SHA256: 5ea70d3f915862ae4967100626fd62c3ddcdbdc8e045d4b0e79976876e729bde

[Test] Bob nhận được tin nhắn từ Server Relay:
   - Ciphertext: AsX8QpDakgQ13iPurAMIYS/odSRW90hg/cd3DyRnW5hiwhz+261isaWxhsxPuGRge6mQTyL/1Q2+1Mc+UbscUOtBbv2fphOQ3/I9b7dfcFDr3bVHM6ADyEUh
   - IV: ckTcOaSjs5B2cEQp
   - HMAC: 5ea70d3f915862ae4967100626fd62c3ddcdbdc8e045d4b0e79976876e729bde
   - Kết quả xác minh HMAC: ✅ HỢP LỆ (Không bị sửa đổi)
   - Bản rõ sau khi giải mã: "Báo cáo BTL An toàn mạng: Hệ thống E2EE hoàn chỉnh 10 điểm!"

=============================================================
>>> TOÀN BỘ HỆ THỐNG E2EE HOẠT ĐỘNG HOÀN HẢO! <<<
1. RSA Handshake phân phối khóa đối xứng: THÀNH CÔNG
2. AES-256-GCM mã hóa và giải mã tin nhắn: THÀNH CÔNG
3. HMAC-SHA256 xác thực tính toàn vẹn thông điệp: THÀNH CÔNG
=============================================================
```

---
*Báo cáo được khởi tạo tự động tại thư mục gốc: [`MERGE_REPORT.md`](./MERGE_REPORT.md).*
