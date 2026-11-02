import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, FileText, Download, ShieldCheck } from 'lucide-react';
import { decryptText } from '../services/aes_service.js';

export default function MessageList({
  messages,
  currentUser,
  roomKey,
  isKeyReady,
  roomUsers = []
}) {
  const bottomRef = useRef(null);

  // Bộ nhớ đệm lưu trữ kết quả giải mã AES: { [msgId]: { text, attachmentData, isDecrypted } }
  const [decryptedCache, setDecryptedCache] = useState({});

  // Tự động giải mã tin nhắn mới bằng roomKey (Khóa Vàng từ RSA Handshake)
  useEffect(() => {
    let active = true;

    async function processDecryption() {
      if (!roomKey) return;

      for (const msg of messages) {
        if (msg.isSystem || decryptedCache[msg.id]?.isDecrypted) continue;

        let plainText = msg.text;
        let plainAttachmentData = msg.attachment?.data;
        let isDecrypted = false;

        // 1. Giải mã văn bản nếu có IV hoặc cờ isEncrypted
        if (msg.text && (msg.iv || msg.isEncrypted)) {
          const dec = await decryptText(msg.text, msg.iv, roomKey);
          if (dec !== null) {
            plainText = dec;
            isDecrypted = true;
          }
        }

        // 2. Giải mã tệp đính kèm Base64 nếu có mã hóa
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

          // Lấy dữ liệu đã giải mã AES từ cache (nếu có), fallback về bản gốc
          const cached = decryptedCache[msg.id];
          const displayText = cached?.text ?? msg.text;
          const displayAttachmentData = cached?.attachmentData ?? msg.attachment?.data;

          // 2. Tin nhắn người dùng (phân chia Trái / Phải kèm Avatar và Chấm trạng thái)
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
                  title={`${msg.sender} (${
                    senderStatus === 'online'
                      ? 'Đang trực tuyến'
                      : senderStatus === 'away'
                      ? 'Tạm vắng (Đang rời tab)'
                      : 'Ngoại tuyến'
                  })`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/30 to-periwinkle/30 border border-white/10 text-periwinkle flex items-center justify-center font-semibold text-xs shadow-sm">
                    {msg.sender?.charAt(0).toUpperCase()}
                  </div>
                  {/* Chấm tròn trạng thái: Xanh (Online), Vàng (Tạm vắng), Đỏ (Offline) */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-night ${
                      senderStatus === 'online'
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
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                        senderStatus === 'online'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : senderStatus === 'away'
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : 'text-slate bg-white/5 border border-white/10'
                      }`}
                    >
                      {senderStatus === 'online' ? 'Online' : senderStatus === 'away' ? 'Tạm vắng' : 'Offline'}
                    </span>
                  </div>
                )}

                {/* Bong bóng tin nhắn */}
                <div
                  className={`relative px-4 py-2.5 break-words text-sm leading-relaxed transition-all w-full ${
                    isMe
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
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all group/file ${
                            isMe
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

                {/* Thông tin phụ: Thời gian gửi */}
                <div
                  className={`flex items-center gap-1.5 mt-1 text-[10px] text-slate ${
                    isMe ? 'mr-1.5' : 'ml-1.5'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {/* Avatar cho chính mình (Bên phải) */}
              {isMe && (
                <div
                  className="relative shrink-0 mb-5"
                  title={`${currentUser} (Bạn - ${
                    myStatus === 'online'
                      ? 'Đang trực tuyến'
                      : myStatus === 'away'
                      ? 'Tạm vắng (Đang rời tab)'
                      : 'Offline'
                  })`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/25 border border-primary/40 text-primary flex items-center justify-center font-semibold text-xs shadow-sm">
                    {currentUser?.charAt(0).toUpperCase()}
                  </div>
                  {/* Chấm tròn trạng thái của mình */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-night ${
                      myStatus === 'online'
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
