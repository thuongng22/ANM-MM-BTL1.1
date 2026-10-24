import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

  const resetFormState = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleToggleMode = (mode) => {
    setIsRegisterMode(mode);
    resetFormState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFormState();

    if (!username.trim()) {
      setError('Vui lòng nhập tên người dùng.');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/register' : '/api/login';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Thao tác không thành công.');
        setLoading(false);
        return;
      }

      if (isRegisterMode) {
        // Đăng ký thành công -> Chuyển sang màn hình Đăng nhập
        setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        setIsRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Đăng nhập thành công -> Chuyển vào chat
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-night flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow ambient background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-[320px] h-[320px] bg-periwinkle/5 rounded-full blur-[110px] pointer-events-none" />

      {/* Auth Card */}
      <div className="w-full max-w-md bg-night-raised border border-white/10 rounded-[32px] p-6 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Logo & Brand Header */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-normal text-on-dark tracking-tight">
            Mercury Messenger
          </h2>
          <p className="text-fog text-sm mt-1.5 font-light">
            Nền tảng giao tiếp bảo mật và tức thì
          </p>
        </div>

        {/* Tab Toggle: Đăng nhập / Đăng ký */}
        <div className="flex bg-night/80 border border-white/10 rounded-full p-1 mb-6">
          <button
            type="button"
            onClick={() => handleToggleMode(false)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-full transition-all ${
              !isRegisterMode
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-fog hover:text-on-dark'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode(true)}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-full transition-all ${
              isRegisterMode
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-fog hover:text-on-dark'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs px-4 py-3 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs px-4 py-3 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-fog font-medium ml-1">
              Tên tài khoản
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập..."
                className="w-full bg-night/80 border border-white/10 focus:border-primary text-on-dark placeholder-slate text-sm pl-11 pr-4 py-3 rounded-full outline-none transition-all shadow-inner"
                maxLength={32}
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-fog font-medium ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-night/80 border border-white/10 focus:border-primary text-on-dark placeholder-slate text-sm pl-11 pr-11 py-3 rounded-full outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-on-dark transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (chỉ hiện khi Đăng ký) */}
          {isRegisterMode && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="text-xs uppercase tracking-wider text-fog font-medium ml-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full bg-night/80 border border-white/10 focus:border-primary text-on-dark placeholder-slate text-sm pl-11 pr-4 py-3 rounded-full outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Submit Action Pill */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-3.5 px-6 rounded-full shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Đang xử lý...' : isRegisterMode ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
              {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-5 border-t border-white/5 text-center text-slate text-xs">
          {isRegisterMode ? (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode(false)}
                className="text-primary hover:underline font-medium"
              >
                Đăng nhập ngay
              </button>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => handleToggleMode(true)}
                className="text-primary hover:underline font-medium"
              >
                Đăng ký tài khoản
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
