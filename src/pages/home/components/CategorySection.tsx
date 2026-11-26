import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/lib/format';

export default function CategorySection() {
  return (
    <section id="danh-muc" className="w-full px-4 md:px-8 py-10 md:py-14 bg-background-50">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-extrabold tracking-tight text-foreground-950">
            Danh mục tài khoản
          </h2>
          <p className="mt-1.5 text-sm text-foreground-600">
            Chọn đúng loại tài khoản bạn cần, tồn kho cập nhật liên tục.
          </p>
        </div>
        <Link
          to="/san-pham"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap cursor-pointer"
        >
          Xem tất cả sản phẩm
          <i className="ri-arrow-right-line text-base leading-none"></i>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/san-pham?category=${cat.slug}`}
            className="group flex flex-col rounded-lg border border-background-200 bg-background-100 p-4 hover:border-primary-300 hover:bg-background-50 transition-colors cursor-pointer"
          >
            <span className="w-10 h-10 flex items-center justify-center rounded-md bg-primary-500 text-background-50">
              <i className={`${cat.icon} text-base leading-none`}></i>
            </span>
            <span className="mt-3 font-heading text-sm font-bold text-foreground-950 group-hover:text-primary-600 transition-colors">
              {cat.name}
            </span>
            <span className="mt-1 text-[11px] leading-relaxed text-foreground-600 line-clamp-2">
              {cat.description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}