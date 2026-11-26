import { Link } from 'react-router-dom';
import LiveFeed from '@/components/feature/LiveFeed';

const HIGHLIGHTS = [
  { value: '30 giây', label: 'Thời gian giao tài khoản' },
  { value: '1 đổi 1', label: 'Chính sách bảo hành' },
  { value: '24/7', label: 'Hỗ trợ qua chat' },
];

export default function LiveSection() {
  return (
    <section className="w-full px-4 md:px-8 py-10 md:py-12 bg-background-100">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
        <div className="pt-1">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary-100 text-[11px] font-bold uppercase tracking-wider text-primary-700">
            <i className="ri-radar-line text-xs leading-none"></i>
            Cập nhật trực tiếp
          </span>
          <h2 className="mt-2.5 font-heading text-xl md:text-2xl font-extrabold tracking-tight text-foreground-950">
            Giao dịch đang diễn ra trên sàn
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-600 max-w-lg">
            Mọi đơn mua và lệnh nạp tiền đều được hiển thị công khai theo thời gian thực. Tên người mua
            được che ký tự để bảo vệ thông tin cá nhân.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-lg border border-background-200 bg-background-50 px-3 py-3">
                <p className="font-heading text-base font-extrabold text-primary-600">{item.value}</p>
                <p className="mt-1 text-[11px] leading-snug text-foreground-600">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/san-pham"
              className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-store-3-line text-base leading-none"></i>
              Vào gian hàng
            </Link>
            <Link
              to="/dang-ky"
              className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md border border-background-300 bg-background-50 text-sm font-semibold text-foreground-800 hover:border-primary-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-user-add-line text-base leading-none"></i>
              Tạo tài khoản
            </Link>
          </div>
        </div>

        <LiveFeed limit={12} />
      </div>
    </section>
  );
}