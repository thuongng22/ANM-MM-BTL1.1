import React from 'react';
import { Shield, LogOut, Hash, Key, Lock, Users, Layers } from 'lucide-react';

export default function Header({
  username,
  room,
  onRoomChange,
  onLogout,
  isConnected,
  keyStatus,
  roomKey,
  onOpenKeyModal,
  onOpenDiagramModal,
  roomUsersCount = 0
}) {
  const availableRooms = ['general', 'crypto-lab', 'announcements'];
  const isKeyReady = keyStatus?.status === 'ready' && Boolean(roomKey);

  return (
    <header className="h-[72px] bg-night border-b border-white/5 px-4 sm:px-8 flex items-center justify-between shrink-0">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-3">
        <div
          onClick={onOpenKeyModal}
          className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-sm cursor-pointer hover:bg-primary/25 transition-all"
          title="Bấm để xem chi tiết Khóa RSA & Handshake"
        >
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-on-dark font-medium text-base tracking-wide leading-none">
            E2EE Chat
          </h1>
          <div className="flex items-center gap-2 text-xs text-fog mt-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{isConnected ? 'Trực tuyến' : 'Mất kết nối'}</span>
            </div>

            {/* Online Members Badge */}
            {isConnected && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate font-mono">
                • <Users className="w-3 h-3" /> {roomUsersCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Room Selector & Security Badge & User Navigation */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Nút Xem Mô Hình E2EE Diagram (Báo Cáo Giảng Viên) */}
        <button
          type="button"
          onClick={onOpenDiagramModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-periwinkle transition-all active:scale-95 shadow-sm"
          title="Bấm để mở Sơ đồ Mô hình Luồng dữ liệu E2EE (Báo cáo Giảng viên)"
        >
          <Layers className="w-3.5 h-3.5 text-periwinkle shrink-0" />
          <span className="hidden sm:inline font-medium">Mô hình E2EE</span>
        </button>

        {/* RSA E2EE Security Status Pill */}
        <button
          type="button"
          onClick={onOpenKeyModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 shadow-sm ${
            isKeyReady
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
          }`}
          title="Bấm để xem chi tiết Khóa RSA & Bắt tay E2EE"
        >
          {isKeyReady ? (
            <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          )}
          <span className="hidden md:inline">
            {isKeyReady ? 'Khóa E2EE: Sẵn sàng' : 'Bắt tay RSA...'}
          </span>
          <span className="md:hidden">
            {isKeyReady ? 'E2EE' : 'RSA...'}
          </span>
        </button>

        {/* Room Switcher Pills */}
        <div className="hidden sm:flex items-center bg-night-raised border border-white/10 rounded-full p-1">
          {availableRooms.map((r) => (
            <button
              key={r}
              onClick={() => onRoomChange && onRoomChange(r)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all ${
                room === r
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-fog hover:text-on-dark hover:bg-white/5'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span>{r}</span>
            </button>
          ))}
        </div>

        {/* Current User Pill */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-3 pr-2.5 py-1.5 rounded-full text-xs text-on-dark">
          <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-semibold">
            {username?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-on-dark max-w-[100px] truncate">{username}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 text-fog text-xs px-3 py-2 sm:px-3.5 rounded-full border border-white/10 transition-all active:scale-95"
          title="Đăng xuất"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
