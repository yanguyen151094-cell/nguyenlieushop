import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PASSWORD = 'Yamato@123';

const ACCOUNTS = [
  {
    role: 'Đối tác bán hàng',
    email: 'doitac@yamatoshop.vn',
    name: 'Đối tác Test Yamato',
    note: 'Vào /kenh-doi-tac để đăng sản phẩm, nhập kho, đổi giá và hình ảnh gian hàng.',
    icon: 'ri-store-3-line',
  },
  {
    role: 'Người mua',
    email: 'khachhang@yamatoshop.vn',
    name: 'Khách Test Yamato',
    note: 'Ví đã có sẵn 2.000.000đ để thử mua hàng và xem thông tin tài khoản nhận được.',
    icon: 'ri-user-smile-line',
  },
];

export default function TestAccountsPanel() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const seed = async () => {
    setBusy(true);
    setNote(null);
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-accounts', { body: {} });
      if (error) throw error;
      const payload = data as { error?: string } | null;
      if (payload?.error) throw new Error(payload.error);
      setNote('Đã tạo / đặt lại mật khẩu tài khoản test thành công.');
    } catch {
      setNote('Không khởi tạo được tài khoản test. Vui lòng thử lại sau ít phút.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Tài khoản test</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Dùng hai tài khoản dưới đây để thử nghiệm toàn bộ luồng mua bán: đối tác đăng hàng và người mua thanh toán bằng ví.
          </p>
        </div>
        <button
          type="button"
          onClick={seed}
          disabled={busy}
          className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {busy ? (
            <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
          ) : (
            <i className="ri-refresh-line text-sm leading-none"></i>
          )}
          Tạo / đặt lại tài khoản test
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ACCOUNTS.map((account) => (
          <div key={account.email} className="rounded-md border border-background-200 bg-background-100 p-3.5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 flex items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <i className={`${account.icon} text-sm leading-none`}></i>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground-950">{account.role}</p>
                <p className="text-[11px] text-foreground-500 truncate">{account.name}</p>
              </div>
            </div>

            <dl className="mt-3 space-y-1.5">
              {[
                { label: 'Email', value: account.email },
                { label: 'Mật khẩu', value: PASSWORD },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-2">
                  <dt className="text-[11px] text-foreground-500 whitespace-nowrap">{field.label}</dt>
                  <dd className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-semibold text-foreground-900 font-mono truncate">
                      {field.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(field.value)}
                      aria-label={`Sao chép ${field.label}`}
                      className="w-6 h-6 shrink-0 flex items-center justify-center rounded border border-background-300 text-foreground-500 hover:text-primary-600 cursor-pointer"
                    >
                      <i
                        className={`${
                          copied === field.value ? 'ri-check-line text-primary-600' : 'ri-file-copy-line'
                        } text-[11px] leading-none`}
                      ></i>
                    </button>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-2.5 text-[11px] leading-relaxed text-foreground-500">{account.note}</p>
          </div>
        ))}
      </div>

      {note && (
        <p className="mt-3 rounded-md bg-accent-50 border border-accent-200 px-3 py-2 text-[11px] text-accent-900">
          {note}
        </p>
      )}
    </section>
  );
}