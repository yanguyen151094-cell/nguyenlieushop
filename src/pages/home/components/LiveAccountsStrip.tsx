import { Link } from 'react-router-dom';
import { useSiteSetting } from '@/hooks/useSiteSetting';
import { DEFAULT_LIVE_SHOWCASE, SETTING_KEYS, type LiveShowcaseItem } from '@/lib/siteContent';

interface ShowcaseSetting extends Record<string, unknown> {
  items: LiveShowcaseItem[];
  enabled: boolean;
}

export default function LiveAccountsStrip() {
  const { value } = useSiteSetting<ShowcaseSetting>(SETTING_KEYS.liveShowcase, {
    items: DEFAULT_LIVE_SHOWCASE,
    enabled: true,
  });

  if (value.enabled === false) return null;

  const items = value.items?.length ? value.items : DEFAULT_LIVE_SHOWCASE;
  if (items.length === 0) return null;

  return (
    <section className="w-full px-4 md:px-8 pb-8 md:pb-10 bg-background-50">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3.5">
        <div>
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-accent-100 text-[11px] font-bold uppercase tracking-wider text-accent-900">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-dot-pulse"></span>
            Tài khoản live
          </span>
          <h2 className="mt-2 font-heading text-lg md:text-xl font-extrabold tracking-tight text-foreground-950">
            Kho tài khoản đang mở bán
          </h2>
        </div>
        <Link
          to="/san-pham"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap cursor-pointer"
        >
          Xem tất cả tài khoản
          <i className="ri-arrow-right-line text-base leading-none"></i>
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to || '/san-pham'}
            className="group relative shrink-0 w-[168px] sm:w-[196px] h-[224px] sm:h-[258px] rounded-lg overflow-hidden border border-background-200 bg-primary-950 cursor-pointer"
          >
            <img
              src={item.image}
              alt={item.title}
              title={`${item.title} - Yamato Shop`}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/95 via-primary-950/35 to-transparent"></div>

            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-accent-500 text-[10px] font-bold uppercase tracking-wide text-primary-950 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-950 animate-dot-pulse"></span>
              {item.tag}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-heading text-[13px] font-extrabold leading-snug text-background-50 line-clamp-1">
                {item.title}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-background-200 line-clamp-2">{item.subtitle}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-accent-400">
                Xem chi tiết
                <i className="ri-arrow-right-line text-[11px] leading-none"></i>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}