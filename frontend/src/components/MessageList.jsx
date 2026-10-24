import React, { useEffect, useRef } from 'react';
import { MessageSquare, FileText, Download } from 'lucide-react';

export default function MessageList({ messages, currentUser }) {
  const bottomRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
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
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <span className="bg-white/5 border border-white/5 text-fog text-[11px] px-3.5 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          // 2. Tin nhắn người dùng (phân chia Trái / Phải)
          const isMe = msg.sender === currentUser;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              {/* Tên người gửi nếu là người khác */}
              {!isMe && (
                <span className="text-[11px] font-medium text-periwinkle mb-1 ml-2">
                  {msg.sender}
                </span>
              )}

              {/* Bong bóng tin nhắn */}
              <div
                className={`relative px-4 py-2.5 max-w-[85%] sm:max-w-[70%] break-words text-sm leading-relaxed transition-all ${
                  isMe
                    ? 'bg-primary text-white rounded-[20px] rounded-br-sm shadow-md shadow-primary/15'
                    : 'bg-night-raised border border-white/10 text-on-dark rounded-[20px] rounded-bl-sm shadow-sm'
                }`}
              >
                {/* 1. Hiển thị nội dung văn bản (nếu có) */}
                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                {/* 2. Hiển thị tệp đính kèm (nếu có) */}
                {msg.attachment && (
                  <div className={`${msg.text ? 'mt-2.5' : ''}`}>
                    {msg.attachment.type?.startsWith('image/') ? (
                      /* Trường hợp tệp là HÌNH ẢNH: Render thẻ <img> xem trực tiếp */
                      <div className="rounded-xl overflow-hidden border border-white/10 max-w-sm group/media">
                        <a
                          href={msg.attachment.data}
                          download={msg.attachment.name}
                          title="Bấm để tải về hình ảnh"
                          className="block relative overflow-hidden"
                        >
                          <img
                            src={msg.attachment.data}
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
                      /* Trường hợp tệp KHÁC (PDF, DOCX, TXT...): Render Card phong cách Mercury kèm nút tải về */
                      <a
                        href={msg.attachment.data}
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

              {/* Thời gian gửi */}
              <span
                className={`text-[10px] text-slate mt-1 ${
                  isMe ? 'mr-1.5' : 'ml-1.5'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          );
        })
      )}

      {/* Anchor để tự động cuộn trang */}
      <div ref={bottomRef} />
    </div>
  );
}
