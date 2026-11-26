import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSiteSetting } from '@/hooks/useSiteSetting';
import { DEFAULT_BANNER_SLIDES, SETTING_KEYS, type BannerSlide } from '@/lib/siteContent';

interface BannerSetting extends Record<string, unknown> {
  slides: BannerSlide[];
}

export default function PlatformBanner() {
  const { value } = useSiteSetting<BannerSetting>(SETTING_KEYS.banner, {
    slides: DEFAULT_BANNER_SLIDES,
  });
  const slides = value.slides?.length ? value.slides : DEFAULT_BANNER_SLIDES;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [keyword, setKeyword] = useState('');
  const touchStart = useRef<number | null>(null);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/san-pham?q=${encodeURIComponent(q)}` : '/san-pham');
  };

  const go = useCallback((next: number) => {
    setIndex((next + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [index, slides.length]);

  return (
    <section className="w-full px-4 md:px-8 pt-8 md:pt-10 pb-8 md:pb-10 bg-background-50">
      <div className="w-full mb-4 md:mb-5">
        <h1 className="sr-only">YAMATO SHOP - Mua tài khoản số chất lượng, giao ngay trong 30 giây</h1>
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="search"
                placeholder="Bạn cần tài khoản gì hôm nay?"
                className="w-full h-12 pl-11 pr-4 rounded-md border border-background-300/70 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary-700 text-background-50 text-sm font-bold hover:bg-primary-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Tìm sản phẩm
              <i className="ri-arrow-right-line text-base leading-none"></i>
            </button>
          </form>
        </div>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-lg border border-background-200 bg-primary-950"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStart.current;
          if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1));
          touchStart.current = null;
        }}
      >
        <div
          className="flex w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.key} className="relative w-full shrink-0 h-[300px] sm:h-[320px] md:h-[360px]">
              <img
                src={slide.image}
                alt={slide.title}
                title={`${slide.platform} - Yamato Shop`}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-950/80 to-primary-950/35"></div>

              <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-8 md:px-12 py-6 md:py-8 max-w-2xl">
                <span className="inline-flex items-center gap-2 h-7 px-2.5 rounded-full border border-background-50/25 bg-background-50/10 text-[10px] font-bold uppercase tracking-[0.14em] text-background-100 w-fit">
                  <i className={`${slide.icon} text-xs leading-none`}></i>
                  {slide.badge}
                </span>

                <h2 className="mt-3 font-heading text-xl sm:text-2xl md:text-3xl font-extrabold leading-[1.2] tracking-tight text-background-50">
                  {slide.title}
                  <span className="block text-accent-400 mt-1">{slide.highlight}</span>
                </h2>

                <p className="mt-2.5 max-w-lg text-xs sm:text-[13px] leading-relaxed text-background-200 line-clamp-2">
                  {slide.desc}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    to={slide.to}
                    className="h-10 px-5 inline-flex items-center gap-1.5 rounded-md bg-accent-500 text-primary-950 text-xs sm:text-sm font-bold hover:bg-accent-400 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {slide.cta}
                    <i className="ri-arrow-right-line text-sm leading-none"></i>
                  </Link>
                  <Link
                    to="/san-pham"
                    className="h-10 px-4 inline-flex items-center rounded-md border border-background-50/30 text-background-100 text-xs sm:text-sm font-semibold hover:bg-background-50/10 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Toàn bộ sàn
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Banner trước"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-background-50/15 border border-background-50/30 text-background-50 hover:bg-background-50/25 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-lg leading-none"></i>
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Banner sau"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-background-50/15 border border-background-50/30 text-background-50 hover:bg-background-50/25 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-s-line text-lg leading-none"></i>
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Chuyển tới banner ${slide.platform}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === index ? 'w-6 bg-accent-500' : 'w-1.5 bg-background-50/50 hover:bg-background-50/80'
              }`}
            ></button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {slides.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => go(i)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              i === index ? 'text-primary-700' : 'text-foreground-500 hover:text-primary-600'
            }`}
          >
            <i className={`${slide.icon} text-sm leading-none`}></i>
            {slide.platform}
          </button>
        ))}
      </div>
    </section>
  );
}