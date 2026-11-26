const REASONS = [
  {
    icon: 'ri-flashlight-line',
    title: 'Giao tài khoản tự động',
    desc: 'Thanh toán xong là nhận ngay thông tin đăng nhập, không cần chờ duyệt tay.',
  },
  {
    icon: 'ri-shield-check-line',
    title: 'Bảo hành 1 đổi 1',
    desc: 'Chọn gói bảo hành 24h hoặc 7 ngày ngay khi mua, lỗi là đổi tài khoản mới.',
  },
  {
    icon: 'ri-wallet-3-line',
    title: 'Ví nội bộ minh bạch',
    desc: 'Mọi biến động nạp, mua, hoàn tiền đều có lịch sử rõ ràng theo thời gian.',
  },
  {
    icon: 'ri-user-star-line',
    title: 'Đối tác xác minh ẩn danh',
    desc: 'Gian hàng hiển thị theo mã số, thông tin thật chỉ quản trị viên nắm giữ.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Nạp tiền vào ví',
    desc: 'Chuyển khoản theo mã QR, quản trị viên duyệt và cộng ví trong vài phút.',
    icon: 'ri-bank-card-line',
  },
  {
    step: '02',
    title: 'Chọn sản phẩm & gói bảo hành',
    desc: 'So sánh giá, tồn kho và thời hạn bảo hành của từng gian hàng.',
    icon: 'ri-shopping-cart-2-line',
  },
  {
    step: '03',
    title: 'Nhận tài khoản ngay',
    desc: 'Hệ thống trừ ví và hiển thị thông tin tài khoản trong mục Đơn hàng.',
    icon: 'ri-key-2-line',
  },
];

export default function TrustSection() {
  return (
    <>
      <section className="w-full px-4 md:px-8 py-12 md:py-14 bg-background-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REASONS.map((item) => (
            <div key={item.title} className="rounded-lg border border-background-200 bg-background-50 p-5">
              <span className="w-10 h-10 flex items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <i className={`${item.icon} text-base leading-none`}></i>
              </span>
              <h3 className="mt-3.5 font-heading text-sm font-bold text-foreground-950">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="huong-dan" className="w-full px-4 md:px-8 py-12 md:py-16 bg-background-50">
        <div className="max-w-xl">
          <h2 className="font-heading text-xl md:text-2xl font-extrabold tracking-tight text-foreground-950">
            Mua tài khoản chỉ với 3 bước
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-600">
            Quy trình rút gọn, không cần liên hệ chờ đợi. Toàn bộ diễn ra ngay trên website.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((item, index) => (
            <div key={item.step} className="relative rounded-lg border border-background-200 bg-background-50 p-5">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 flex items-center justify-center rounded-md bg-accent-100 text-accent-800">
                  <i className={`${item.icon} text-base leading-none`}></i>
                </span>
                <span className="font-heading text-2xl font-extrabold text-background-300">{item.step}</span>
              </div>
              <h3 className="mt-3.5 font-heading text-sm font-bold text-foreground-950">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-600">{item.desc}</p>
              {index < STEPS.length - 1 && (
                <i className="hidden md:block ri-arrow-right-line absolute -right-3 top-1/2 -translate-y-1/2 text-foreground-300 text-base leading-none"></i>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}