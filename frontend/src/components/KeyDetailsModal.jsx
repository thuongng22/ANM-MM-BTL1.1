import React, { useState, useMemo } from 'react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Copy,
  Check,
  Eye,
  EyeOff,
  X,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Hash
} from 'lucide-react';
import { getPublicKeyFingerprint } from '../crypto/rsa';
import { deriveKeys } from '../crypto/hmac';

export default function KeyDetailsModal({
  isOpen,
  onClose,
  username,
  room,
  roomKey,
  keyStatus,
  keyPair,
  roomUsers = [],
  handshakeLogs = []
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showRoomKey, setShowRoomKey] = useState(false);

  // Dẫn xuất khóa HMAC từ Room Key
  const { hmacKey } = useMemo(() => {
    return deriveKeys(roomKey);
  }, [roomKey]);

  if (!isOpen) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isKeyReady = keyStatus?.status === 'ready' && Boolean(roomKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-night-raised border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-night/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-on-dark flex items-center gap-2">
                Thông tin Bắt tay & Trao đổi Khóa RSA
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/10 text-periwinkle border border-primary/20">
                  Phòng: #{room}
                </span>
              </h2>
              <p className="text-xs text-fog">
                Mô hình phân phối khóa bất đối xứng (E2EE Asymmetric Handshake)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-fog hover:text-on-dark flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Capsule */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${isKeyReady
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              }`}
          >
            <div className="flex items-center gap-3">
              {isKeyReady ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
              )}
              <div>
                <p className="text-xs font-semibold">
                  {isKeyReady
                    ? 'BẮT TAY THÀNH CÔNG - KHÓA PHÒNG ĐÃ SẴN SÀNG'
                    : 'ĐANG XỬ LÝ TRAO ĐỔI KHÓA...'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {keyStatus?.message ||
                    (isKeyReady
                      ? 'Khóa đối xứng đã được đồng bộ qua RSA an toàn giữa các thành viên.'
                      : 'Đang kết nối và trao đổi khóa với các peer trong phòng.')}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-black/30 border border-white/10">
                {keyStatus?.isInitiator ? 'Chủ phòng (Initiator)' : 'Thành viên (Peer)'}
              </span>
            </div>
          </div>

          {/* Section 1: Room Mock AES Key */}
          <div className="bg-night/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-medium text-periwinkle">
                <Key className="w-4 h-4" />
                <span>Khóa Đối Xứng Phòng Chat (Mock AES Key)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowRoomKey(!showRoomKey)}
                  className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 text-fog rounded flex items-center gap-1 transition-all"
                >
                  {showRoomKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showRoomKey ? 'Ẩn' : 'Hiện'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(roomKey, 'roomKey')}
                  disabled={!roomKey}
                  className="px-2 py-1 text-[11px] bg-primary/20 hover:bg-primary/30 text-periwinkle rounded flex items-center gap-1 transition-all disabled:opacity-40"
                >
                  {copiedField === 'roomKey' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === 'roomKey' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-on-dark break-all select-all">
              {roomKey ? (
                showRoomKey ? (
                  roomKey
                ) : (
                  '••••••••••••••••••••••••••••••••••••••••••••••••'
                )
              ) : (
                <span className="text-slate italic">Chưa có khóa (Đang chờ bắt tay RSA)</span>
              )}
            </div>

            {/* Khóa dẫn xuất HMAC-SHA256 phục vụ xác thực toàn vẹn */}
            {hmacKey && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-emerald-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Khóa Toàn Vẹn HMAC-SHA256 (Dẫn xuất từ Khóa Phòng)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(hmacKey, 'hmacKey')}
                    className="px-2 py-0.5 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded flex items-center gap-1 transition-all"
                  >
                    {copiedField === 'hmacKey' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'hmacKey' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="p-2 rounded bg-black/40 border border-emerald-500/20 font-mono text-[10px] text-emerald-200/90 break-all select-all">
                  {showRoomKey ? hmacKey : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
                <p className="text-[10px] text-slate mt-1">
                  Mỗi tin nhắn gửi đi được gắn chữ ký HMAC-SHA256 để người nhận đối soát tính toàn vẹn (chống giả mạo / MITM).
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate mt-2">
              💡 <span className="text-fog">Dành cho module AES:</span> Biến này được phân phối
              ngầm qua RSA. Lập trình viên mã hóa AES chỉ cần truyền biến này vào hàm mã
              hóa/giải mã tin nhắn.
            </p>
          </div>

          {/* Section 2: User's RSA KeyPair */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-on-dark uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Cặp Khóa RSA Cá Nhân (1024-bit PEM)
              </h3>
              <span className="text-[10px] text-slate font-mono">
                Fingerprint: {getPublicKeyFingerprint(keyPair?.publicKey)}
              </span>
            </div>

            {/* Public Key Display */}
            <div className="bg-night/60 border border-white/5 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-fog">
                  RSA Public Key (Chia sẻ công khai với phòng)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(keyPair?.publicKey, 'pubKey')}
                  className="px-2 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-fog rounded flex items-center gap-1 transition-all"
                >
                  {copiedField === 'pubKey' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === 'pubKey' ? 'Đã sao chép' : 'Sao chép PEM'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={keyPair?.publicKey || 'Đang tạo khóa...'}
                rows={3}
                className="w-full p-2 rounded bg-black/40 border border-white/5 font-mono text-[10px] text-fog resize-none focus:outline-none"
              />
            </div>

            {/* Private Key Security Notice */}
            <div className="bg-night/60 border border-white/5 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-rose-300/90 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-rose-400" />
                  RSA Private Key (Chỉ lưu an toàn trong RAM / Session)
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="px-2 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-fog rounded flex items-center gap-1 transition-all"
                >
                  {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPrivateKey ? 'Ẩn' : 'Xem (Bảo mật)'}</span>
                </button>
              </div>
              {showPrivateKey ? (
                <textarea
                  readOnly
                  value={keyPair?.privateKey || ''}
                  rows={3}
                  className="w-full p-2 rounded bg-rose-950/20 border border-rose-500/20 font-mono text-[10px] text-rose-200 resize-none focus:outline-none"
                />
              ) : (
                <div className="p-2 rounded bg-black/30 border border-white/5 text-[11px] text-slate italic flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate" />
                  <span>Khóa bí mật được ẩn. Không bao giờ gửi lên server hay cho người khác.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Room Members & Public Key Registry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-on-dark uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                Thành viên trong phòng ({roomUsers.length})
              </h3>
            </div>
            <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-night/60 overflow-hidden">
              {roomUsers.length === 0 ? (
                <div className="p-3 text-xs text-slate text-center">Chưa có thành viên trực tuyến</div>
              ) : (
                roomUsers.map((u) => {
                  const isCurrent = u.username === username;
                  return (
                    <div
                      key={u.socketId}
                      className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-on-dark">{u.username}</span>
                            {isCurrent && (
                              <span className="text-[10px] text-periwinkle bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                Bạn
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate">
                            ID: {u.socketId.substring(0, 10)}...
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] text-fog">
                        <span className="block text-slate text-[9px]">RSA FINGERPRINT</span>
                        {getPublicKeyFingerprint(u.publicKey)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 4: Handshake Timeline Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-on-dark uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Nhật ký bắt tay (Handshake Timeline)
              </h3>
              <span className="text-[10px] text-slate">{handshakeLogs.length} sự kiện</span>
            </div>
            <div className="bg-black/50 border border-white/5 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 font-mono text-[11px]">
              {handshakeLogs.length === 0 ? (
                <p className="text-slate italic text-center py-2">Chưa có sự kiện nào.</p>
              ) : (
                handshakeLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 text-fog leading-relaxed">
                    <span className="text-slate text-[10px] shrink-0 mt-0.5">[{log.time}]</span>
                    <span
                      className={`shrink-0 text-[10px] px-1.5 py-0.2 rounded font-semibold ${log.type === 'init'
                          ? 'bg-blue-500/20 text-blue-300'
                          : log.type === 'send'
                            ? 'bg-amber-500/20 text-amber-300'
                            : log.type === 'receive'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-white/10 text-fog'
                        }`}
                    >
                      {log.type.toUpperCase()}
                    </span>
                    <span className="flex-1 break-words text-on-dark/90">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-night/80 flex items-center justify-between">
          <span className="text-[11px] text-slate">
            E2EE Chat • RSA-1024 / AES Hybrid Key Exchange
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

