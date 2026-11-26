export interface BrandTheme {
  key: string;
  label: string;
  icon: string;
  gradient: string;
  glow: string;
}

function brand(
  key: string,
  label: string,
  icon: string,
  gradient: string,
  glow: string,
): BrandTheme {
  return { key, label, icon, gradient, glow };
}

const BRANDS: Record<string, BrandTheme> = {
  tiktok: brand(
    'tiktok',
    'TikTok',
    'ri-tiktok-fill',
    'linear-gradient(140deg, #1f1f24 0%, #0b0b0e 55%, #16161b 100%)',
    '#25f4ee',
  ),
  facebook: brand(
    'facebook',
    'Facebook',
    'ri-facebook-fill',
    'linear-gradient(140deg, #3b8bfa 0%, #1877f2 48%, #0a4ea3 100%)',
    '#8fc3ff',
  ),
  gmail: brand(
    'gmail',
    'Gmail',
    'ri-mail-fill',
    'linear-gradient(140deg, #f0685b 0%, #d93025 52%, #98160f 100%)',
    '#ffd0c9',
  ),
  telegram: brand(
    'telegram',
    'Telegram',
    'ri-telegram-fill',
    'linear-gradient(140deg, #49c6f7 0%, #2aabee 50%, #15688f 100%)',
    '#c6ecff',
  ),
  chatgpt: brand(
    'chatgpt',
    'ChatGPT',
    'ri-sparkling-2-fill',
    'linear-gradient(140deg, #27c3a9 0%, #10a37f 50%, #05624e 100%)',
    '#b9f5e6',
  ),
  midjourney: brand(
    'midjourney',
    'Midjourney',
    'ri-magic-fill',
    'linear-gradient(140deg, #34302a 0%, #17150f 60%, #211d16 100%)',
    '#e2bd77',
  ),
  capcut: brand(
    'capcut',
    'CapCut',
    'ri-scissors-cut-fill',
    'linear-gradient(140deg, #26262e 0%, #101014 55%, #1a1a20 100%)',
    '#9fe6ff',
  ),
  canva: brand(
    'canva',
    'Canva',
    'ri-palette-fill',
    'linear-gradient(140deg, #2fd3c4 0%, #00a4b4 50%, #046b78 100%)',
    '#c4fff7',
  ),
  instagram: brand(
    'instagram',
    'Instagram',
    'ri-instagram-fill',
    'linear-gradient(140deg, #f4b23f 0%, #e0376f 55%, #8a3a86 100%)',
    '#ffd9e6',
  ),
  youtube: brand(
    'youtube',
    'YouTube',
    'ri-youtube-fill',
    'linear-gradient(140deg, #f24a3f 0%, #d8231b 55%, #8f0f0a 100%)',
    '#ffc9c4',
  ),
  twitterx: brand(
    'twitterx',
    'X / Twitter',
    'ri-twitter-x-fill',
    'linear-gradient(140deg, #2b2b30 0%, #0a0a0c 60%, #16161a 100%)',
    '#c9c9cf',
  ),
  shopee: brand(
    'shopee',
    'Shopee',
    'ri-store-2-fill',
    'linear-gradient(140deg, #ff8a4c 0%, #ee4d2d 55%, #a52d16 100%)',
    '#ffd8c6',
  ),
  netflix: brand(
    'netflix',
    'Netflix',
    'ri-netflix-fill',
    'linear-gradient(140deg, #3a1012 0%, #14100f 60%, #241012 100%)',
    '#e50914',
  ),
  spotify: brand(
    'spotify',
    'Spotify',
    'ri-spotify-fill',
    'linear-gradient(140deg, #3ddc84 0%, #1db954 52%, #0f7c37 100%)',
    '#d3ffe5',
  ),
  steam: brand(
    'steam',
    'Steam',
    'ri-steam-fill',
    'linear-gradient(140deg, #2f4f74 0%, #16202e 60%, #0d151f 100%)',
    '#a9c8ea',
  ),
  discord: brand(
    'discord',
    'Discord',
    'ri-discord-fill',
    'linear-gradient(140deg, #6a7ae0 0%, #4752c4 55%, #2c3380 100%)',
    '#d6dbff',
  ),
  whatsapp: brand(
    'whatsapp',
    'WhatsApp',
    'ri-whatsapp-fill',
    'linear-gradient(140deg, #4fd07a 0%, #25d366 50%, #10804a 100%)',
    '#d8ffe6',
  ),
  google: brand(
    'google',
    'Google',
    'ri-google-fill',
    'linear-gradient(140deg, #4b8cf3 0%, #2d6bda 55%, #1a3f86 100%)',
    '#d6e6ff',
  ),
  apple: brand(
    'apple',
    'Apple',
    'ri-apple-fill',
    'linear-gradient(140deg, #3a3a3f 0%, #121214 60%, #1f1f23 100%)',
    '#e3e3e8',
  ),
  github: brand(
    'github',
    'GitHub',
    'ri-github-fill',
    'linear-gradient(140deg, #37373d 0%, #17171a 58%, #232327 100%)',
    '#e6e6ea',
  ),
  ai: brand(
    'ai',
    'AI Tools',
    'ri-sparkling-2-fill',
    'linear-gradient(140deg, #2ec4b6 0%, #12867e 52%, #07544f 100%)',
    '#c3f7f2',
  ),
  generic: brand(
    'generic',
    'Tài khoản số',
    'ri-shield-keyhole-fill',
    'linear-gradient(140deg, oklch(var(--primary-600)), oklch(var(--primary-900)) 70%, oklch(var(--primary-950)))',
    'oklch(var(--accent-400))',
  ),
};

const MATCHERS: { key: string; test: RegExp }[] = [
  { key: 'tiktok', test: /tiktok|tik tok/i },
  { key: 'gmail', test: /gmail|google mail/i },
  { key: 'facebook', test: /facebook|fanpage|via\b|\bfb\b/i },
  { key: 'telegram', test: /telegram|\btg\b/i },
  { key: 'chatgpt', test: /chatgpt|openai|\bgpt\b/i },
  { key: 'midjourney', test: /midjourney/i },
  { key: 'capcut', test: /capcut/i },
  { key: 'canva', test: /canva/i },
  { key: 'instagram', test: /instagram|\bigs\b/i },
  { key: 'youtube', test: /youtube/i },
  { key: 'twitterx', test: /twitter|\bx premium\b/i },
  { key: 'shopee', test: /shopee/i },
  { key: 'netflix', test: /netflix/i },
  { key: 'spotify', test: /spotify/i },
  { key: 'steam', test: /steam/i },
  { key: 'discord', test: /discord/i },
  { key: 'whatsapp', test: /whatsapp/i },
  { key: 'apple', test: /apple|icloud/i },
  { key: 'github', test: /github/i },
  { key: 'google', test: /google|drive\b/i },
];

const CATEGORY_BRAND: Record<string, string> = {
  facebook: 'facebook',
  tiktok: 'tiktok',
  gmail: 'gmail',
  telegram: 'telegram',
  'ai-tools': 'ai',
};

const SEED_MARKERS = ['readdy.ai/api/search-image', 'images.unsplash.com', 'source.unsplash.com'];

export function isSeedImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return SEED_MARKERS.some((marker) => url.includes(marker));
}

export function detectBrand(name: string | null | undefined, category?: string | null): BrandTheme {
  const text = (name ?? '').trim();
  for (const matcher of MATCHERS) {
    if (matcher.test.test(text)) {
      const found = BRANDS[matcher.key];
      if (found) return found;
    }
  }
  const byCategory = category ? CATEGORY_BRAND[category] : undefined;
  if (byCategory && BRANDS[byCategory]) return BRANDS[byCategory];
  return BRANDS.generic;
}

interface CoverSource {
  name: string;
  category: string;
  image_url?: string | null;
  images?: string[] | null;
}

/** Ảnh do đối tác tự tải lên / tự dán liên kết, không tính ảnh mẫu của sàn. */
export function realProductImages(product: CoverSource): string[] {
  const raw = [product.image_url, ...(product.images ?? [])].filter(Boolean) as string[];
  const seen = new Set<string>();
  return raw.filter((url) => {
    if (isSeedImage(url) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export function getBrandForProduct(product: CoverSource): BrandTheme {
  return detectBrand(product.name, product.category);
}

/** Ảnh bìa hiển thị: ảnh thật của đối tác, nếu không có thì dùng ảnh thương hiệu mặc định. */
export function resolveCover(product: CoverSource): { image: string | null; brand: BrandTheme } {
  const images = realProductImages(product);
  return { image: images[0] ?? null, brand: getBrandForProduct(product) };
}

/** Danh sách thương hiệu hiển thị trong bộ lọc, theo thứ tự ưu tiên. */
export const BRAND_FILTER_KEYS = [
  'tiktok',
  'facebook',
  'gmail',
  'telegram',
  'chatgpt',
  'midjourney',
  'capcut',
  'instagram',
  'youtube',
  'twitterx',
  'shopee',
  'netflix',
  'spotify',
  'steam',
  'discord',
  'canva',
  'google',
  'apple',
  'github',
  'whatsapp',
  'ai',
  'generic',
];

export function brandByKey(key: string): BrandTheme {
  return BRANDS[key] ?? BRANDS.generic;
}

export function brandKeyOf(product: CoverSource): string {
  return getBrandForProduct(product).key;
}