import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Lock, ShieldCheck } from 'lucide-react';

export default function MessageInput({ onSendMessage, disabled, roomKey, keyReady = true }) {
  const [inputText, setInputText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const fileInputRef = useRef(null);

  // Kích hoạt dialog chọn file của hệ điều hành
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Hàm chuyển đổi kích thước byte sang định dạng thân thiện (KB, MB)
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Doc file thanh base64
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gioi han 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Tệp quá lớn. Vui lòng chọn tệp có dung lượng dưới 25MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setSelectedAttachment({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: formatFileSize(file.size),
        data: reader.result,
      });
    };

    reader.onerror = (error) => {
      console.error('Lỗi khi đọc file:', error);
      alert('Không thể đọc file đã chọn.');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setSelectedAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const hasText = inputText.trim().length > 0;
    const hasFile = Boolean(selectedAttachment);

    if ((!hasText && !hasFile) || disabled) return;

    onSendMessage({
      text: inputText.trim(),
      attachment: selectedAttachment
    });

    setInputText('');
    setSelectedAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Hỗ trợ phím tắt Enter để gửi
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = (!inputText.trim() && !selectedAttachment) || disabled;

  return (
    <div className="bg-night/95 border-t border-white/5 p-4 sm:px-8 backdrop-blur-md shrink-0">
      {/* Khung xem trước tệp đính kèm (Preview Capsule) */}
      {selectedAttachment && (
        <div className="mb-3 max-w-4xl mx-auto flex items-center justify-between bg-night-raised border border-white/10 text-on-dark text-xs px-4 py-2.5 rounded-2xl shadow-md animate-fadeIn">
          <div className="flex items-center gap-3 truncate">
            {selectedAttachment.type?.startsWith('image/') ? (
              // Thumbnail nhỏ cho hình ảnh
              <img
                src={selectedAttachment.data}
                alt="preview"
                className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-periwinkle flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            )}
            <div className="truncate">
              <p className="text-on-dark font-medium truncate">{selectedAttachment.name}</p>
              <p className="text-slate text-[11px]">{selectedAttachment.size}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveAttachment}
            className="p-1.5 text-slate hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all ml-2"
            title="Hủy tệp đính kèm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Thanh input chính */}
      <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
        {/* Input file ẩn */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Nút Đính kèm File */}
        <button
          type="button"
          onClick={handleTriggerFileInput}
          className={`h-11 w-11 rounded-full border flex items-center justify-center transition-all shrink-0 shadow-sm ${
            selectedAttachment
              ? 'bg-primary/20 border-primary text-periwinkle'
              : 'bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-periwinkle'
          }`}
          title="Đính kèm tệp (Ảnh, PDF, Tài liệu...)"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Ô nhập tin nhắn văn bản */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !keyReady
                ? 'Đang đồng bộ khóa phòng RSA...'
                : selectedAttachment
                ? 'Thêm chú thích cho tệp...'
                : 'Nhập tin nhắn (E2EE Protected)...'
            }
            disabled={disabled}
            className="w-full h-11 bg-night-raised border border-white/10 focus:border-primary text-on-dark placeholder-slate text-sm px-5 rounded-full outline-none transition-all shadow-inner"
          />
        </div>

        {/* Nút Gửi */}
        <button
          type="submit"
          disabled={isSendDisabled}
          className="h-11 px-5 rounded-full bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all shrink-0"
        >
          <span className="hidden sm:inline">Gửi</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
