import JSEncrypt from 'jsencrypt';
import CryptoJS from 'crypto-js';

// MSSV thanh vien nhom
export const TEAM_MSSV = ['2433220', '2410482', '2213078', '2252211'];

// Thong diep khoi tao handshake
export const HANDSHAKE_WATERMARK_MESSAGE = `Hello, We are ${TEAM_MSSV.join(', ')}`;

// Lay hoac tao cap khoa RSA (1024-bit) luu trong localStorage
export function getOrGenerateRSAKeyPair(username = 'anonymous') {
  const storageKey = `e2ee_rsa_keys_${username}`;
  try {
    let saved = localStorage.getItem(storageKey);

    if (!saved && typeof sessionStorage !== 'undefined') {
      saved = sessionStorage.getItem(storageKey);
      if (saved) {
        localStorage.setItem(storageKey, saved);
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.publicKey && parsed.privateKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[RSA] Khong the doc khoa tu localStorage:', e);
  }

  const crypt = new JSEncrypt({ default_key_size: 1024 });
  crypt.getKey();
  const publicKey = crypt.getPublicKey();
  const privateKey = crypt.getPrivateKey();

  const keyPair = { publicKey, privateKey, createdAt: Date.now() };

  try {
    localStorage.setItem(storageKey, JSON.stringify(keyPair));
  } catch (e) {
    console.warn('[RSA] Khong the luu khoa vao localStorage:', e);
  }

  return keyPair;
}

// Doc khoa phong tu localStorage
export function getStoredRoomKey(room) {
  if (typeof window === 'undefined' || !room) return '';
  try {
    return localStorage.getItem(`roomKey_${room}`) || '';
  } catch (e) {
    return '';
  }
}

// Luu khoa phong vao localStorage
export function saveStoredRoomKey(room, key) {
  if (typeof window === 'undefined' || !room || !key) return;
  try {
    localStorage.setItem(`roomKey_${room}`, key);
  } catch (e) {
    console.warn('[RSA] Khong the luu roomKey:', e);
  }
}

// Lay danh sach khoa phong
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
    console.warn('[RSA] Khong the nap danh sach roomKey:', e);
  }
  return keys;
}

// Xoa khoa phong
export function clearStoredRoomKey(room) {
  if (typeof window === 'undefined' || !room) return;
  try {
    localStorage.removeItem(`roomKey_${room}`);
  } catch (e) {
    console.warn('[RSA] Khong the xoa roomKey:', e);
  }
}

// Ma hoa RSA (chia chunk neu payload dai hon 80 ky tu)
export function rsaEncrypt(recipientPublicKey, plaintext) {
  if (!recipientPublicKey || !plaintext) {
    throw new Error('Thieu tham so ma hoa RSA');
  }

  const crypt = new JSEncrypt();
  crypt.setPublicKey(recipientPublicKey);

  // RSA 1024-bit PKCS#1 v1.5 gioi han do dai plaintext nen chia chunk
  const maxChunkLength = 80;
  if (plaintext.length <= maxChunkLength) {
    const encrypted = crypt.encrypt(plaintext);
    if (!encrypted) {
      throw new Error('Ma hoa RSA that bai');
    }
    return encrypted;
  }

  const chunks = [];
  for (let i = 0; i < plaintext.length; i += maxChunkLength) {
    const chunk = plaintext.slice(i, i + maxChunkLength);
    const encChunk = crypt.encrypt(chunk);
    if (!encChunk) {
      throw new Error('Ma hoa RSA that bai o chunk');
    }
    chunks.push(encChunk);
  }
  return chunks.join('|');
}

// Giai ma RSA theo tung chunk cach nhau boi '|'
export function rsaDecrypt(myPrivateKey, ciphertext) {
  if (!myPrivateKey || !ciphertext) {
    throw new Error('Thieu tham so giai ma RSA');
  }

  const crypt = new JSEncrypt();
  crypt.setPrivateKey(myPrivateKey);

  const chunks = ciphertext.split('|');
  let decryptedText = '';
  for (const chunk of chunks) {
    const plainChunk = crypt.decrypt(chunk);
    if (!plainChunk) {
      throw new Error('Giai ma RSA that bai');
    }
    decryptedText += plainChunk;
  }
  return decryptedText;
}

// Sinh khoa phong tu MSSV cac thanh vien bang SHA256
export function generateAESKey(room = '') {
  const mssvConcat = TEAM_MSSV.join('_');
  const seed = room ? `${mssvConcat}_${room}` : mssvConcat;
  return CryptoJS.SHA256(seed).toString(CryptoJS.enc.Hex);
}

// Lay fingerprint rut gon cua public key de hien thi UI
export function getPublicKeyFingerprint(pem) {
  if (!pem) return 'N/A';
  const clean = pem.replace(/-----[^\n]+-----|\n|\r|\s/g, '');
  if (clean.length <= 16) return clean;
  return `${clean.substring(0, 8)}...${clean.substring(clean.length - 8)}`;
}
