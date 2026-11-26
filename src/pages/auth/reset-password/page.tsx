import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setHasSession(Boolean(data.session));
      })
      .catch(() => {
        if (active) setHasSession(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/dang-nhap', { replace: true }), 1600);
  };

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-background-50">
      <div className="w-full max-w-md rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
        <h1 className="font-heading text-xl font-extrabold text-foreground-950">Đặt lại mật khẩu</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-600">
          Tạo mật khẩu mới cho tài khoản của bạn để tiếp tục sử dụng YAMATO SHOP.
        </p>

        {hasSession === false && (
          <div className="mt-5 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
            <p className="text-xs leading-relaxed text-accent-900">
              Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại email khôi phục mật khẩu.
            </p>
          </div>
        )}

        {done ? (
          <div className="mt-5 rounded-md border border-primary-200 bg-primary-50 px-3 py-2.5">
            <p className="text-xs leading-relaxed text-primary-800">
              Đổi mật khẩu thành công. Đang chuyển tới trang đăng nhập...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                Nhập lại mật khẩu
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {error && <p className="text-xs leading-relaxed text-accent-800">{error}</p>}

            <button
              type="submit"
              disabled={submitting || hasSession === false}
              className="w-full h-11 rounded-md bg-primary-500 text-background-50 text-sm font-bold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Xác nhận mật khẩu mới'}
            </button>
            <p className="text-center text-xs text-foreground-600">
              <Link to="/dang-nhap" className="font-semibold text-primary-600 cursor-pointer">
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}