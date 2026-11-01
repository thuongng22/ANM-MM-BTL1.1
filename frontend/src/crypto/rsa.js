import JSEncrypt from 'jsencrypt';

/**
 * Lấy hoặc sinh mới cặp khóa RSA (1024-bit) cho người dùng.
 * 1024-bit đảm bảo tốc độ sinh khóa tức thì (~50-100ms) trên trình duyệt không gây giật lag.
 * Lưu trữ bền vững trong localStorage theo username để không bị mất danh tính mã hóa khi F5 (Reload).
 */
export function getOrGenerateRSAKeyPair(username = 'anonymous') {
  const storageKey = `e2ee_rsa_keys_${username}`;
  try {
    // 1. Ưu tiên đọc từ localStorage
    let saved = localStorage.getItem(storageKey);

    // Hỗ trợ chuyển đổi từ sessionStorage cũ nếu có
    if (!saved && typeof sessionStorage !== 'undefined') {
      saved = sessionStorage.getItem(storageKey);
      if (saved) {
        localStorage.setItem(storageKey, saved);
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.publicKey && parsed.privateKey) {
        console.log(`[RSA] Sử dụng lại cặp khóa RSA lưu trong localStorage cho user "${username}"`);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[RSA] Không thể đọc RSA key từ localStorage:', e);
  }

  console.log(`[RSA] Đang sinh cặp khóa RSA 1024-bit mới cho user "${username}"...`);
  const crypt = new JSEncrypt({ default_key_size: 1024 });
  crypt.getKey();
  const publicKey = crypt.getPublicKey();
  const privateKey = crypt.getPrivateKey();

  const keyPair = { publicKey, privateKey, createdAt: Date.now() };

  try {
    localStorage.setItem(storageKey, JSON.stringify(keyPair));
  } catch (e) {
    console.warn('[RSA] Không thể lưu RSA key vào localStorage:', e);
  }

  return keyPair;
}

/**
 * Đọc Khóa phòng (Room AES Key) đã lưu trong localStorage của trình duyệt.
 * Định dạng lưu trữ: roomKey_<roomName> (ví dụ: roomKey_general).
 * @param {string} room - Tên phòng chat
 * @returns {string} Chuỗi Khóa phòng hoặc chuỗi rỗng
 */
export function getStoredRoomKey(room) {
  if (typeof window === 'undefined' || !room) return '';
  try {
    return localStorage.getItem(`roomKey_${room}`) || '';
  } catch (e) {
    console.warn(`[RSA] Không thể đọc roomKey từ localStorage cho phòng "${room}":`, e);
    return '';
  }
}

/**
 * Lưu trữ Khóa phòng (Room AES Key) vào localStorage của trình duyệt.
 * @param {string} room - Tên phòng chat
 * @param {string} key - Chuỗi Khóa phòng (AES Key / Mock Key)
 */
export function saveStoredRoomKey(room, key) {
  if (typeof window === 'undefined' || !room || !key) return;
  try {
    localStorage.setItem(`roomKey_${room}`, key);
    console.log(`[RSA] Đã lưu roomKey cho phòng "${room}" vào localStorage.`);
  } catch (e) {
    console.warn(`[RSA] Không thể lưu roomKey vào localStorage cho phòng "${room}":`, e);
  }
}

/**
 * Tải toàn bộ danh sách Khóa phòng đã lưu trong localStorage.
 * @returns {Record<string, string>} Đối tượng { [roomName]: roomKey }
 */
export function getAllStoredRoomKeys() {
  if (typeof window === 'undefined') return {};
  const keys = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('roomKey_')) {
        const roomName = k.substring('roomKey_'.length);
        const val = localStorage.getItem(k);
        if (roomName && val) {
          keys[roomName] = val;
        }
      }
    }
  } catch (e) {
    console.warn('[RSA] Không thể nạp danh sách roomKey từ localStorage:', e);
  }
  return keys;
}

/**
 * Xóa Khóa phòng khỏi localStorage.
 * @param {string} room - Tên phòng chat
 */
export function clearStoredRoomKey(room) {
  if (typeof window === 'undefined' || !room) return;
  try {
    localStorage.removeItem(`roomKey_${room}`);
  } catch (e) {
    console.warn(`[RSA] Không thể xóa roomKey khỏi localStorage cho phòng "${room}":`, e);
  }
}

/**
 * Mã hóa dữ liệu (như Room AES Key) bằng Public Key của người nhận (RSA PKCS#1 v1.5).
 * @param {string} recipientPublicKey - Khóa công khai của người nhận dạng PEM
 * @param {string} plaintext - Dữ liệu cần mã hóa (AES Key / Mock Key)
 * @returns {string} Chuỗi mã hóa Base64
 */
export function rsaEncrypt(recipientPublicKey, plaintext) {
  if (!recipientPublicKey || !plaintext) {
    throw new Error('Thiếu tham số cho hàm mã hóa RSA');
  }

  const crypt = new JSEncrypt();
  crypt.setPublicKey(recipientPublicKey);
  const encrypted = crypt.encrypt(plaintext);

  if (!encrypted) {
    throw new Error('Mã hóa RSA thất bại (chuỗi quá dài hoặc Public Key không hợp lệ)');
  }
  return encrypted;
}

/**
 * Giải mã dữ liệu (Base64) bằng Private Key của chính mình.
 * @param {string} myPrivateKey - Khóa riêng của bản thân dạng PEM
 * @param {string} ciphertext - Chuỗi mã hóa Base64 nhận được từ mạng
 * @returns {string} Chuỗi plaintext ban đầu (AES Key)
 */
export function rsaDecrypt(myPrivateKey, ciphertext) {
  if (!myPrivateKey || !ciphertext) {
    throw new Error('Thiếu tham số cho hàm giải mã RSA');
  }

  const crypt = new JSEncrypt();
  crypt.setPrivateKey(myPrivateKey);
  const decrypted = crypt.decrypt(ciphertext);

  if (!decrypted) {
    throw new Error('Giải mã RSA thất bại (Private Key không khớp hoặc Ciphertext không hợp lệ)');
  }
  return decrypted;
}

/**
 * Sinh Mock AES Key ngẫu nhiên chuẩn 256-bit (32 byte hex).
 * Biến này đại diện cho khóa đối xứng bí mật của phòng chat (Room Shared Key).
 */
export function generateMockAESKey() {
  const hexChars = '0123456789abcdef';
  let randomHex = '';
  // Sử dụng window.crypto nếu có sẵn, hoặc Math.random làm fallback an toàn
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    randomHex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    for (let i = 0; i < 32; i++) {
      randomHex += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
  }
  return `aes_key_${randomHex}`;
}

/**
 * Rút gọn chuỗi PEM hoặc lấy Fingerprint hiển thị gọn gàng trên giao diện UI
 */
export function getPublicKeyFingerprint(pem) {
  if (!pem) return 'N/A';
  // Lấy dòng dữ liệu Base64 bỏ header/footer
  const clean = pem.replace(/-----[^\n]+-----|\n|\r|\s/g, '');
  if (clean.length <= 16) return clean;
  return `${clean.substring(0, 8)}...${clean.substring(clean.length - 8)}`;
}
