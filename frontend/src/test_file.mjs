
import {
    generateAESKey,
    encryptFile,
    decryptFile
} from "./services/aes_service.js";

async function testFileAES() {

    // 1. Tao khoa AES
    const key = await generateAESKey();

    // 2. Tao file gia lap
    const originalContent = "Hello Duy! Test AES File";
    const originalFile = new File(
        [originalContent],
        "test.txt",
        { type: "text/plain" }
    );

    console.log("File goc:", originalFile.name);
    console.log("Noi dung goc:", originalContent);

    // 3. Ma hoa file
    const encryptedFile = await encryptFile(
        originalFile,
        key
    );

    console.log("Ciphertext:", encryptedFile.ciphertext);
    console.log("IV:", encryptedFile.iv);

    // 4. Giai ma file
    const decryptedFile = await decryptFile(
        encryptedFile,
        key
    );

    const decryptedContent = await decryptedFile.text();

    console.log("Noi dung giai ma:", decryptedContent);

    // 5. Kiem tra ket qua
    if (
        originalContent === decryptedContent &&
        originalFile.name === decryptedFile.name
    ) {
        console.log("FILE AES TEST PASSED");
    } else {
        console.log("FILE AES TEST FAILED");
    }
}

testFileAES().catch(console.error);
