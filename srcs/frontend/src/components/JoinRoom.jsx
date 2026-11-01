import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Hash, User, Sparkles } from 'lucide-react';

export default function JoinRoom({ onJoin, defaultUsername = '', defaultRoom = 'general' }) {
  const [username, setUsername] = useState(defaultUsername);
  const [room, setRoom] = useState(defaultRoom);
  const [error, setError] = useState('');

  const quickRooms = ['general', 'crypto-dev', 'security-lab'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên người dùng của bạn.');
      return;
    }
    if (!room.trim()) {
      setError('Vui lòng nhập mã hoặc tên phòng.');
      return;
    }
    setError('');
    onJoin({ username: username.trim(), room: room.trim() });
  };

  return (
    <div className="min-h-screen w-full bg-night flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-periwinkle/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-night-raised border border-white/10 rounded-[32px] p-6 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Top badge */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <span className="flex items-center gap-1.5 text-xs text-periwinkle bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>E2EE Chat</span>
          </span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-normal text-on-dark tracking-tight">
            Tham gia phòng chat
          </h2>
          <p className="text-fog text-sm mt-2 font-light leading-relaxed">
            Ứng dụng Chat Client-Server Mã hóa Đầu cuối. Giai đoạn Ngày 1-2: Truyền dữ liệu văn bản gốc (Plaintext).
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-2.5 rounded-2xl">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-fog font-medium ml-1">
              Tên hiển thị (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: Alice, Bob, Charlie..."
                className="w-full bg-night/80 border border-white/10 focus:border-primary text-on-dark placeholder-slate text-sm pl-11 pr-4 py-3 rounded-full outline-none transition-all shadow-inner"
                maxLength={30}
                autoFocus
              />
            </div>
          </div>

          {/* Room ID Input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-fog font-medium ml-1">
              Mã phòng (Room ID)
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ví dụ: general, lab-01..."
                className="w-full bg-night/80 border border-white/10 focus:border-primary text-on-dark placeholder-slate text-sm pl-11 pr-4 py-3 rounded-full outline-none transition-all shadow-inner"
                maxLength={30}
              />
            </div>
          </div>

          {/* Quick Rooms Pills */}
          <div className="pt-1">
            <span className="text-[11px] text-slate block mb-2 ml-1">Phòng gợi ý nhanh:</span>
            <div className="flex flex-wrap gap-2">
              {quickRooms.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRoom(r)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    room === r
                      ? 'bg-primary/20 border-primary text-on-dark'
                      : 'bg-white/5 border-white/5 text-fog hover:border-white/20'
                  }`}
                >
                  #{r}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action Pill */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-medium text-sm py-3.5 px-6 rounded-full shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Vào phòng trò chuyện</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-slate text-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Sẵn sàng tích hợp E2EE (RSA/AES) ở giai đoạn tiếp theo</span>
        </div>
      </div>
    </div>
  );
}
