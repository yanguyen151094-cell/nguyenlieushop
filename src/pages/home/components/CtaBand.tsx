import { Link } from 'react-router-dom';

export default function CtaBand() {
  return (
    <section className="w-full px-4 md:px-8 py-10 md:py-14 bg-background-50">
      <div className="relative overflow-hidden rounded-lg bg-primary-950 px-6 py-10 md:px-10 md:py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800"></div>
        <span className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent-500/20 blur-2xl"></span>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-heading text-xl md:text-[26px] font-extrabold leading-tight tracking-tight text-background-50">
              Bạn có tài khoản số muốn bán?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-background-300">
              Đăng ký làm đối tác YAMATO SHOP để mở gian hàng ẩn danh, tự đăng sản phẩm, tự nhập kho và
              rút doanh thu về ngân hàng.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link
              to="/dang-ky"
              className="h-11 px-5 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-500 text-primary-950 text-sm font-bold hover:bg-accent-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-store-3-line text-base leading-none"></i>
              Đăng ký làm đối tác
            </Link>
            <Link
              to="/san-pham"
              className="h-11 px-5 inline-flex items-center justify-center gap-1.5 rounded-md border border-background-50/25 text-sm font-semibold text-background-100 hover:bg-background-50/10 transition-colors whitespace-nowrap cursor-pointer"
            >
              Xem sản phẩm
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}