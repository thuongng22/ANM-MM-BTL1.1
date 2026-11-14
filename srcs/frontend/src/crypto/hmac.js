import CryptoJS from 'crypto-js';

// Sap xep key theo thu tu de chuoi JSON nhat quan giua 2 ben
export function serializeForHMAC(data) {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const sortedKeys = Object.keys(data).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
      sortedObj[key] = data[key] !== undefined ? data[key] : null;
    }
    return JSON.stringify(sortedObj);
  }
  return String(data);
}

// Tinh ma HMAC-SHA256
export function generateHMAC(data, key) {
  if (!data || !key) return '';
  try {
    const messageStr = serializeForHMAC(data);
    return CryptoJS.HmacSHA256(messageStr, key).toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('[HMAC] Loi sinh HMAC:', error);
    return '';
  }
}

// Kiem tra chu ky HMAC
export function verifyHMAC(data, key, expectedHmac) {
  if (!data || !key || !expectedHmac) return false;
  try {
    const computedHmac = generateHMAC(data, key);
    return computedHmac.toLowerCase() === expectedHmac.toLowerCase();
  } catch (error) {
    console.error('[HMAC] Loi xac thuc HMAC:', error);
    return false;
  }
}

// Sinh khoa ma hoa va khoa HMAC tu master key
export function deriveKeys(masterRoomKey) {
  if (!masterRoomKey) {
    return { encKey: '', hmacKey: '' };
  }
  const encKey = CryptoJS.SHA256(`${masterRoomKey}_ENC_KEY_V1`).toString(CryptoJS.enc.Hex);
  const hmacKey = CryptoJS.SHA256(`${masterRoomKey}_HMAC_KEY_V1`).toString(CryptoJS.enc.Hex);
  return { encKey, hmacKey };
}

