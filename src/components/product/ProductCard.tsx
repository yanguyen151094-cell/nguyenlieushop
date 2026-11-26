import { Link } from 'react-router-dom';
import type { Product } from '@/types/db';
import { formatCurrency, getCategory, vendorLabel } from '@/lib/format';
import { resolveCover } from '@/lib/brandTheme';
import BrandCover from './BrandCover';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const category = getCategory(product.category);
  const cover = resolveCover(product);
  const minExtra = (product.warranty_options ?? []).reduce(
    (min, opt) => Math.min(min, opt.extra_price ?? 0),
    0,
  );
  const fromPrice = product.base_price + minExtra;
  const maxWarrantyDays = (product.warranty_options ?? []).reduce(
    (max, opt) => Math.max(max, opt.days ?? 0),
    0,
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-background-200 bg-background-50 transition-colors hover:border-primary-300">
      <Link to={`/san-pham/${product.id}`} className="block cursor-pointer">
        <div className="relative w-full h-40 bg-secondary-100 overflow-hidden">
          {cover.image ? (
            <img
              src={cover.image}
              alt={product.name}
              title={`${product.name} - ${category.name}`}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]">
              <BrandCover brand={cover.brand} />
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 h-6 px-2 rounded-full bg-background-50/95 text-[11px] font-semibold text-foreground-800">
            <i className={`${category.icon} text-xs leading-none`}></i>
            {category.name}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/san-pham/${product.id}`} className="cursor-pointer">
          <h3 className="font-heading text-sm font-bold leading-snug text-foreground-950 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground-500">
          <span className="inline-flex items-center gap-1">
            <i className="ri-shield-check-line text-xs leading-none"></i>
            {maxWarrantyDays > 0 ? `Bảo hành ${maxWarrantyDays} ngày` : 'Không bảo hành'}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="ri-inbox-archive-line text-xs leading-none"></i>
            Còn {product.stock_count}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-foreground-500 leading-none mb-1">Giá từ</p>
            <p className="font-heading text-base font-extrabold text-primary-600 whitespace-nowrap">
              {formatCurrency(fromPrice)}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 h-6 px-2 rounded-md bg-secondary-100 text-[11px] font-medium text-secondary-800 whitespace-nowrap">
            <i className="ri-store-2-line text-xs leading-none"></i>
            {vendorLabel(product.vendor_code)}
          </span>
        </div>

        <Link
          to={`/san-pham/${product.id}`}
          className="mt-4 h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
        >
          Xem chi tiết
          <i className="ri-arrow-right-line text-sm leading-none"></i>
        </Link>
      </div>
    </article>
  );
}