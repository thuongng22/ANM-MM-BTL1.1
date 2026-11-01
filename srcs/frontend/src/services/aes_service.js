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

/**
 * Chuyển đổi tham số key thành CryptoKey:
 * - Nếu key đã là CryptoKey (từ generateAESKey) -> Dùng trực tiếp
 * - Nếu key là chuỗi (roomKey/activeRoomKey sinh ra từ RSA Handshake) -> Dùng SHA-256 băm thành 256-bit và importKey
 */
export async function getCryptoKey(key) {
    if (key && typeof key === 'object' && key.algorithm) {
        return key;
    }
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
}

// Tao khoa AES-256-GCM
export async function generateAESKey() {
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );

    return key;
}

// Ma hoa tin nhan bang AES-GCM (hỗ trợ cả CryptoKey lẫn chuỗi roomKey)
export async function encryptText(plaintext, key) {
    const cryptoKey = await getCryptoKey(key);

    // Buoc 1: Chuyen van ban thanh bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Buoc 2: Tao IV ngau nhien 12 bytes
    const iv = crypto.getRandomValues(
        new Uint8Array(12)
    );

    // Buoc 3: Ma hoa bang AES-GCM
    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        cryptoKey,
        data
    );

    // Buoc 4: Chuyen ciphertext sang Base64
    const ciphertext = arrayBufferToBase64(encrypted);
    const ivBase64 = arrayBufferToBase64(iv);

    // Buoc 5: Tra ve ket qua
    return {
        ciphertext: ciphertext,
        iv: ivBase64
    };
}

// Giai ma tin nhan bang AES-GCM (hỗ trợ cả CryptoKey lẫn chuỗi roomKey)
export async function decryptText(ciphertext, ivBase64, key) {
    try {
        const cryptoKey = await getCryptoKey(key);

        const encryptedBytes = Uint8Array.from(
            atob(ciphertext),
            c => c.charCodeAt(0)
        );

        const iv = Uint8Array.from(
            atob(ivBase64),
            c => c.charCodeAt(0)
        );
        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            cryptoKey,
            encryptedBytes
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (err) {
        console.warn('[AES] Giải mã không thành công (có thể là tin nhắn plaintext cũ hoặc khóa khác):', err.message);
        return null;
    }
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
