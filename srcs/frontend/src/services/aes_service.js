import CryptoJS from 'crypto-js';

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 8192;
    let binary = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

// Chuyen key thanh CryptoKey neu co Web Crypto
export async function getCryptoKey(key) {
    if (key && typeof key === 'object' && key.algorithm) {
        return key;
    }
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        return null;
    }
    try {
        const keyString = String(key || 'default_room_key_aes_256');
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(keyString));
        return await crypto.subtle.importKey(
            'raw',
            hashBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (e) {
        return null;
    }
}

// Tao khoa AES 256-bit
export async function generateAESKey() {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
            return await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
        } catch (e) {}
    }
    const hex = '0123456789abcdef'; let r = ''; for(let i=0;i<64;i++) r += hex.charAt(Math.floor(Math.random()*16)); return r;
}

// Ma hoa tin nhan
export async function encryptText(plaintext, key) {
    try {
        const keyString = String(key?.algorithm ? 'default_room_key_aes_256' : (key || 'default_room_key_aes_256'));
        const keyBytes = CryptoJS.SHA256(keyString);
        const ivBytes = CryptoJS.lib.WordArray.random(16);
        const encrypted = CryptoJS.AES.encrypt(plaintext, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return {
            ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
            iv: ivBytes.toString(CryptoJS.enc.Base64)
        };
    } catch (err) {
        console.error('[AES] Ma hoa that bai:', err);
        throw err;
    }
}

// Giai ma tin nhan
export async function decryptText(ciphertext, ivBase64, key) {
    if (!ciphertext) return '';

    try {
        const keyString = String(key?.algorithm ? 'default_room_key_aes_256' : (key || 'default_room_key_aes_256'));
        const keyBytes = CryptoJS.SHA256(keyString);
        const ivBytes = CryptoJS.enc.Base64.parse(ivBase64);
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(ciphertext)
        });
        const decrypted = CryptoJS.AES.decrypt(cipherParams, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        if (result) return result;
    } catch (err) {
    }

    // Fallback giai ma AES-GCM
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
            const cryptoKey = await getCryptoKey(key);
            if (cryptoKey) {
                const encryptedBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const decrypted = await crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv },
                    cryptoKey,
                    encryptedBytes
                );
                const decoder = new TextDecoder();
                return decoder.decode(decrypted);
            }
        } catch (err) {
        }
    }

    return null;
}

export async function encryptFile(file, key) {
    const cryptoKey = await getCryptoKey(key);

    // 1. Doc file thanh ArrayBuffer
    const fileData = await file.arrayBuffer();

    // 2. Tao IV ngau nhien
    const iv = crypto.getRandomValues(
        new Uint8Array(12)
    );

    // 3. Ma hoa AES-GCM
    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        fileData
    );

    // 4. Chuyen sang Base64
    const ciphertext = arrayBufferToBase64(encrypted);
    const ivBase64 = arrayBufferToBase64(iv);

    // 5. Dong goi ket qua
    return {
        ciphertext: ciphertext,
        iv: ivBase64,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
    };
}

export async function decryptFile(encryptedFile, key) {
    const cryptoKey = await getCryptoKey(key);

    // 1. Lay du lieu tu Object
    const ciphertext = encryptedFile.ciphertext;
    const ivBase64 = encryptedFile.iv;

    // 2. Chuyen Base64 thanh ArrayBuffer
    const encryptedBytes = base64ToArrayBuffer(ciphertext);
    const iv = base64ToArrayBuffer(ivBase64);

    // 3. Giai ma bang AES-GCM
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        encryptedBytes
    );

    // 4. Khoi phuc file
    const file = new File(
        [decrypted],
        encryptedFile.fileName,
        {
            type: encryptedFile.fileType
        }
    );

    return file;
}
