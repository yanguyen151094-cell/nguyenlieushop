export interface BannerSlide {
  key: string;
  platform: string;
  icon: string;
  badge: string;
  title: string;
  highlight: string;
  desc: string;
  image: string;
  to: string;
  cta: string;
}

export interface LiveShowcaseItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  tag: string;
  to: string;
}

export interface DepositBank {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string;
  note: string;
  is_active: boolean;
}

export interface SiteContact {
  hotline: string;
  email: string;
  address: string;
  working_hours: string;
}

export interface DisplayFeeConfig {
  amount: number;
  enabled: boolean;
}

export const SETTING_KEYS = {
  banner: 'banner_slides',
  banks: 'deposit_banks',
  contact: 'site_contact',
  fee: 'display_fee',
  liveShowcase: 'live_showcase',
} as const;

export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    key: 'facebook',
    platform: 'Facebook',
    icon: 'ri-facebook-circle-fill',
    badge: 'Kho via cổ lớn nhất',
    title: 'Via Facebook cổ 2014 - 2019',
    highlight: 'bảo hành 7 ngày miễn phí',
    desc: 'Via đã xác minh danh tính, có 2FA và mail gốc. Đăng nhập ổn định, phù hợp chạy quảng cáo và nuôi tài khoản.',
    image:
      'https://readdy.ai/api/search-image?query=abstract%20dark%20navy%20blue%20technology%20background%20with%20glowing%20social%20network%20connection%20lines%20and%20soft%20light%20particles%2C%20premium%20fintech%20banner%20visual%2C%20high%20detail%20cinematic&width=1600&height=600&seq=yamato-banner-fb-01&orientation=landscape',
    to: '/san-pham?category=facebook',
    cta: 'Xem via Facebook',
  },
  {
    key: 'tiktok',
    platform: 'TikTok',
    icon: 'ri-tiktok-fill',
    badge: 'Business Center xác minh',
    title: 'Tài khoản TikTok Ads',
    highlight: 'chạy quảng cáo không giới hạn',
    desc: 'Business Center đã xác minh, hạn mức chi tiêu cao, không bị giới hạn chiến dịch. Kèm hướng dẫn sử dụng.',
    image:
      'https://readdy.ai/api/search-image?query=modern%20dark%20studio%20background%20with%20soft%20neon%20light%20streaks%20and%20floating%20abstract%20video%20frames%2C%20premium%20social%20media%20advertising%20visual%2C%20cinematic%20depth&width=1600&height=600&seq=yamato-banner-tt-01&orientation=landscape',
    to: '/san-pham?category=tiktok',
    cta: 'Xem tài khoản TikTok',
  },
  {
    key: 'gmail',
    platform: 'Gmail',
    icon: 'ri-mail-fill',
    badge: 'Số lượng lớn - giá sỉ',
    title: 'Gmail cổ & Gmail reg',
    highlight: 'nhập kho liên tục mỗi ngày',
    desc: 'Gmail tạo từ 2018 - 2021, đã bật bảo mật 2 lớp, có mail khôi phục. Mua số lượng lớn có giá ưu đãi.',
    image:
      'https://readdy.ai/api/search-image?query=minimal%20dark%20elegant%20workspace%20with%20glowing%20email%20inbox%20interface%20floating%20in%20space%2C%20soft%20warm%20light%20accents%2C%20premium%20tech%20banner%20composition&width=1600&height=600&seq=yamato-banner-gm-01&orientation=landscape',
    to: '/san-pham?category=gmail',
    cta: 'Xem Gmail cổ',
  },
  {
    key: 'telegram',
    platform: 'Telegram',
    icon: 'ri-telegram-fill',
    badge: 'Kênh nhiều sub',
    title: 'Telegram cổ & kênh VIP',
    highlight: 'tương tác thật, sub Việt',
    desc: 'Tài khoản Telegram cổ 2019, kênh nhiều thành viên thật. Bàn giao ngay sau khi thanh toán bằng ví.',
    image:
      'https://readdy.ai/api/search-image?query=abstract%20dark%20blue%20communication%20network%20with%20paper%20plane%20light%20trails%20and%20glowing%20nodes%2C%20premium%20messaging%20app%20banner%20visual%2C%20cinematic%20lighting&width=1600&height=600&seq=yamato-banner-tg-01&orientation=landscape',
    to: '/san-pham?category=telegram',
    cta: 'Xem Telegram',
  },
  {
    key: 'ai-tools',
    platform: 'AI Tools',
    icon: 'ri-sparkling-2-fill',
    badge: 'ChatGPT · Midjourney · CapCut',
    title: 'Công cụ AI bản quyền',
    highlight: 'kích hoạt trong 5 phút',
    desc: 'ChatGPT Plus, Midjourney, CapCut Pro và nhiều công cụ AI khác. Tài khoản riêng, không dùng chung, bảo hành theo shop.',
    image:
      'https://readdy.ai/api/search-image?query=futuristic%20abstract%20dark%20background%20with%20soft%20glowing%20neural%20network%20patterns%20and%20amber%20light%20accents%2C%20premium%20artificial%20intelligence%20technology%20banner%2C%20cinematic&width=1600&height=600&seq=yamato-banner-ai-01&orientation=landscape',
    to: '/san-pham?category=ai-tools',
    cta: 'Xem công cụ AI',
  },
];

export const DEFAULT_DEPOSIT_BANKS: DepositBank[] = [
  {
    id: 'bank-vcb',
    bank_name: 'Vietcombank',
    account_number: '0123456789',
    account_holder: 'YAMATO SHOP',
    branch: 'Chi nhánh Hà Nội',
    note: 'Nội dung chuyển khoản ghi đúng mã nạp để được duyệt nhanh.',
    is_active: true,
  },
  {
    id: 'bank-mb',
    bank_name: 'MB Bank',
    account_number: '0987654321',
    account_holder: 'YAMATO SHOP',
    branch: 'Chi nhánh Sài Gòn',
    note: 'Hỗ trợ nạp 24/7, duyệt trong 5 - 15 phút.',
    is_active: true,
  },
];

export const DEFAULT_SITE_CONTACT: SiteContact = {
  hotline: '0900 123 456',
  email: 'hotro@yamatoshop.vn',
  address: 'Số 12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  working_hours: 'Hỗ trợ 24/7 · Bảo hành 1 đổi 1',
};

export const DEFAULT_DISPLAY_FEE: DisplayFeeConfig = {
  amount: 100000,
  enabled: true,
};

export const DEFAULT_LIVE_SHOWCASE: LiveShowcaseItem[] = [
  {
    id: 'live-tiktok-01',
    image:
      'https://readdy.ai/api/search-image?query=dark%20studio%20portrait%20composition%20with%20pink%20and%20cyan%20neon%20light%20streaks%2C%20smartphone%20livestream%20interface%20frames%20floating%2C%20glowing%20social%20media%20live%20badge%2C%20premium%20tech%20advertising%20visual%2C%20cinematic%20depth&width=800&height=1000&seq=yamato-live-tiktok-01&orientation=portrait',
    title: 'TikTok Live 10K follow',
    subtitle: 'Tài khoản đã bật live, tặng kèm hướng dẫn lên sóng',
    tag: 'Đang live',
    to: '/san-pham?brand=tiktok',
  },
  {
    id: 'live-facebook-01',
    image:
      'https://readdy.ai/api/search-image?query=dark%20elegant%20composition%20with%20deep%20blue%20glow%20and%20floating%20live%20video%20frames%2C%20social%20streaming%20interface%20glass%20panels%2C%20warm%20rim%20light%2C%20premium%20digital%20commerce%20banner%20visual&width=800&height=1000&seq=yamato-live-facebook-01&orientation=portrait',
    title: 'Facebook Live 5K like',
    subtitle: 'Fanpage xanh đã xác minh, mở live không giới hạn',
    tag: 'Fanpage xanh',
    to: '/san-pham?brand=facebook',
  },
  {
    id: 'live-shopee-01',
    image:
      'https://readdy.ai/api/search-image?query=warm%20amber%20and%20orange%20abstract%20light%20background%20with%20floating%20shopping%20live%20stream%20windows%2C%20soft%20geometric%20shapes%2C%20premium%20ecommerce%20promotional%20visual%2C%20cinematic%20glow&width=800&height=1000&seq=yamato-live-shopee-01&orientation=portrait',
    title: 'Shopee Live bán hàng',
    subtitle: 'Tài khoản shop uy tín, sẵn sàng phiên live đầu tiên',
    tag: 'Bán hàng',
    to: '/san-pham',
  },
  {
    id: 'live-youtube-01',
    image:
      'https://readdy.ai/api/search-image?query=dark%20cinematic%20background%20with%20soft%20red%20glow%20and%20floating%20video%20player%20frames%2C%20abstract%20broadcast%20waves%2C%20premium%20streaming%20platform%20visual%2C%20high%20detail&width=800&height=1000&seq=yamato-live-youtube-01&orientation=portrait',
    title: 'YouTube Live 1K sub',
    subtitle: 'Kênh đã bật live, gắn được thẻ thanh toán',
    tag: 'Kiếm tiền',
    to: '/san-pham',
  },
  {
    id: 'live-telegram-01',
    image:
      'https://readdy.ai/api/search-image?query=deep%20teal%20abstract%20background%20with%20glowing%20message%20bubbles%20and%20paper%20plane%20light%20trails%2C%20premium%20messaging%20app%20live%20showcase%20visual%2C%20cinematic%20lighting&width=800&height=1000&seq=yamato-live-telegram-01&orientation=portrait',
    title: 'Telegram kênh 5K sub',
    subtitle: 'Kênh sub Việt thật, phù hợp livestream bán hàng',
    tag: 'Kênh lớn',
    to: '/san-pham?brand=telegram',
  },
];