import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/format';
import BrandMark from '@/components/brand/BrandMark';

const NAV_ITEMS = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Sản phẩm', to: '/san-pham' },
  { label: 'Danh mục', to: '/san-pham#danh-muc' },
];

export default function Header() {
  const { profile, session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/san-pham?q=${encodeURIComponent(q)}` : '/san-pham');
  };

  const displayName =
    profile?.full_name?.trim() ||
    session?.user?.email?.split('@')[0] ||
    'Tài khoản';

  const isPartner = profile?.role === 'vendor' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? 'bg-background-50/95 backdrop-blur border-b border-background-200'
          : 'bg-background-50 border-b border-transparent'
      }`}
    >
      <div className="w-full px-4 md:px-8">
        <div className="flex h-16 md:h-[72px] items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 cursor-pointer">
            <BrandMark size="md" />
            <span className="leading-none">
              <span className="block font-heading text-[17px] font-extrabold tracking-tight text-foreground-950 whitespace-nowrap">
                YAMATO SHOP
              </span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-foreground-500 mt-1">
                Sàn tài khoản số
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm font-medium text-foreground-700 hover:text-primary-600 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                {item.label}
              </Link>
            ))}
            {!profile && (
              <Link
                to="/dang-ky?mode=partner"
                className="px-3 py-2 text-sm font-medium text-foreground-700 hover:text-primary-600 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Đăng ký đối tác
              </Link>
            )}
            {profile && (
              <Link
                to="/tai-khoan"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  location.pathname.startsWith('/tai-khoan')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-foreground-700 hover:text-primary-600'
                }`}
              >
                Tài khoản
              </Link>
            )}
            {isPartner && (
              <Link
                to="/kenh-doi-tac"
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  location.pathname.startsWith('/kenh-doi-tac')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-primary-700 hover:text-primary-600'
                }`}
              >
                Kênh đối tác
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/quan-tri"
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  location.pathname.startsWith('/quan-tri')
                    ? 'text-accent-800 bg-accent-100'
                    : 'text-accent-800 hover:text-accent-900'
                }`}
              >
                Quản trị
              </Link>
            )}
          </nav>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md ml-auto">
            <div className="relative w-full">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="search"
                placeholder="Tìm tài khoản Facebook, Gmail, ChatGPT..."
                className="w-full h-10 pl-9 pr-3 rounded-md border border-background-200 bg-background-100 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-300 focus:bg-background-50 transition-colors"
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-2 ml-auto md:ml-0">
            {profile ? (
              <>
                <Link
                  to="/nap-tien"
                  title="Nạp tiền vào ví"
                  className="flex items-center gap-2 h-10 px-3 rounded-md bg-accent-100 border border-accent-200 hover:bg-accent-200 transition-colors cursor-pointer"
                >
                  <i className="ri-wallet-3-line text-accent-700 text-base leading-none"></i>
                  <span className="text-sm font-semibold text-accent-900 whitespace-nowrap">
                    {formatCurrency(profile.balance)}
                  </span>
                  <i className="ri-add-line text-accent-800 text-xs leading-none"></i>
                </Link>
                <Link
                  to="/tai-khoan"
                  className="flex items-center gap-2 pl-1 rounded-md hover:bg-background-100 py-1 px-1 transition-colors cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold uppercase">
                    {displayName.slice(0, 1)}
                  </span>
                  <span className="hidden xl:block text-sm font-medium text-foreground-800 max-w-[120px] truncate">
                    {displayName}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="h-10 px-3 rounded-md text-sm font-medium text-foreground-600 hover:text-primary-600 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dang-nhap"
                  className="h-10 px-4 inline-flex items-center rounded-md text-sm font-semibold text-foreground-800 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  className="h-10 px-4 inline-flex items-center rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Mở menu"
            className="md:hidden ml-auto w-10 h-10 flex items-center justify-center rounded-md border border-background-200 text-foreground-800 cursor-pointer"
          >
            <i className={`${menuOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl leading-none`}></i>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-background-200 bg-background-50 px-4 py-4 animate-fade-up">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative w-full">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="search"
                placeholder="Tìm sản phẩm..."
                className="w-full h-10 pl-9 pr-3 rounded-md border border-background-200 bg-background-100 text-sm focus:outline-none focus:border-primary-300"
              />
            </div>
          </form>
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="py-2.5 text-sm font-medium text-foreground-800 border-b border-background-100 last:border-0 cursor-pointer"
              >
                {item.label}
              </Link>
            ))}
            {!profile && (
              <Link
                to="/dang-ky?mode=partner"
                className="py-2.5 text-sm font-semibold text-primary-700 border-b border-background-100 cursor-pointer"
              >
                Đăng ký đối tác
              </Link>
            )}
            {isPartner && (
              <Link
                to="/kenh-doi-tac"
                className="py-2.5 text-sm font-semibold text-primary-700 border-b border-background-100 cursor-pointer"
              >
                Kênh đối tác
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/quan-tri"
                className="py-2.5 text-sm font-semibold text-accent-800 border-b border-background-100 cursor-pointer"
              >
                Quản trị
              </Link>
            )}
          </div>
          <div className="mt-4">
            {profile ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/nap-tien"
                  className="h-10 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold cursor-pointer"
                >
                  <i className="ri-wallet-3-line text-base leading-none"></i>
                  Nạp tiền vào ví
                </Link>
                <Link
                  to="/tai-khoan"
                  className="flex items-center justify-between rounded-md bg-accent-100 border border-accent-200 px-3 py-2.5 cursor-pointer"
                >
                  <span className="text-sm font-medium text-accent-900">Số dư ví</span>
                  <span className="text-sm font-bold text-accent-900">{formatCurrency(profile.balance)}</span>
                </Link>
                <Link
                  to="/tai-khoan"
                  className="h-10 inline-flex items-center justify-center gap-1.5 rounded-md border border-background-200 text-sm font-semibold text-foreground-800 cursor-pointer"
                >
                  <i className="ri-user-3-line text-base leading-none"></i>
                  Tài khoản & lịch sử mua
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="h-10 rounded-md border border-background-200 text-sm font-semibold text-foreground-800 cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/dang-nhap"
                  className="h-10 inline-flex items-center justify-center rounded-md border border-background-200 text-sm font-semibold text-foreground-800 cursor-pointer"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-ky"
                  className="h-10 inline-flex items-center justify-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold cursor-pointer"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}