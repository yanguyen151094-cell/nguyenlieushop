import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background-50 px-4">
      <div className="text-center max-w-md">
        <span className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <i className="ri-compass-3-line text-2xl leading-none"></i>
        </span>
        <p className="mt-5 font-heading text-4xl font-extrabold text-primary-600">404</p>
        <h1 className="mt-2 font-heading text-lg font-bold text-foreground-950">
          Trang bạn tìm không tồn tại
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-600">
          Đường dẫn có thể đã thay đổi hoặc sản phẩm đã được gỡ khỏi sàn.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
          <Link
            to="/"
            className="h-10 px-4 inline-flex items-center justify-center rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            Về trang chủ
          </Link>
          <Link
            to="/san-pham"
            className="h-10 px-4 inline-flex items-center justify-center rounded-md border border-background-300 text-sm font-semibold text-foreground-800 hover:border-primary-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}