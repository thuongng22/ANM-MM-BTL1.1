
import {
    generateAESKey,
    encryptText,
    decryptText,
    encryptFile,
    decryptFile
} from "./services/aes_service.js";

async function testSecurity() {
    const key = await generateAESKey();

    // TEST 1: Phat hien ciphertext bi sua
    const encrypted = await encryptText("Hello Duy", key);

    const bytes = Uint8Array.from(
        atob(encrypted.ciphertext),
        c => c.charCodeAt(0)
    );

    // Sua 1 bit trong ciphertext
    bytes[0] ^= 1;

    const tampered = btoa(
        String.fromCharCode(...bytes)
    );

    try {
        await decryptText(tampered, encrypted.iv, key);
        console.log("TEST 1 FAILED");
    } catch (error) {
        console.log("TEST 1 PASSED: Tampering detected");
    }

    // TEST 2: Kiem tra file nhi phan
    const originalBytes = new Uint8Array([
        0, 1, 2, 128, 255, 34, 67, 90
    ]);

    const file = new File(
        [originalBytes],
        "binary.bin",
        { type: "application/octet-stream" }
    );

    const encryptedFile = await encryptFile(file, key);
    const decryptedFile = await decryptFile(encryptedFile, key);

    const restoredBytes = new Uint8Array(
        await decryptedFile.arrayBuffer()
    );

    const isIdentical =
        originalBytes.length === restoredBytes.length &&
        originalBytes.every((value, i) =>
            value === restoredBytes[i]
        );

    console.log(
        isIdentical
            ? "TEST 2 PASSED: Binary file identical"
            : "TEST 2 FAILED"
    );
}

testSecurity().catch(console.error);
