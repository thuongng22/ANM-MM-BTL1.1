
import { useState } from "react";

import {
    generateAESKey,
    encryptText,
    decryptText
} from "../services/aes_service.js";

export default function AESMockDemo() {
    const [message, setMessage] = useState("");
    const [ciphertext, setCiphertext] = useState("");
    const [decrypted, setDecrypted] = useState("");
    const [error, setError] = useState("");

    async function handleTest() {
        try {
            setError("");

            // Tao khoa AES gia lap
            const key = await generateAESKey();

            // Ma hoa tin nhan
            const encrypted = await encryptText(message, key);
            setCiphertext(encrypted.ciphertext);

            // Giai ma bang cung khoa
            const result = await decryptText(
                encrypted.ciphertext,
                encrypted.iv,
                key
            );

            setDecrypted(result);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>AES-256-GCM Demo</h2>

            <input
                type="text"
                placeholder="Nhap tin nhan"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <button onClick={handleTest}>
                Encrypt & Decrypt
            </button>

            <h3>Ciphertext:</h3>
            <p style={{ overflowWrap: "anywhere" }}>
                {ciphertext}
            </p>

            <h3>Decrypted Message:</h3>
            <p>{decrypted}</p>

            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
