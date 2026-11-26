import type { BrandTheme } from '@/lib/brandTheme';

interface Props {
  brand: BrandTheme;
  size?: 'xs' | 'sm' | 'lg';
}

const SIZES = {
  xs: {
    tile: 'w-9 h-9 rounded-lg',
    icon: 'text-[18px]',
    label: 'mt-1 text-[10px] tracking-[0.1em]',
    tagline: 'hidden',
    badge: 'hidden',
    gap: 'px-1.5',
  },
  sm: {
    tile: 'w-11 h-11 rounded-xl',
    icon: 'text-[22px]',
    label: 'mt-2 text-[12px] tracking-[0.14em]',
    tagline: 'mt-1 text-[8px] tracking-[0.24em]',
    badge: 'inline-flex',
    gap: 'px-3',
  },
  lg: {
    tile: 'w-16 h-16 rounded-2xl',
    icon: 'text-[34px]',
    label: 'mt-3 text-base tracking-[0.16em]',
    tagline: 'mt-1.5 text-[10px] tracking-[0.32em]',
    badge: 'inline-flex',
    gap: 'px-4',
  },
} as const;

export default function BrandCover({ brand, size = 'sm' }: Props) {
  const s = SIZES[size];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundImage: brand.gradient, backgroundColor: '#101012' }}
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />
      <div
        className="absolute -left-10 -bottom-12 w-40 h-40 rounded-full blur-2xl"
        style={{ backgroundColor: brand.glow, opacity: 0.42 }}
      />
      <div
        className="absolute -right-8 -top-10 w-32 h-32 rounded-full blur-2xl"
        style={{ backgroundColor: brand.glow, opacity: 0.24 }}
      />

      <div className={`relative h-full w-full flex flex-col items-center justify-center text-center ${s.gap}`}>
        <span
          className={`flex items-center justify-center bg-white/10 ring-1 ring-white/30 backdrop-blur-[2px] ${s.tile}`}
        >
          <i className={`${brand.icon} text-white leading-none ${s.icon}`}></i>
        </span>
        <span className={`font-heading font-extrabold uppercase text-white leading-none ${s.label}`}>
          {brand.label}
        </span>
        <span className={`uppercase text-white/60 font-medium leading-none ${s.tagline}`}>
          Yamato Shop
        </span>
      </div>

      <span
        className={`absolute right-2 top-2 items-center gap-1 h-4 px-1.5 rounded bg-white/15 text-[8px] font-bold uppercase tracking-[0.1em] text-white/90 ${s.badge}`}
      >
        <i className="ri-verified-badge-line text-[9px] leading-none"></i>
        Chính hãng
      </span>
    </div>
  );
}