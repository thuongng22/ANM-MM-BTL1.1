import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MessageSquare, FileText, Download, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { verifyHMAC, deriveKeys } from '../crypto/hmac';
import { decryptText } from '../services/aes_service.js';

export default function MessageList({
  messages,
  currentUser,
  roomKey,
  isKeyReady,
  roomUsers = []
}) {
  const bottomRef = useRef(null);

  // HMAC key dan xuat tu roomKey
  const hmacKey = useMemo(() => {
    return roomKey ? deriveKeys(roomKey).hmacKey : '';
  }, [roomKey]);

  // Cache tin nhan da giai ma
  const [decryptedCache, setDecryptedCache] = useState({});

  // Giai ma tin nhan khi co roomKey
  useEffect(() => {
    let active = true;

    async function processDecryption() {
      if (!roomKey) return;

      for (const msg of messages) {
        if (msg.isSystem || decryptedCache[msg.id]?.isDecrypted) continue;

        // Kiem tra HMAC
        if (msg.hmac && hmacKey) {
          const dataToVerify = {
            text: msg.text || '',
            iv: msg.iv || null,
            sender: msg.sender,
            ...(msg.attachment?.data ? { attachment: msg.attachment.data } : {})
          };

          const isHmacValid = verifyHMAC(dataToVerify, hmacKey, msg.hmac);
          if (!isHmacValid) {
            if (active) {
              setDecryptedCache((prev) => ({
                ...prev,
                [msg.id]: {
                  text: msg.text,
                  attachmentData: msg.attachment?.data,
                  isDecrypted: false,
                  isHmacFailed: true
                }
              }));
            }
            continue;
          }
        }

        let plainText = msg.text;
        let plainAttachmentData = msg.attachment?.data;
        let isDecrypted = false;

        if (msg.text && (msg.iv || msg.isEncrypted)) {
          const dec = await decryptText(msg.text, msg.iv, roomKey);
          if (dec !== null) {
            plainText = dec;
            isDecrypted = true;
          }
        }

        const attachmentIV = msg.attachment?.iv || msg.iv;
        if (msg.attachment?.data && (attachmentIV || msg.attachment?.isEncrypted)) {
          const decFile = await decryptText(msg.attachment.data, attachmentIV, roomKey);
          if (decFile !== null) {
            plainAttachmentData = decFile;
            isDecrypted = true;
          }
        }

        if (active) {
          setDecryptedCache((prev) => ({
            ...prev,
            [msg.id]: {
              text: plainText,
              attachmentData: plainAttachmentData,
              isDecrypted
            }
          }));
        }
      }
    }

    processDecryption();

    return () => {
      active = false;
    };
  }, [messages, roomKey]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
      {/* Thông báo mã hóa E2EE phòng */}
      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 text-slate text-[11px] px-3.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isKeyReady
              ? 'Phòng chat được bảo vệ bởi Khóa Đối Xứng phân phối qua RSA E2EE'
              : 'Đang thiết lập kênh mã hóa RSA...'}
          </span>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-fog mb-4">
            <MessageSquare className="w-6 h-6 stroke-1 text-periwinkle" />
          </div>
          <h3 className="text-on-dark font-medium text-base mb-1">Chưa có tin nhắn trong phòng</h3>
          <p className="text-slate text-sm max-w-xs font-light">
            Hãy bắt đầu cuộc trò chuyện hoặc gửi tệp ngay bây giờ!
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          // 1. Tin nhắn hệ thống (User vào/rời phòng)
          if (msg.isSystem) {
            // Ứng dụng không có tính năng rời phòng => ẩn các thông báo rời phòng
            if (msg.text?.includes('rời phòng')) return null;

            return (
              <div key={msg.id} className="flex justify-center my-3">
                <span className="bg-white/5 border border-white/5 text-fog text-[11px] px-3.5 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          const cached = decryptedCache[msg.id];

          const dataToVerify = {
            text: msg.text || '',
            iv: msg.iv || null,
            sender: msg.sender,
            ...(msg.attachment?.data ? { attachment: msg.attachment.data } : {})
          };
          const isHmacFailed = Boolean(
            msg.hmac && hmacKey && !verifyHMAC(dataToVerify, hmacKey, msg.hmac)
          );

          // Neu HMAC loi thi hien thi ciphertext goc
          const displayText = isHmacFailed ? msg.text : (cached?.text ?? msg.text);
          const displayAttachmentData = isHmacFailed ? null : (cached?.attachmentData ?? msg.attachment?.data);

          const isEncryptedMsg = Boolean(msg.iv || msg.isEncrypted);
          const isDecryptionFailed = Boolean(
            !isHmacFailed && isEncryptedMsg && roomKey && cached !== undefined && !cached.isDecrypted
          );

          const isMe = msg.sender === currentUser;
          const senderMember = roomUsers?.find((u) => u.username === msg.sender);
          const senderStatus = senderMember?.status || 'offline';
          const myMember = roomUsers?.find((u) => u.username === currentUser);
          const myStatus = myMember?.status || 'online';

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} group mb-3.5`}
            >
              {/* Avatar cho người gửi khác (Bên trái) */}
              {!isMe && (
                <div
                  className="relative shrink-0 mb-5"
                  title={`${msg.sender} (${senderStatus === 'online'
                      ? 'Đang trực tuyến'
                      : senderStatus === 'away'
                        ? 'Away (Đang rời tab)'
                        : 'Ngoại tuyến'
                    })`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/30 to-periwinkle/30 border border-white/10 text-periwinkle flex items-center justify-center font-semibold text-xs shadow-sm">
                    {msg.sender?.charAt(0).toUpperCase()}
                  </div>
                  {/* Chấm tròn trạng thái: Xanh (Online), Vàng (Away), Đỏ (Offline) */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-night ${senderStatus === 'online'
                        ? 'bg-emerald-400'
                        : senderStatus === 'away'
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                  />
                </div>
              )}

              {/* Khối bong bóng tin nhắn */}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                {/* Tên người gửi & Trạng thái nếu là người khác */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-1 ml-1.5">
                    <span className="text-[11px] font-medium text-periwinkle">{msg.sender}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${senderStatus === 'online'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : senderStatus === 'away'
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                            : 'text-slate bg-white/5 border border-white/10'
                        }`}
                    >
                      {senderStatus === 'online' ? 'Online' : senderStatus === 'away' ? 'Away' : 'Offline'}
                    </span>
                  </div>
                )}

                {/* Bong bóng tin nhắn */}
                <div
                  className={`relative px-4 py-2.5 break-words text-sm leading-relaxed transition-all w-full ${isHmacFailed
                      ? 'bg-rose-950/40 border border-rose-500/60 text-rose-100 rounded-[20px] shadow-lg shadow-rose-950/50'
                      : isDecryptionFailed
                        ? 'bg-amber-950/40 border border-amber-500/50 text-amber-100 rounded-[20px]'
                        : isMe
                          ? 'bg-primary text-white rounded-[20px] rounded-br-sm shadow-md shadow-primary/15'
                          : 'bg-night-raised border border-white/10 text-on-dark rounded-[20px] rounded-bl-sm shadow-sm'
                    }`}
                >
                  {/* 1. Hiển thị nội dung văn bản (đã giải mã AES) */}
                  {displayText && <p className="whitespace-pre-wrap">{displayText}</p>}

                  {/* 2. Hiển thị tệp đính kèm (đã giải mã AES) */}
                  {msg.attachment && (
                    <div className={`${displayText ? 'mt-2.5' : ''}`}>
                      {msg.attachment.type?.startsWith('image/') ? (
                        /* Trường hợp tệp là HÌNH ẢNH: Render thẻ <img> xem trực tiếp */
                        <div className="rounded-xl overflow-hidden border border-white/10 max-w-sm group/media">
                          <a
                            href={displayAttachmentData}
                            download={msg.attachment.name}
                            title="Bấm để tải về hình ảnh"
                            className="block relative overflow-hidden"
                          >
                            <img
                              src={displayAttachmentData}
                              alt={msg.attachment.name}
                              className="w-full max-h-72 object-cover rounded-xl hover:scale-[1.02] transition-transform duration-200"
                              loading="lazy"
                            />
                          </a>
                          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] bg-black/40 backdrop-blur-sm text-fog">
                            <span className="truncate max-w-[180px] sm:max-w-[220px]">
                              {msg.attachment.name}
                            </span>
                            <span className="text-[10px] text-slate ml-2 shrink-0">
                              {msg.attachment.size}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Trường hợp tệp KHÁC (PDF, DOCX, TXT...): Render Card kèm nút tải về */
                        <a
                          href={displayAttachmentData}
                          download={msg.attachment.name}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all group/file ${isMe
                              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                              : 'bg-night border-white/10 hover:border-periwinkle/30 text-on-dark'
                            }`}
                          title={`Tải xuống: ${msg.attachment.name}`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/20 text-periwinkle flex items-center justify-center shrink-0 group-hover/file:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-medium truncate">{msg.attachment.name}</p>
                            <p className="text-[11px] text-slate">{msg.attachment.size}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover/file:bg-primary group-hover/file:text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Thông tin phụ: Thời gian gửi & Huy hiệu cảnh báo khi bị lỗi / MitM */}
                <div
                  className={`flex items-center gap-2 mt-1 text-[10px] text-slate ${isMe ? 'mr-1.5 flex-row-reverse' : 'ml-1.5'
                    }`}
                >
                  <span>{msg.timestamp}</span>

                  {/* 1. CẢNH BÁO TẤN CÔNG GIẢ MẠO / MITM (Chữ ký HMAC không khớp) */}
                  {isHmacFailed && (
                    <span
                      className="inline-flex items-center gap-1 text-rose-300 font-semibold bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse text-[10px]"
                      title="Cảnh báo an ninh MitM: Chữ ký HMAC-SHA256 không hợp lệ! Bản tin đã bị kẻ tấn công can thiệp hoặc sửa đổi trên đường truyền."
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>CẢNH BÁO: BỊ GIẢ MẠO (MitM)</span>
                    </span>
                  )}

                  {/* 2. CẢNH BÁO LỖI GIẢI MÃ (Ciphertext hỏng hoặc khóa không khớp) */}
                  {!isHmacFailed && isDecryptionFailed && (
                    <span
                      className="inline-flex items-center gap-1 text-amber-300 font-medium bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 text-[10px]"
                      title="Lỗi giải mã AES: Khóa phòng hiện tại không thể giải mã được Ciphertext này."
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>LỖI GIẢI MÃ</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar cho chính mình (Bên phải) */}
              {isMe && (
                <div
                  className="relative shrink-0 mb-5"
                  title={`${currentUser} (Bạn - ${myStatus === 'online'
                    ? 'Đang trực tuyến'
                    : myStatus === 'away'
                      ? 'Away (Đang rời tab)'
                      : 'Offline'
                    })`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/25 border border-primary/40 text-primary flex items-center justify-center font-semibold text-xs shadow-sm">
                    {currentUser?.charAt(0).toUpperCase()}
                  </div>
                  {/* Chấm tròn trạng thái của mình */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-night ${myStatus === 'online'
                      ? 'bg-emerald-400'
                      : myStatus === 'away'
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                      }`}
                  />
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Anchor để tự động cuộn trang */}
      <div ref={bottomRef} />
    </div>
  );
}
