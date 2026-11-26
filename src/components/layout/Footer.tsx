import { Link } from 'react-router-dom';
import BrandMark from '@/components/brand/BrandMark';
import { useSiteSetting } from '@/hooks/useSiteSetting';
import { DEFAULT_SITE_CONTACT, SETTING_KEYS, type SiteContact } from '@/lib/siteContent';

interface ContactSetting extends Record<string, unknown> {
  contact: SiteContact;
}

const FOOTER_LINKS = [
  {
    title: 'Danh mục',
    links: [
      { label: 'Tài khoản Facebook', to: '/san-pham?category=facebook' },
      { label: 'Tài khoản TikTok', to: '/san-pham?category=tiktok' },
      { label: 'Gmail số lượng lớn', to: '/san-pham?category=gmail' },
      { label: 'Telegram cổ', to: '/san-pham?category=telegram' },
      { label: 'Công cụ AI', to: '/san-pham?category=ai-tools' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Sản phẩm', to: '/san-pham' },
      { label: 'Đăng nhập', to: '/dang-nhap' },
      { label: 'Đăng ký', to: '/dang-ky' },
    ],
  },
];

export default function Footer() {
  const { value } = useSiteSetting<ContactSetting>(SETTING_KEYS.contact, { contact: DEFAULT_SITE_CONTACT });
  const contact = { ...DEFAULT_SITE_CONTACT, ...(value.contact ?? {}) };

  return (
    <footer className="w-full bg-primary-950 text-background-100">
      <div className="w-full px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="lg:col-span-2 max-w-md">
            <div className="flex items-center gap-2.5 mb-4">
              <BrandMark size="md" />
              <span className="font-heading text-lg font-extrabold tracking-tight text-background-50 whitespace-nowrap">
                YAMATO SHOP
              </span>
            </div>
            <p className="text-sm leading-relaxed text-background-300">
              YAMATO SHOP là sàn giao dịch tài khoản số cho người Việt: Facebook, TikTok, Gmail, Telegram và công cụ AI.
              Giao dịch tự động, bảo hành minh bạch, đối tác được xác minh ẩn danh.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {['ri-facebook-circle-line', 'ri-telegram-line', 'ri-message-3-line'].map((icon) => (
                <span
                  key={icon}
                  className="w-9 h-9 flex items-center justify-center rounded-md bg-primary-900 text-background-200"
                >
                  <i className={`${icon} text-base leading-none`}></i>
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-1.5">
              <p className="text-xs text-background-300 flex items-center gap-1.5">
                <i className="ri-phone-line text-sm leading-none text-accent-400"></i>
                {contact.hotline}
              </p>
              <p className="text-xs text-background-300 flex items-center gap-1.5">
                <i className="ri-mail-line text-sm leading-none text-accent-400"></i>
                {contact.email}
              </p>
              <p className="text-xs text-background-300 flex items-start gap-1.5">
                <i className="ri-map-pin-line text-sm leading-none text-accent-400 mt-0.5"></i>
                {contact.address}
              </p>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-background-50 mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-background-300 hover:text-accent-400 transition-colors cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-900 mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-background-400">
            © {new Date().getFullYear()} YAMATO SHOP. Giao dịch số minh bạch và an toàn.
          </p>
          <p className="text-xs text-background-400">
            Hỗ trợ 24/7 · Bảo hành 1 đổi 1 · Thanh toán nội bộ bằng ví
          </p>
        </div>
      </div>
    </footer>
  );
}