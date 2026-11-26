import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { validateOrdinaryPostAuthNext } from '@/lib/authRedirect';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [message, setMessage] = useState('Đang xác thực tài khoản của bạn...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const tokenHash = params.get('token_hash');
      const otpType = params.get('type');
      const errorDescription = params.get('error_description');

      if (errorDescription) {
        setFailed(true);
        setMessage(errorDescription);
        return;
      }

      if (!code && tokenHash && otpType) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
        });
        if (otpError) {
          setFailed(true);
          setMessage(otpError.message);
          return;
        }
        if (otpType === 'recovery') {
          navigate('/auth/reset-password', { replace: true });
          return;
        }
        navigate(validateOrdinaryPostAuthNext(params.get('next')), { replace: true });
        return;
      }

      if (!code) {
        setFailed(true);
        setMessage('Thiếu mã xác thực. Vui lòng đăng nhập lại.');
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setFailed(true);
        setMessage(error.message);
        return;
      }

      if (data.redirectType === 'recovery') {
        navigate('/auth/reset-password', { replace: true });
        return;
      }

      setMessage('Đăng nhập thành công, đang chuyển trang...');
      navigate(validateOrdinaryPostAuthNext(params.get('next')), { replace: true });
    };

    run();
  }, [navigate]);

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-16 bg-background-50">
      <div className="w-full max-w-md rounded-lg border border-background-200 bg-background-50 p-8 text-center">
        <span
          className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${
            failed ? 'bg-accent-100 text-accent-800' : 'bg-primary-100 text-primary-700'
          }`}
        >
          <i
            className={`${failed ? 'ri-error-warning-line' : 'ri-loader-4-line animate-spin'} text-xl leading-none`}
          ></i>
        </span>
        <h1 className="mt-4 font-heading text-lg font-extrabold text-foreground-950">
          {failed ? 'Không thể xác thực' : 'Đang xử lý đăng nhập'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-600">{message}</p>
        {failed && (
          <Link
            to="/dang-nhap"
            className="mt-5 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            Quay lại đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
}