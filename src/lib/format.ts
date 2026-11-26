export function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0đ';
  return `${num.toLocaleString('vi-VN')}đ`;
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
}

export function timeAgo(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function maskName(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'Khách hàng';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word.length <= 1 ? word : `${word.slice(0, 2)}***`))
    .join(' ');
}

export function vendorLabel(code: string | null | undefined): string {
  const raw = (code ?? '').trim();
  if (!raw) return 'Gian hàng đã xác minh';
  const digits = raw.replace(/\D/g, '');
  if (digits) return `Gian hàng #${digits.slice(-4)}`;
  const alnum = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (alnum) return `Gian hàng #${alnum.slice(-4).toUpperCase()}`;
  return 'Gian hàng đã xác minh';
}

export interface CategoryMeta {
  slug: string;
  name: string;
  short: string;
  icon: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'facebook',
    name: 'Facebook',
    short: 'FB',
    icon: 'ri-facebook-circle-line',
    description: 'Via cổ, tài khoản quảng cáo, fanpage xanh',
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    short: 'TikTok',
    icon: 'ri-tiktok-line',
    description: 'Kênh nuôi thật, Business Center, tài khoản ads',
  },
  {
    slug: 'gmail',
    name: 'Gmail',
    short: 'Gmail',
    icon: 'ri-mail-line',
    description: 'Gmail cổ, reg mới, số lượng lớn giá sỉ',
  },
  {
    slug: 'telegram',
    name: 'Telegram',
    short: 'Telegram',
    icon: 'ri-telegram-line',
    description: 'Acc cổ, kênh nhiều sub, reg tay số ngoại',
  },
  {
    slug: 'ai-tools',
    name: 'Công cụ AI',
    short: 'AI Tools',
    icon: 'ri-sparkling-2-line',
    description: 'ChatGPT Plus, Midjourney, CapCut Pro',
  },
];

export function getCategory(slug: string): CategoryMeta {
  return (
    CATEGORIES.find((c) => c.slug === slug) ?? {
      slug,
      name: slug,
      short: slug,
      icon: 'ri-shopping-bag-line',
      description: '',
    }
  );
}