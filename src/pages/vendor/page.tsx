import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/format';
import ShopProfileForm from './components/ShopProfileForm';
import ShopGallery from './components/ShopGallery';
import VendorProducts from './components/VendorProducts';
import VendorWallet from './components/VendorWallet';
import VendorInbox from './components/VendorInbox';
import VendorNotifications from './components/VendorNotifications';

type Tab = 'shop' | 'products' | 'wallet' | 'inbox' | 'notices';

const TABS: { key: Tab; label: string }[] = [
  { key: 'shop', label: 'Gian hàng & hình ảnh' },
  { key: 'products', label: 'Sản phẩm & giá bán' },
  { key: 'wallet', label: 'Ví & rút tiền' },
  { key: 'inbox', label: 'Hộp thư khách hàng' },
  { key: 'notices', label: 'Thông báo' },
];

export default function VendorDashboardPage() {
  const { profile, loading, session, refreshProfile, profileLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('shop');

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
          <i className="ri-store-3-line text-2xl leading-none"></i>
        </span>
        <h1 className="mt-4 font-heading text-xl font-extrabold text-foreground-950">Kênh đối tác</h1>
        <p className="mt-1.5 text-sm text-foreground-600">Bạn cần đăng nhập để quản lý gian hàng của mình.</p>
        <Link
          to="/dang-nhap"
          className="mt-5 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const isPartner = profile?.role === 'vendor' || profile?.role === 'admin';

  if (!profile) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <p className="text-sm text-foreground-600">Không tải được hồ sơ của bạn. Vui lòng thử lại.</p>
        <button
          type="button"
          onClick={() => refreshProfile()}
          className="mt-4 h-10 px-4 inline-flex items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          Tải lại hồ sơ
        </button>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="w-full px-4 md:px-8 py-16">
        <div className="max-w-2xl mx-auto rounded-lg border border-background-200 bg-background-50 p-6 md:p-8 text-center">
          <span className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-accent-100 text-accent-800">
            <i className="ri-store-2-line text-2xl leading-none"></i>
          </span>
          <h1 className="mt-4 font-heading text-xl font-extrabold text-foreground-950">Bạn chưa phải đối tác bán hàng</h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground-600">
            Gian hàng đối tác do quản trị viên cấp. Hãy gửi yêu cầu mở gian hàng, quản trị viên sẽ xác minh và kích hoạt
            kênh bán cho bạn.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/san-pham"
              className="h-10 px-4 inline-flex items-center rounded-md border border-background-300 text-sm font-semibold text-foreground-800 hover:bg-background-100 whitespace-nowrap cursor-pointer"
            >
              Xem sản phẩm trên sàn
            </Link>
            <span className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold whitespace-nowrap">
              <i className="ri-chat-3-line text-base leading-none"></i>
              Nhắn tin cho quản trị viên
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-foreground-500">
            Mẹo: bấm bong bóng chat ở góc phải màn hình để gửi yêu cầu mở gian hàng trực tiếp cho quản trị viên.
          </p>
        </div>
      </div>
    );
  }

  const vendorCode = profile?.store_code || `#${(profile?.id ?? '').slice(0, 4).toUpperCase()}`;

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-10">
      <div className="rounded-lg bg-primary-950 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-background-50/10 border border-background-50/20 text-[10px] font-bold uppercase tracking-[0.14em] text-background-100">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
              Kênh đối tác
            </span>
            <h1 className="mt-3 font-heading text-xl md:text-2xl font-extrabold text-background-50">
              {profile?.store_name || 'Gian hàng của bạn'}
            </h1>
            <p className="mt-1.5 text-xs text-background-300">
              Mã gian hàng <span className="font-semibold text-background-50">{vendorCode}</span> · Người mua chỉ thấy mã
              này, không thấy tên thật của bạn.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="rounded-md bg-background-50/10 border border-background-50/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-background-300">Số dư khả dụng</p>
              <p className="mt-1 font-heading text-sm font-extrabold text-background-50 whitespace-nowrap">
                {formatCurrency(profile?.balance ?? 0)}
              </p>
            </div>
            <div className="rounded-md bg-background-50/10 border border-background-50/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-background-300">Chờ rút</p>
              <p className="mt-1 font-heading text-sm font-extrabold text-background-50 whitespace-nowrap">
                {formatCurrency(profile?.pending_balance ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1 p-1 rounded-full bg-background-100 border border-background-200 w-full overflow-x-auto no-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === item.key ? 'bg-primary-500 text-background-50' : 'text-foreground-700 hover:text-primary-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === 'shop' && (
          <>
            {profile && <ShopProfileForm profile={profile} onSaved={refreshProfile} />}
            {profile && <ShopGallery vendorId={profile.id} />}
          </>
        )}
        {tab === 'products' && (
          <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
            <VendorProducts
              vendorId={profile?.id ?? ''}
              vendorCode={vendorCode}
              shopWarrantyDays={profile?.store_warranty_days ?? 7}
            />
          </div>
        )}
        {tab === 'wallet' && profile && <VendorWallet profile={profile} onChanged={refreshProfile} />}
        {tab === 'inbox' && profile && <VendorInbox vendorId={profile.id} />}
        {tab === 'notices' && profile && <VendorNotifications vendorId={profile.id} />}
      </div>
    </div>
  );
}