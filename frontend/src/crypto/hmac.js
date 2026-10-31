import CryptoJS from 'crypto-js';

/**
 * Sinh mã xác thực thông điệp HMAC-SHA256 (Message Authentication Code).
 * Đảm bảo tính toàn vẹn (Integrity) và xác thực nguồn gốc (Authentication).
 *
 * @param {string} data - Chuỗi dữ liệu cần ký (plaintext hoặc ciphertext hoặc attachment data)
 * @param {string} key - Khóa bí mật chung (HMAC Key được dẫn xuất từ khóa phòng)
 * @returns {string} Chuỗi băm HMAC-SHA256 dạng Hexadecimal (64 ký tự)
 */
export function generateHMAC(data, key) {
  if (!data || !key) return '';
  try {
    const messageStr = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.HmacSHA256(messageStr, key).toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('[HMAC] Lỗi sinh chữ ký HMAC:', error);
    return '';
  }
}

/**
 * Xác minh tính toàn vẹn của dữ liệu bằng HMAC-SHA256.
 * So sánh an toàn chữ ký nhận được với chữ ký tính toán độc lập tại client nhận.
 *
 * @param {string} data - Dữ liệu nhận được
 * @param {string} key - Khóa bí mật chung của phòng
 * @param {string} expectedHmac - Chữ ký HMAC đính kèm tin nhắn
 * @returns {boolean} True nếu dữ liệu nguyên vẹn 100%, False nếu bị sửa đổi/tấn công
 */
export function verifyHMAC(data, key, expectedHmac) {
  if (!data || !key || !expectedHmac) return false;
  try {
    const computedHmac = generateHMAC(data, key);
    // So sánh chuỗi HMAC
    return computedHmac.toLowerCase() === expectedHmac.toLowerCase();
  } catch (error) {
    console.error('[HMAC] Lỗi xác thực HMAC:', error);
    return false;
  }
}

/**
 * Dẫn xuất khóa con từ Khóa Phòng (Key Derivation Function - KDF):
 * Tách biệt khóa mã hóa (AES Key) và khóa xác thực toàn vẹn (HMAC Key)
 * theo nguyên tắc mật mã học chuẩn (Key Separation).
 *
 * @param {string} masterRoomKey - Khóa đối xứng dùng chung của phòng chat
 * @returns {{ encKey: string, hmacKey: string }}
 */
export function deriveKeys(masterRoomKey) {
  if (!masterRoomKey) {
    return { encKey: '', hmacKey: '' };
  }
  const encKey = CryptoJS.SHA256(`${masterRoomKey}_ENC_KEY_V1`).toString(CryptoJS.enc.Hex);
  const hmacKey = CryptoJS.SHA256(`${masterRoomKey}_HMAC_KEY_V1`).toString(CryptoJS.enc.Hex);
  return { encKey, hmacKey };
}

