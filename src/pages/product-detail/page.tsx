import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { Product } from '@/types/db';
import { formatCurrency, formatNumber, getCategory, vendorLabel } from '@/lib/format';
import ProductCard from '@/components/product/ProductCard';
import PurchasePanel, { type PurchaseResult } from './components/PurchasePanel';
import VendorShopCard from './components/VendorShopCard';
import ProductGallery from './components/ProductGallery';
import PurchaseSuccessModal from './components/PurchaseSuccessModal';
import { getBrandForProduct, realProductImages } from '@/lib/brandTheme';

const POLICIES = [
  {
    icon: 'ri-shield-check-line',
    title: 'Bảo hành theo gói đã chọn',
    desc: 'Lỗi đăng nhập trong thời hạn bảo hành sẽ được đổi tài khoản mới cùng loại.',
  },
  {
    icon: 'ri-time-line',
    title: 'Hỗ trợ trong 24 giờ',
    desc: 'Gửi yêu cầu kèm mã đơn hàng, đội ngũ xử lý trong vòng 24 giờ làm việc.',
  },
  {
    icon: 'ri-lock-2-line',
    title: 'Bảo mật thông tin',
    desc: 'Thông tin tài khoản chỉ hiển thị cho người đã mua, không công khai trên sàn.',
  },
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        if (!id) throw new Error('missing id');
        const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (!data) {
          setProduct(null);
          return;
        }
        const item = data as Product;
        setProduct(item);

        const { data: rel } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('category', item.category)
          .neq('id', item.id)
          .limit(4);
        if (active) setRelated((rel ?? []) as Product[]);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-4">
            <div className="w-full h-72 rounded-lg bg-background-200 animate-pulse"></div>
            <div className="h-5 w-2/3 rounded bg-background-200 animate-pulse"></div>
            <div className="h-3 w-full rounded bg-background-100 animate-pulse"></div>
          </div>
          <div className="h-72 rounded-lg bg-background-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <p className="text-sm text-foreground-600">Không tải được sản phẩm. Vui lòng thử lại.</p>
        <Link
          to="/san-pham"
          className="mt-4 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold cursor-pointer"
        >
          Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full px-4 md:px-8 py-16 text-center">
        <span className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-background-200 text-foreground-500">
          <i className="ri-file-search-line text-2xl leading-none"></i>
        </span>
        <p className="mt-4 font-heading text-lg font-bold text-foreground-950">Sản phẩm không tồn tại</p>
        <p className="mt-1.5 text-sm text-foreground-600">Sản phẩm có thể đã được ẩn hoặc ngừng kinh doanh.</p>
        <Link
          to="/san-pham"
          className="mt-5 inline-flex h-10 px-4 items-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold cursor-pointer"
        >
          Xem sản phẩm khác
        </Link>
      </div>
    );
  }

  const category = getCategory(product.category);
  const galleryImages = realProductImages(product);
  const brand = getBrandForProduct(product);

  return (
    <div className="w-full px-4 md:px-8 py-8 md:py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-500 mb-5">
        <Link to="/" className="hover:text-primary-600 transition-colors cursor-pointer">
          Trang chủ
        </Link>
        <i className="ri-arrow-right-s-line text-sm leading-none"></i>
        <Link to="/san-pham" className="hover:text-primary-600 transition-colors cursor-pointer">
          Sản phẩm
        </Link>
        <i className="ri-arrow-right-s-line text-sm leading-none"></i>
        <Link
          to={`/san-pham?category=${product.category}`}
          className="hover:text-primary-600 transition-colors cursor-pointer"
        >
          {category.name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        <div>
          <ProductGallery
            images={galleryImages}
            name={product.name}
            categoryName={category.name}
            brand={brand}
          />

          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-primary-100 text-[11px] font-semibold text-primary-700">
                <i className={`${category.icon} text-xs leading-none`}></i>
                {category.name}
              </span>
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-secondary-100 text-[11px] font-medium text-secondary-800">
                <i className="ri-store-2-line text-xs leading-none"></i>
                {vendorLabel(product.vendor_code)}
              </span>
              <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-accent-100 text-[11px] font-semibold text-accent-900">
                <i className="ri-shopping-bag-3-line text-xs leading-none"></i>
                Đã bán {formatNumber(product.sold_count)}
              </span>
            </div>

            <h1 className="mt-3 font-heading text-xl md:text-2xl font-extrabold leading-snug tracking-tight text-foreground-950">
              {product.name}
            </h1>
            <p className="mt-1.5 text-xs text-foreground-500">
              Cập nhật kho liên tục · Giá hiển thị chưa gồm phụ phí gói bảo hành
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-background-200 bg-background-50 p-5">
            <h2 className="font-heading text-sm font-bold text-foreground-950">Mô tả sản phẩm</h2>
            <div className="mt-2.5 space-y-1.5">
              {product.description
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => (
                  <p key={line} className="text-[13px] leading-relaxed text-foreground-700">
                    {line}
                  </p>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-md bg-background-100 px-3 py-2">
                <p className="text-[11px] text-foreground-500">Định dạng bàn giao</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground-900 break-words">
                  {product.delivery_format || 'user | pass | 2fa | mail'}
                </p>
              </div>
              <div className="rounded-md bg-background-100 px-3 py-2">
                <p className="text-[11px] text-foreground-500">Thời gian giao</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground-900 break-words">
                  {product.delivery_time || 'Tự động 24/7'}
                </p>
              </div>
              <div className="rounded-md bg-background-100 px-3 py-2">
                <p className="text-[11px] text-foreground-500">Giá gốc</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground-900">
                  {formatCurrency(product.base_price)}
                </p>
              </div>
            </div>
          </div>

          {product.vendor_id && <VendorShopCard vendorId={product.vendor_id} />}

          <div className="mt-4 rounded-lg border border-background-200 bg-background-50 p-5">
            <h2 className="font-heading text-sm font-bold text-foreground-950">Chính sách & bảo hành</h2>
            <ul className="mt-3 space-y-3">
              {POLICIES.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-md bg-primary-100 text-primary-700">
                    <i className={`${item.icon} text-[13px] leading-none`}></i>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground-900">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground-600">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <PurchasePanel product={product} onSuccess={setResult} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="font-heading text-lg font-extrabold tracking-tight text-foreground-950">
              Sản phẩm cùng danh mục
            </h2>
            <Link
              to={`/san-pham?category=${product.category}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap cursor-pointer"
            >
              Xem tất cả
              <i className="ri-arrow-right-line text-sm leading-none"></i>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {result && (
        <PurchaseSuccessModal
          result={result}
          productName={product.name}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}