import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  Server,
  EyeOff,
  Eye,
  Send,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  X,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  Cpu,
  Laptop
} from 'lucide-react';

export default function E2EEDiagramModal({ isOpen = true, onClose }) {
  // Tab chuyển đổi góc nhìn: 'all' | 'phase1' | 'phase2'
  const [activeTab, setActiveTab] = useState('all');

  // Cho phép giảng viên/người dùng nhập text demo tin nhắn realtime
  const [demoMessage, setDemoMessage] = useState('Bí mật đồ án: Đạt điểm 10!');
  
  // Khóa đối xứng AES mẫu (Room Key)
  const [mockRoomKey, setMockRoomKey] = useState('aes_key_445a71a56d8e90f23b12');

  // Đổi ngẫu nhiên khóa Mock để demo
  const handleRegenerateKey = () => {
    const chars = '0123456789abcdef';
    let rand = '';
    for (let i = 0; i < 20; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setMockRoomKey(`aes_key_${rand}`);
  };

  // Tính toán chuỗi Ciphertext giả lập biến thiên realtime theo demoMessage và mockRoomKey
  const simulatedCiphertext = useMemo(() => {
    if (!demoMessage) return 'U2FsdGVkX19EMPTY_DATA==';
    // Mô phỏng chuỗi Base64 mã hóa OpenSSL AES-256
    let hash = 0;
    const combined = demoMessage + mockRoomKey;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, 'a');
    try {
      const b64 = btoa(encodeURIComponent(demoMessage)).replace(/=/g, '');
      return `U2FsdGVkX1${hex.substring(0, 6)}${b64.substring(0, 14)}...==`;
    } catch {
      return `U2FsdGVkX1${hex}99f2b84e==`;
    }
  }, [demoMessage, mockRoomKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="bg-night border border-white/10 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-on-dark"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER MODAL
            ========================================================================= */}
        <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-night-raised">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-periwinkle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-wide text-on-dark">
                  Mô Hình Luồng Dữ Liệu Mã Hóa Đầu Cuối (E2EE)
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Zero-Knowledge
                </span>
              </div>
              <p className="text-xs text-fog">
                Trực quan hóa đường đi của Khóa RSA, Khóa AES và dữ liệu qua Server "mù"
              </p>
            </div>
          </div>

          {/* Tab Selector & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-fog hover:text-on-dark'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Toàn bộ quy trình</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('phase1')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'phase1'
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-fog hover:text-on-dark'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-cyan-300" />
                <span>Pha 1: Bắt tay RSA</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('phase2')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'phase2'
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-fog hover:text-on-dark'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                <span>Pha 2: Nhắn tin AES</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-fog hover:text-on-dark flex items-center justify-center transition-all ml-1"
                title="Đóng modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            LIVE DEMO INTERACTIVE TOOLBAR (Phục vụ trình chiếu demo với Giảng viên)
            ========================================================================= */}
        <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="text-slate shrink-0 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Nhập thử tin nhắn:
            </span>
            <input
              type="text"
              value={demoMessage}
              onChange={(e) => setDemoMessage(e.target.value)}
              placeholder="Nhập chuỗi bất kỳ để thấy Ciphertext biến thiên..."
              className="flex-1 bg-night border border-white/15 focus:border-primary text-on-dark text-xs px-3 py-1.5 rounded-lg outline-none font-sans transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-slate font-mono text-[11px] hidden sm:inline">
              Khóa AES: <span className="text-amber-400">{mockRoomKey.substring(0, 14)}...</span>
            </span>
            <button
              type="button"
              onClick={handleRegenerateKey}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-fog hover:text-on-dark flex items-center gap-1 transition-all active:scale-95"
              title="Đổi khóa AES phòng mới"
            >
              <RefreshCw className="w-3 h-3 text-periwinkle" />
              <span>Đổi Khóa AES</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            BODY: 3-COLUMN HORIZONTAL FLOW DIAGRAM
            ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Header 3 Cột: Client A (Trái) | Server Relay (Giữa) | Client B (Phải) */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Cột 1: Client A */}
            <div className="col-span-12 md:col-span-4 bg-night-raised/90 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-cyan-200">CLIENT A (Alice)</h3>
                  <p className="text-[10px] text-slate">Người cũ / Đang giữ Khóa phòng</p>
                </div>
              </div>
              <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                Host / Peer 1
              </span>
            </div>

            {/* Cột 2: Server Node.js (MÙ) */}
            <div className="col-span-12 md:col-span-4 bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs border border-rose-500/30">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-rose-200 flex items-center gap-1.5">
                    SERVER NODE.JS
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  </h3>
                  <p className="text-[10px] text-rose-300/80">Trạm Relay "MÙ" (Zero-Knowledge)</p>
                </div>
              </div>
              <span className="text-[10px] bg-rose-900/60 text-rose-200 border border-rose-500/40 px-2 py-0.5 rounded font-mono">
                No Private Key
              </span>
            </div>

            {/* Cột 3: Client B */}
            <div className="col-span-12 md:col-span-4 bg-night-raised/90 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-purple-200">CLIENT B (Bob)</h3>
                  <p className="text-[10px] text-slate">Người mới tham gia phòng</p>
                </div>
              </div>
              <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                Receiver / Peer 2
              </span>
            </div>
          </div>

          {/* =====================================================================
              GIAI ĐOẠN 1: BẮT TAY RSA (PHÂN PHỐI KHÓA AES)
              ===================================================================== */}
          {(activeTab === 'all' || activeTab === 'phase1') && (
            <div className="bg-night-raised/60 border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              {/* Tiêu đề giai đoạn 1 */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  <Key className="w-4 h-4" />
                  <span>Giai đoạn 1: Bắt tay bất đối xứng RSA (Phân phối Khóa AES Phòng)</span>
                </div>
                <span className="text-[11px] text-slate font-mono">
                  Mục tiêu: Đưa Khóa Vàng (AES) từ A sang B mà Server không biết
                </span>
              </div>

              {/* 3 Cột luồng ngang của Giai đoạn 1 */}
              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch relative">
                
                {/* 1. Khu vực Client A trong Giai đoạn 1 */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
                  {/* Khối A1: Nắm giữ Khóa AES */}
                  <div className="p-3 rounded-xl bg-night border border-amber-500/30 shadow-inner">
                    <div className="flex items-center justify-between text-xs font-medium text-amber-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        1. Khóa AES Phòng (Khóa Vàng)
                      </span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                        Symmetric
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-amber-200/90 break-all bg-black/40 p-1.5 rounded border border-amber-500/20">
                      {mockRoomKey}
                    </p>
                    <p className="text-[10px] text-slate mt-1">
                      Alice đã có sẵn khóa này khi là người đầu tiên tạo phòng.
                    </p>
                  </div>

                  {/* Khối A2: Đóng gói bằng Public Key của B */}
                  <div className="p-3 rounded-xl bg-night border border-cyan-500/30 flex-1">
                    <div className="text-xs font-medium text-cyan-300 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      3. Đóng Hộp Khóa (RSA Encrypt)
                    </div>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Alice lấy <span className="text-cyan-300 font-semibold">Bob_PubKey</span> bọc khóa{' '}
                      <span className="text-amber-300 font-semibold">AES</span> lại thành:
                    </p>
                    <div className="mt-2 p-2 rounded bg-black/40 border border-cyan-500/20 font-mono text-[10px] text-cyan-200">
                      📦 Hộp mã hóa: <br />
                      <span className="text-slate">rsaEncrypt(Bob_PubKey, AES_Key)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Khu vực Server Node.js trong Giai đoạn 1 (Ống dẫn trung gian) */}
                <div className="col-span-12 md:col-span-4 flex flex-col justify-between p-3.5 rounded-xl bg-rose-950/10 border border-dashed border-rose-500/40 relative">
                  
                  {/* Đường truyền Bước 1: Bob gửi Public Key qua Server về Alice (Phải -> Trái) */}
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-purple-300 font-medium">
                      <span className="flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3 text-purple-400" />
                        Bước ①: Bob gửi Public Key
                      </span>
                      <span className="text-[9px] text-slate font-mono">B $\rightarrow$ Server $\rightarrow$ A</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate truncate bg-black/40 p-1 rounded">
                      socket.emit('join_room', Bob_PubKey)
                    </div>
                  </div>

                  {/* Trung tâm: Biểu tượng Server Relay Mù */}
                  <div className="my-3 py-2 px-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-rose-300 font-semibold text-xs">
                      <EyeOff className="w-4 h-4 text-rose-400" />
                      <span>SERVER CHỈ CHUYỂN TIẾP (RELAY)</span>
                    </div>
                    <p className="text-[10px] text-rose-200/80 mt-1">
                      Server KHÔNG có Private Key của Bob, nên hoàn toàn KHÔNG THỂ mở Hộp Khóa!
                    </p>
                  </div>

                  {/* Đường truyền Bước 2: Alice gửi Hộp Khóa qua Server đến Bob (Trái -> Phải) */}
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-cyan-300 font-medium">
                      <span className="flex items-center gap-1">
                        Bước ②: Alice gửi Hộp Khóa
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      </span>
                      <span className="text-[9px] text-slate font-mono">A $\rightarrow$ Server $\rightarrow$ B</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate truncate bg-black/40 p-1 rounded">
                      emit('send_encrypted_room_key', Ciphertext)
                    </div>
                  </div>
                </div>

                {/* 3. Khu vực Client B trong Giai đoạn 1 */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
                  {/* Khối B1: Sinh cặp khóa RSA */}
                  <div className="p-3 rounded-xl bg-night border border-purple-500/30 shadow-inner">
                    <div className="flex items-center justify-between text-xs font-medium text-purple-300 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        0. Sinh Cặp Khóa RSA
                      </span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                        Asymmetric
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px] font-mono">
                      <p className="text-cyan-300 bg-cyan-950/30 p-1 rounded border border-cyan-500/20 truncate">
                        🔓 Public Key: Gửi cho toàn phòng
                      </p>
                      <p className="text-rose-300 bg-rose-950/30 p-1 rounded border border-rose-500/20 truncate">
                        🔒 Private Key: Giữ bí mật trong RAM!
                      </p>
                    </div>
                  </div>

                  {/* Khối B2: Mở Hộp Khóa */}
                  <div className="p-3 rounded-xl bg-night border border-emerald-500/30 flex-1">
                    <div className="text-xs font-medium text-emerald-300 mb-1 flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                      4. Mở Hộp (RSA Decrypt)
                    </div>
                    <p className="text-[11px] text-fog leading-relaxed">
                      Bob dùng <span className="text-rose-300 font-semibold">Bob_PrivKey</span> giải mã Hộp, thu được{' '}
                      <span className="text-amber-300 font-semibold">Khóa AES</span>:
                    </p>
                    <p className="mt-2 text-[11px] font-mono text-emerald-300 bg-black/40 p-1.5 rounded border border-emerald-500/20 break-all">
                      🔑 {mockRoomKey}
                    </p>
                    <p className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Bắt tay RSA thành công! Khóa trùng khớp!
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =====================================================================
              GIAI ĐOẠN 2: NHẮN TIN AES (CHAT THỰC TẾ)
              ===================================================================== */}
          {(activeTab === 'all' || activeTab === 'phase2') && (
            <div className="bg-night-raised/60 border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              {/* Tiêu đề giai đoạn 2 */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  <span>Giai đoạn 2: Mã hóa & Truyền tin nhắn Đối Xứng AES-256</span>
                </div>
                <span className="text-[11px] text-slate font-mono">
                  Mục tiêu: Mã hóa tin nhắn tốc độ cao bằng Khóa Vàng đã thống nhất
                </span>
              </div>

              {/* 3 Cột luồng ngang của Giai đoạn 2 */}
              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch relative">
                
                {/* 1. Client A: Soạn & Mã hóa tin nhắn */}
                <div className="col-span-12 md:col-span-4 p-3.5 rounded-xl bg-night border border-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-cyan-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        1. Alice gửi tin nhắn
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                        Plaintext
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                      <p className="text-[10px] text-slate font-mono uppercase">Nội dung gốc:</p>
                      <p className="text-xs text-on-dark font-medium mt-0.5 break-words">
                        "{demoMessage}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-fog">
                      ⚡ Dùng <span className="text-amber-300 font-mono">AES_Key</span> mã hóa:
                    </p>
                    <div className="mt-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20">
                      encryptAES(message, roomKey)
                    </div>
                  </div>
                </div>

                {/* 2. Server: Chỉ thấy chuỗi rác Ciphertext */}
                <div className="col-span-12 md:col-span-4 p-3.5 rounded-xl bg-rose-950/15 border border-dashed border-rose-500/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-rose-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                        2. Server trung gian
                      </span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                        Blind Relay
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/60 border border-rose-500/30 space-y-1">
                      <p className="text-[10px] text-rose-300 font-mono uppercase font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        Server chỉ thấy Ciphertext:
                      </p>
                      <p className="text-[11px] font-mono text-rose-200 break-all select-all leading-tight bg-rose-950/40 p-1.5 rounded border border-rose-500/20">
                        {simulatedCiphertext}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-rose-200/80 leading-relaxed bg-black/30 p-2 rounded">
                    🛡️ Dù Hacker chiếm quyền điều khiển Server hoặc nghe trộm qua Wi-Fi / LAN, dữ liệu thu được chỉ là chuỗi rác vô nghĩa.
                  </div>
                </div>

                {/* 3. Client B: Nhận & Giải mã tin nhắn */}
                <div className="col-span-12 md:col-span-4 p-3.5 rounded-xl bg-night border border-purple-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-purple-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-purple-400" />
                        3. Bob giải mã tin nhắn
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                        Decrypted
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/30">
                      <p className="text-[10px] text-slate font-mono uppercase">Nội dung giải mã:</p>
                      <p className="text-xs text-emerald-300 font-medium mt-0.5 break-words">
                        "{demoMessage}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-fog">
                      ⚡ Dùng <span className="text-amber-300 font-mono">AES_Key</span> giải mã:
                    </p>
                    <div className="mt-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20">
                      decryptAES(ciphertext, roomKey)
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =====================================================================
              BẢNG TỔNG KẾT SO SÁNH (DÀNH CHO GIẢNG VIÊN ĐÁNH GIÁ)
              ===================================================================== */}
          <div className="bg-night-raised border border-white/5 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-periwinkle uppercase tracking-wider mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Tóm tắt Cơ chế Bảo mật Kết hợp (Hybrid Encryption Architecture)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/30 border border-cyan-500/20">
                <p className="font-semibold text-cyan-300 flex items-center gap-1 mb-1">
                  <Key className="w-3.5 h-3.5" /> RSA (Bất đối xứng)
                </p>
                <p className="text-[11px] text-fog leading-relaxed">
                  Đảm nhận việc <strong>bắt tay phân phối khóa</strong> an toàn. Không dùng để mã hóa tin nhắn lớn vì RSA tốn nhiều tài nguyên tính toán.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-amber-500/20">
                <p className="font-semibold text-amber-300 flex items-center gap-1 mb-1">
                  <Lock className="w-3.5 h-3.5" /> AES (Đối xứng)
                </p>
                <p className="text-[11px] text-fog leading-relaxed">
                  Đảm nhận việc <strong>mã hóa nội dung chat và file tệp</strong>. Tốc độ cực nhanh (micro-giây), bảo mật quân sự chuẩn 256-bit.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/30 border border-rose-500/20">
                <p className="font-semibold text-rose-300 flex items-center gap-1 mb-1">
                  <EyeOff className="w-3.5 h-3.5" /> Server Zero-Knowledge
                </p>
                <p className="text-[11px] text-fog leading-relaxed">
                  Server chỉ làm nhiệm vụ <strong>định tuyến (Relay)</strong>. Cơ sở dữ liệu `database.json` chỉ lưu Ciphertext, đảm bảo quyền riêng tư tuyệt đối.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            FOOTER MODAL
            ========================================================================= */}
        <div className="px-5 py-3 border-t border-white/10 bg-night-raised flex items-center justify-between text-xs">
          <span className="text-slate flex items-center gap-1.5 font-mono text-[11px]">
            <Shield className="w-3.5 h-3.5 text-primary" />
            BTL An toàn Mạng & Mật mã • E2EE Architecture Diagram
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-md active:scale-95"
          >
            Đóng Mô Hình
          </button>
        </div>
      </div>
    </div>
  );
}

