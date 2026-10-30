
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

// Ma hoa tin nhan bang AES-GCM
export async function encryptText(plaintext, key) {

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
        key,
        data
    );

    // Buoc 4: Chuyen ciphertext sang Base64
    const ciphertext = arrayBufferToBase64(encrypted);
const ivBase64 = arrayBufferToBase64(iv);

    // Buoc 6: Tra ve ket qua
    return {
        ciphertext: ciphertext,
        iv: ivBase64
    };
}
export async function decryptText(ciphertext, ivBase64, key) {
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
        key,
        encryptedBytes
    );
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);

    return plaintext;
}

export async function encryptFile(file, key) {
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
        key,
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
        key,
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
