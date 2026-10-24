import React from 'react';
import { Shield, LogOut, Hash, ChevronDown } from 'lucide-react';

export default function Header({ username, room, onRoomChange, onLogout, isConnected }) {
  const availableRooms = ['general', 'crypto-lab', 'announcements'];

  return (
    <header className="h-[72px] bg-night border-b border-white/5 px-4 sm:px-8 flex items-center justify-between shrink-0">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-sm">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-on-dark font-medium text-base tracking-wide leading-none">
            E2EE Chat
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-fog mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{isConnected ? 'Trực tuyến' : 'Mất kết nối'}</span>
          </div>
        </div>
      </div>

      {/* Room Selector & User Navigation */}
      <div className="flex items-center gap-3">
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
          <span className="font-medium text-on-dark max-w-[120px] truncate">{username}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 text-fog text-xs px-3.5 py-2 rounded-full border border-white/10 transition-all active:scale-95"
          title="Đăng xuất"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
