import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { Product } from '@/types/db';
import { CATEGORIES } from '@/lib/format';
import { BRAND_FILTER_KEYS, brandByKey, brandKeyOf } from '@/lib/brandTheme';
import ProductCard from '@/components/product/ProductCard';

type SortKey = 'sold' | 'price-asc' | 'price-desc' | 'new';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'sold', label: 'Bán chạy nhất' },
  { key: 'new', label: 'Mới nhất' },
  { key: 'price-asc', label: 'Giá thấp đến cao' },
  { key: 'price-desc', label: 'Giá cao đến thấp' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const keyword = searchParams.get('q') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const source = searchParams.get('source') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<SortKey>('new');
  const [input, setInput] = useState(keyword);

  useEffect(() => {
    setInput(keyword);
  }, [keyword]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts((data ?? []) as Product[]);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('products-list-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        load();
      })
      .subscribe();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const visible = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchCategory = category ? p.category === category : true;
      const matchBrand = brand ? brandKeyOf(p) === brand : true;
      const matchSource =
        source === 'vendor' ? Boolean(p.vendor_id) : source === 'system' ? !p.vendor_id : true;
      const matchKeyword = term
        ? p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
        : true;
      return matchCategory && matchBrand && matchSource && matchKeyword;
    });

    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => a.base_price - b.base_price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.base_price - a.base_price);
    if (sort === 'new') sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'sold') sorted.sort((a, b) => b.sold_count - a.sold_count);
    return sorted;
  }, [products, category, keyword, brand, source, sort]);

  const sourceCounts = useMemo(() => {
    const vendor = products.filter((product) => Boolean(product.vendor_id)).length;
    return { all: products.length, vendor, system: products.length - vendor };
  }, [products]);

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      const key = brandKeyOf(product);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return BRAND_FILTER_KEYS.filter((key) => counts.has(key)).map((key) => ({
      key,
      count: counts.get(key) ?? 0,
      theme: brandByKey(key),
    }));
  }, [products]);

  const updateParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  const activeCategory = CATEGORIES.find((c) => c.slug === category);
  const heading = activeCategory ? `Tài khoản ${activeCategory.name}` : 'Toàn bộ sản phẩm';
  const activeBrand = brandOptions.find((item) => item.key === brand);

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-10">
      <nav className="flex items-center gap-1.5 text-xs text-foreground-500 mb-5">
        <Link to="/" className="hover:text-primary-600 transition-colors cursor-pointer">
          Trang chủ
        </Link>
        <i className="ri-arrow-right-s-line text-sm leading-none"></i>
        <span className="text-foreground-800 font-medium">Sản phẩm</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-foreground-950">
            {heading}
          </h1>
          <p className="mt-1.5 text-sm text-foreground-600">
            {loading ? 'Đang tải sản phẩm...' : `${visible.length} sản phẩm đang được đăng bán`}
            {keyword ? ` cho từ khóa “${keyword}”` : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam({ q: input.trim() });
            }}
            className="relative w-full sm:w-64"
          >
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="search"
              placeholder="Tìm trong danh sách..."
              className="w-full h-10 pl-9 pr-3 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400"
            />
          </form>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sắp xếp sản phẩm"
              className="h-10 w-full sm:w-44 pl-3 pr-8 rounded-md border border-background-300 bg-background-50 text-sm text-foreground-800 focus:outline-none focus:border-primary-400 cursor-pointer appearance-none"
            >
              {SORTS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none pointer-events-none"></i>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" id="danh-muc">
        <button
          type="button"
          onClick={() => updateParam({ category: '', brand: '' })}
          className={`h-9 px-3.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            category === ''
              ? 'bg-primary-500 text-background-50'
              : 'bg-background-100 text-foreground-700 border border-background-200 hover:border-primary-300'
          }`}
        >
          Tất cả
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => updateParam({ category: cat.slug })}
            className={`h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              category === cat.slug
                ? 'bg-primary-500 text-background-50'
                : 'bg-background-100 text-foreground-700 border border-background-200 hover:border-primary-300'
            }`}
          >
            <i className={`${cat.icon} text-sm leading-none`}></i>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-500 mr-1">
          <i className="ri-store-3-line text-sm leading-none text-primary-600"></i>
          Nguồn hàng
        </p>
        {[
          { key: '', label: 'Tất cả sản phẩm', count: sourceCounts.all },
          { key: 'vendor', label: 'Gian hàng đối tác', count: sourceCounts.vendor },
          { key: 'system', label: 'Sàn YAMATO', count: sourceCounts.system },
        ].map((item) => {
          const active = source === item.key;
          return (
            <button
              key={item.key || 'all'}
              type="button"
              onClick={() => updateParam({ source: item.key })}
              className={`h-8 px-3 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'bg-secondary-500 text-background-50'
                  : 'bg-background-100 text-foreground-700 border border-background-200 hover:border-secondary-300'
              }`}
            >
              {item.label}
              <span className={`ml-1 ${active ? 'text-background-100' : 'text-foreground-500'}`}>({item.count})</span>
            </button>
          );
        })}
      </div>

      {brandOptions.length > 0 && (
        <div className="mt-4 rounded-lg border border-background-200 bg-background-50 p-3 md:p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-500">
              <i className="ri-filter-3-line text-sm leading-none text-primary-600"></i>
              Lọc theo thương hiệu
            </p>
            {brand && (
              <button
                type="button"
                onClick={() => updateParam({ brand: '' })}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:text-primary-800 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-close-line text-xs leading-none"></i>
                Bỏ lọc thương hiệu
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {brandOptions.map((item) => {
              const active = brand === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateParam({ brand: active ? '' : item.key })}
                  className={`group inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-md border transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-background-200 bg-background-50 hover:border-primary-300 hover:bg-background-100'
                  }`}
                >
                  <span
                    className="w-7 h-7 shrink-0 flex items-center justify-center rounded-[6px]"
                    style={{ backgroundImage: item.theme.gradient }}
                  >
                    <i className={`${item.theme.icon} text-white text-[14px] leading-none`}></i>
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span
                      className={`text-[12px] font-semibold ${
                        active ? 'text-primary-800' : 'text-foreground-900'
                      }`}
                    >
                      {item.theme.label}
                    </span>
                    <span className="mt-0.5 text-[9px] font-medium text-foreground-500">
                      {item.count} sản phẩm
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeBrand && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5">
          <span
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[7px]"
            style={{ backgroundImage: activeBrand.theme.gradient }}
          >
            <i className={`${activeBrand.theme.icon} text-white text-[16px] leading-none`}></i>
          </span>
          <p className="text-xs text-primary-900">
            Đang xem <span className="font-bold">{activeBrand.theme.label}</span> · {activeBrand.count} sản phẩm
            {activeCategory ? ` trong ${activeCategory.name}` : ''}
          </p>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="rounded-lg border border-background-200 overflow-hidden">
                <div className="w-full h-40 bg-background-200 animate-pulse"></div>
                <div className="p-4 space-y-2">
                  <div className="h-3 w-4/5 rounded bg-background-200 animate-pulse"></div>
                  <div className="h-3 w-2/5 rounded bg-background-100 animate-pulse"></div>
                  <div className="h-9 w-full rounded bg-background-100 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : failed ? (
          <div className="rounded-lg border border-background-200 bg-background-100 p-8 text-center">
            <p className="text-sm text-foreground-600">Không tải được danh sách sản phẩm.</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 h-9 px-4 rounded-md bg-primary-500 text-background-50 text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-background-200 bg-background-100 p-10 text-center">
            <span className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-background-200 text-foreground-500">
              <i className="ri-search-eye-line text-xl leading-none"></i>
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground-900">Chưa tìm thấy sản phẩm phù hợp</p>
            <p className="mt-1 text-xs text-foreground-600">Thử từ khóa khác hoặc chọn danh mục khác.</p>
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="mt-4 h-9 px-4 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}