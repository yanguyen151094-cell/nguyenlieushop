import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { Product } from '@/types/db';
import ProductCard from '@/components/product/ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sold_count', { ascending: false })
        .limit(8);
      if (error) throw error;
      setProducts((data ?? []) as Product[]);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section id="san-pham-noi-bat" className="w-full px-4 md:px-8 pb-12 md:pb-16 bg-background-50">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-accent-100 text-[11px] font-bold uppercase tracking-wider text-accent-900">
            <i className="ri-fire-line text-xs leading-none"></i>
            Bán chạy nhất
          </span>
          <h2 className="mt-2.5 font-heading text-xl md:text-2xl font-extrabold tracking-tight text-foreground-950">
            Sản phẩm được mua nhiều
          </h2>
        </div>
        <Link
          to="/san-pham"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap cursor-pointer"
        >
          Toàn bộ sản phẩm
          <i className="ri-arrow-right-line text-base leading-none"></i>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
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
        <div className="rounded-lg border border-background-200 bg-background-100 p-6 text-center">
          <p className="text-sm text-foreground-600">Không tải được danh sách sản phẩm.</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 h-9 px-4 rounded-md bg-primary-500 text-background-50 text-xs font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-background-200 bg-background-100 p-8 text-center">
          <p className="text-sm text-foreground-600">Sàn chưa có sản phẩm nào đang bán.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}