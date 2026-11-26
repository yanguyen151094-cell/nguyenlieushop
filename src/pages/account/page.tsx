import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/format';
import PurchaseHistory from './components/PurchaseHistory';

export default function AccountPage() {
  const { profile, session, loading, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="w-full px-4 md:px-8 py-10">
        <div className="h-24 rounded-lg bg-background-100 animate-pulse"></div>
        <div className="mt-4 h-64 rounded-lg bg-background-100 animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <span className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <i className="ri-user-3-line text-2xl leading-none"></i>
        </span>
        <h1 className="mt-4 font-heading text-xl font-extrabold text-foreground-950">Tài khoản của bạn</h1>
        <p className="mt-1.5 text-sm text-foreground-600">Đăng nhập để xem lịch sử mua hàng và tra cứu tài khoản đã mua.</p>
        <Link
          to="/dang-nhap"
          className="mt-5 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <p className="text-sm text-foreground-600">Không tải được hồ sơ của bạn. Vui lòng thử lại.</p>
      </div>
    );
  }

  const displayName = profile.full_name?.trim() || profile.email?.split('@')[0] || 'Khách hàng';

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-10">
      <div className="rounded-lg bg-primary-950 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-14 h-14 shrink-0 rounded-full bg-background-50/10 border border-background-50/20 flex items-center justify-center text-background-50 font-heading text-xl font-extrabold uppercase">
              {displayName.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-xl md:text-2xl font-extrabold text-background-50 truncate">{displayName}</h1>
              <p className="mt-1 text-xs text-background-300 truncate">{profile.email ?? ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-md bg-background-50/10 border border-background-50/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-background-300">Số dư ví</p>
              <p className="mt-1 font-heading text-sm font-extrabold text-background-50 whitespace-nowrap">
                {formatCurrency(profile.balance)}
              </p>
              <Link
                to="/nap-tien"
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-accent-300 hover:text-accent-200 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-add-line text-xs leading-none"></i>
                Nạp thêm tiền
              </Link>
            </div>
            <div className="rounded-md bg-background-50/10 border border-background-50/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-background-300">Hỗ trợ</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-background-50">
                <i className="ri-chat-3-line text-sm leading-none"></i>
                Chat trực tuyến
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <PurchaseHistory buyerId={profile.id} />
      </div>

      <div className="mt-4 rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground-950">Cần hỗ trợ về đơn đã mua?</p>
            <p className="mt-1 text-xs text-foreground-600">
              Bấm bong bóng chat ở góc phải màn hình để liên hệ quản trị viên. Khi cần, quản trị viên sẽ thêm đối tác bán
              vào đúng phòng chat của bạn.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/nap-tien"
              className="h-10 px-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              <i className="ri-wallet-3-line text-base leading-none"></i>
              Nạp tiền
            </Link>
            <Link
              to="/san-pham"
              className="h-10 px-4 inline-flex items-center justify-center rounded-md border border-background-300 text-sm font-semibold text-foreground-800 hover:bg-background-100 whitespace-nowrap cursor-pointer"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}