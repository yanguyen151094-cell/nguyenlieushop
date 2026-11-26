import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/pages/auth/components/AuthShell';

const ADMIN_USERNAME = 'admin';

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInAsAdmin, session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (loading || !session || !profile) return;
    if (profile?.role === 'admin') {
      navigate('/quan-tri', { replace: true });
      return;
    }
    if (profile?.role === 'vendor') {
      navigate('/kenh-doi-tac', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [loading, session, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const value = identifier.trim();
    if (!value || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    const isAdminLogin = value.toLowerCase() === ADMIN_USERNAME;
    if (!isAdminLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Vui lòng nhập đúng địa chỉ email hoặc tên đăng nhập quản trị.');
      return;
    }

    setSubmitting(true);
    const result = isAdminLogin ? await signInAsAdmin(value, password) : await signIn(value, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (isAdminLogin) navigate('/quan-tri', { replace: true });
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setGoogleLoading(false);
      setError(result.error);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập tài khoản"
      subtitle="Truy cập ví tiền, đơn hàng đã mua và thông tin tài khoản của bạn."
      sideTitle="Quản lý mọi giao dịch tài khoản số trong một nơi duy nhất."
      sidePoints={[
        'Nhận thông tin tài khoản ngay sau khi thanh toán',
        'Lịch sử nạp, mua và bảo hành đầy đủ',
        'Hỗ trợ đổi tài khoản 1-1 khi phát sinh lỗi',
      ]}
    >
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full h-11 inline-flex items-center justify-center gap-2.5 rounded-md border border-background-300 bg-background-50 text-sm font-semibold text-foreground-900 hover:bg-background-100 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
      >
        {googleLoading ? (
          <i className="ri-loader-4-line animate-spin text-base leading-none"></i>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center">
            <i className="ri-google-fill text-lg leading-none text-[#EA4335]"></i>
          </span>
        )}
        {googleLoading ? 'Đang chuyển tới Google...' : 'Đăng nhập bằng Google'}
      </button>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-background-200"></span>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-400">
          hoặc dùng mật khẩu
        </span>
        <span className="flex-1 h-px bg-background-200"></span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="block text-xs font-semibold text-foreground-700 mb-1.5">
            Email hoặc tên đăng nhập
          </label>
          <div className="relative">
            <i className="ri-user-3-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ban@email.com"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-foreground-700 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full h-11 pl-9 pr-11 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Hiện mật khẩu"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded text-foreground-400 hover:text-foreground-700 cursor-pointer"
            >
              <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-base leading-none`}></i>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
            <i className="ri-error-warning-line mt-0.5 text-sm leading-none text-accent-800"></i>
            <p className="text-xs leading-relaxed text-accent-900">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 text-background-50 text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {submitting ? (
            <>
              <i className="ri-loader-4-line animate-spin text-base leading-none"></i>
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>

        <div className="rounded-md border border-background-200 bg-background-100 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-foreground-600">
            <span className="font-semibold text-foreground-800">Quản trị viên:</span> nhập tên đăng nhập{' '}
            <span className="font-mono font-semibold text-primary-700">admin</span> cùng mật khẩu quản trị để vào
            trang điều hành.
          </p>
        </div>

        <p className="text-center text-xs text-foreground-600">
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" className="font-semibold text-primary-600 hover:text-primary-700 cursor-pointer">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}