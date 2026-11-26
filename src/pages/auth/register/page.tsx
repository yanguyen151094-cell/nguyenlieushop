import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import AuthShell from '@/pages/auth/components/AuthShell';

const PARTNER_INTENT_KEY = 'yamato_partner_intent';

type Mode = 'customer' | 'partner';

export default function RegisterPage() {
  const { signUp, session, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'partner' ? 'partner' : 'customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerNote, setPartnerNote] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(searchParams.get('mode') === 'partner' ? 'partner' : 'customer');
  }, [searchParams]);

  useEffect(() => {
    if (!loading && session && !submitting) navigate('/', { replace: true });
  }, [loading, session, submitting, navigate]);

  const openChat = () => {
    navigate('/', { replace: true });
    window.setTimeout(() => window.dispatchEvent(new Event('yamato:open-chat')), 400);
  };

  const sendPartnerRequest = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return false;
    const content = [
      'Đăng ký làm đối tác bán hàng',
      `Tên shop: ${shopName.trim()}`,
      `Điện thoại: ${phone.trim() || 'Chưa cung cấp'}`,
      `Ghi chú: ${partnerNote.trim() || 'Không có'}`,
    ].join('\n');
    const { error: insertError } = await supabase.from('messages').insert({
      user_id: uid,
      sender_role: 'user',
      content: content.slice(0, 1000),
    });
    return !insertError;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (fullName.trim().length < 2) {
      setError('Vui lòng nhập họ tên của bạn.');
      return;
    }
    if (mode === 'partner' && shopName.trim().length < 2) {
      setError('Vui lòng nhập tên gian hàng bạn muốn mở.');
      return;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    if (!agree) {
      setError('Bạn cần đồng ý với điều khoản sử dụng.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password, fullName.trim());

    if (result.error) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    if (result.needConfirm) {
      if (mode === 'partner') {
        localStorage.setItem(
          PARTNER_INTENT_KEY,
          JSON.stringify({ shopName: shopName.trim(), phone: phone.trim(), note: partnerNote.trim() }),
        );
      }
      setSubmitting(false);
      setNotice(
        mode === 'partner'
          ? 'Đăng ký thành công. Vui lòng xác nhận email, sau khi đăng nhập yêu cầu làm đối tác sẽ tự gửi tới admin trong khung chat.'
          : 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.',
      );
      return;
    }

    if (mode === 'partner') {
      const sent = await sendPartnerRequest();
      localStorage.removeItem(PARTNER_INTENT_KEY);
      setSubmitting(false);
      setNotice(
        sent
          ? 'Đã gửi yêu cầu làm đối tác tới admin. Khung chat đang mở để bạn trao đổi trực tiếp.'
          : 'Đã tạo tài khoản đối tác. Bạn có thể nhắn admin qua khung chat để được duyệt gian hàng.',
      );
      openChat();
      return;
    }

    setSubmitting(false);
    navigate('/', { replace: true });
  };

  return (
    <AuthShell
      title="Tạo tài khoản miễn phí"
      subtitle="Mở ví điện tử nội bộ để mua tài khoản số và nhận bảo hành minh bạch."
      sideTitle="Bắt đầu mua sắm hoặc mở gian hàng chỉ trong vài phút."
      sidePoints={[
        'Không phí duy trì, không phí ẩn',
        'Nạp tiền bằng chuyển khoản ngân hàng',
        mode === 'partner'
          ? 'Đăng ký đối tác xong là vào thẳng phòng chat với admin'
          : 'Đăng ký làm đối tác bán hàng bất cứ lúc nào',
      ]}
    >
      <div className="mb-4 flex items-center gap-1 p-1 rounded-full bg-background-100 border border-background-200">
        <button
          type="button"
          onClick={() => setMode('customer')}
          className={`flex-1 h-8 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            mode === 'customer' ? 'bg-primary-500 text-background-50' : 'text-foreground-700 hover:text-primary-600'
          }`}
        >
          Khách mua hàng
        </button>
        <button
          type="button"
          onClick={() => setMode('partner')}
          className={`flex-1 h-8 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            mode === 'partner' ? 'bg-primary-500 text-background-50' : 'text-foreground-700 hover:text-primary-600'
          }`}
        >
          Đối tác bán hàng
        </button>
      </div>

      {mode === 'partner' && (
        <div className="mb-3.5 flex items-start gap-2 rounded-md border border-accent-200 bg-accent-50 px-3 py-2.5">
          <i className="ri-store-2-line mt-0.5 text-sm leading-none text-accent-700"></i>
          <p className="text-[11px] leading-relaxed text-accent-900">
            Đăng ký đối tác xong, hệ thống tự gửi yêu cầu mở gian hàng tới admin và mở khung chat để bạn trao đổi trực
            tiếp.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="fullName" className="block text-xs font-semibold text-foreground-700 mb-1.5">
            Họ và tên
          </label>
          <div className="relative">
            <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="regEmail" className="block text-xs font-semibold text-foreground-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
            <input
              id="regEmail"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.com"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {mode === 'partner' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="shopName" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  Tên gian hàng
                </label>
                <input
                  id="shopName"
                  name="shopName"
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="VD: Shop Tài Khoản Số"
                  className="w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="min-w-0">
                <label htmlFor="phone" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                  Số điện thoại / Zalo
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div>
              <label htmlFor="partnerNote" className="block text-xs font-semibold text-foreground-700 mb-1.5">
                Bạn muốn bán mặt hàng gì?
              </label>
              <textarea
                id="partnerNote"
                name="partnerNote"
                rows={2}
                maxLength={300}
                value={partnerNote}
                onChange={(e) => setPartnerNote(e.target.value.slice(0, 300))}
                placeholder="VD: Tài khoản TikTok, Gmail cổ, ChatGPT Plus..."
                className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm leading-relaxed resize-none focus:outline-none focus:border-primary-400"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor="regPassword" className="block text-xs font-semibold text-foreground-700 mb-1.5">
              Mật khẩu
            </label>
            <input
              id="regPassword"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="regConfirm" className="block text-xs font-semibold text-foreground-700 mb-1.5">
              Nhập lại mật khẩu
            </label>
            <input
              id="regConfirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full h-11 px-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-background-300 text-primary-500 accent-primary-500 cursor-pointer"
          />
          <span className="text-xs leading-relaxed text-foreground-600">
            Tôi đồng ý với điều khoản sử dụng và chính sách bảo hành của YAMATO SHOP.
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
            <i className="ri-error-warning-line mt-0.5 text-sm leading-none text-accent-800"></i>
            <p className="text-xs leading-relaxed text-accent-900">{error}</p>
          </div>
        )}

        {notice && (
          <div className="flex items-start gap-2 rounded-md border border-primary-200 bg-primary-50 px-3 py-2.5">
            <i className="ri-mail-check-line mt-0.5 text-sm leading-none text-primary-700"></i>
            <p className="text-xs leading-relaxed text-primary-800">{notice}</p>
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
              Đang tạo tài khoản...
            </>
          ) : mode === 'partner' ? (
            'Đăng ký đối tác & nhắn admin'
          ) : (
            'Đăng ký'
          )}
        </button>

        <p className="text-center text-xs text-foreground-600">
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" className="font-semibold text-primary-600 hover:text-primary-700 cursor-pointer">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}