
import {
    generateAESKey,
    encryptText,
    decryptText
} from "./services/aes_service.js";

async function testAES() {

    // Buoc 1: Tao khoa AES
    const key = await generateAESKey();

    // Buoc 2: Tao tin nhan
    const message = "Hello Duy";

    console.log("Tin nhan goc:", message);

    // Buoc 3: Ma hoa
    const encrypted = await encryptText(message, key);

    console.log("Ciphertext:", encrypted.ciphertext);
    console.log("IV:", encrypted.iv);

    // Buoc 4: Giai ma
    const decrypted = await decryptText(
        encrypted.ciphertext,
        encrypted.iv,
        key
    );

    console.log("Tin nhan giai ma:", decrypted);

    // Buoc 5: Kiem tra ket qua
    if (message === decrypted) {
        console.log("AES TEST PASSED");
    } else {
        console.log("AES TEST FAILED");
    }
}

testAES().catch(console.error);
