import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { saveSiteSetting, useSiteSetting } from '@/hooks/useSiteSetting';
import { DEFAULT_DISPLAY_FEE, SETTING_KEYS } from '@/lib/siteContent';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { VendorNotification } from '@/types/db';

interface FeeSetting extends Record<string, unknown> {
  amount: number;
  enabled: boolean;
}

interface VendorRow {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function AdminFeePanel() {
  const fee = useSiteSetting<FeeSetting>(SETTING_KEYS.fee, DEFAULT_DISPLAY_FEE);
  const [amount, setAmount] = useState(String(DEFAULT_DISPLAY_FEE.amount));
  const [enabled, setEnabled] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [notices, setNotices] = useState<VendorNotification[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setAmount(String(fee.value.amount ?? DEFAULT_DISPLAY_FEE.amount));
    setEnabled(fee.value.enabled ?? true);
  }, [fee.value.amount, fee.value.enabled]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, noticeRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, store_name, email, balance, is_active')
          .eq('role', 'vendor')
          .order('created_at', { ascending: true }),
        supabase
          .from('vendor_notifications')
          .select('*')
          .eq('type', 'fee')
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      const vendorList = (vendorRes.data ?? []).map((row) => {
        const item = row as {
          id: string;
          full_name: string | null;
          store_name: string | null;
          email: string | null;
          balance: number;
          is_active: boolean;
        };
        return {
          id: item.id,
          name: item.store_name?.trim() || item.full_name?.trim() || item.email?.split('@')[0] || 'Đối tác',
          balance: Number(item.balance ?? 0),
          is_active: item.is_active,
        };
      });
      setVendors(vendorList);

      const map: Record<string, string> = {};
      vendorList.forEach((item) => {
        map[item.id] = item.name;
      });
      setNames(map);
      setNotices((noticeRes.data ?? []) as VendorNotification[]);
    } catch {
      setNote({ ok: false, text: 'Không tải được dữ liệu phí và đối tác.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveConfig = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setNote({ ok: false, text: 'Mức phí phải lớn hơn 0.' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await saveSiteSetting(SETTING_KEYS.fee, { amount: value, enabled });
      await fee.refresh();
      setNote({ ok: true, text: 'Đã lưu cấu hình phí trưng bày.' });
    } catch {
      setNote({ ok: false, text: 'Không lưu được cấu hình phí.' });
    } finally {
      setBusy(false);
    }
  };

  const charge = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setNote({ ok: false, text: 'Vui lòng nhập mức phí hợp lệ.' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const { data, error } = await supabase.rpc('charge_display_fee', {
        p_amount: value,
        p_month: month,
        p_title: title.trim(),
        p_content: content.trim(),
      });
      if (error) throw error;
      const result = data as { count?: number; skipped?: number; total?: number } | null;
      setNote({
        ok: true,
        text: `Đã trừ phí ${formatCurrency(value)} cho ${result?.count ?? 0} đối tác (bỏ qua ${
          result?.skipped ?? 0
        } đã thu). Tổng thực trừ ${formatCurrency(result?.total ?? 0)}.`,
      });
      await load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      setNote({
        ok: false,
        text: raw.includes('INVALID_AMOUNT')
          ? 'Mức phí không hợp lệ.'
          : 'Không thu được phí. Vui lòng kiểm tra lại quyền quản trị.',
      });
    } finally {
      setBusy(false);
    }
  };

  const sendNotice = async () => {
    if (!title.trim() || !content.trim()) {
      setNote({ ok: false, text: 'Cần nhập tiêu đề và nội dung thông báo.' });
      return;
    }
    const targets = vendors.filter((item) => item.is_active);
    if (targets.length === 0) {
      setNote({ ok: false, text: 'Chưa có đối tác đang hoạt động để gửi thông báo.' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const { error } = await supabase.from('vendor_notifications').insert(
        targets.map((item) => ({
          vendor_id: item.id,
          type: 'notice',
          title: title.trim(),
          content: content.trim(),
          amount: 0,
          period: month,
        })),
      );
      if (error) throw error;
      setNote({ ok: true, text: `Đã gửi thông báo tới ${targets.length} đối tác.` });
      setTitle('');
      setContent('');
      await load();
    } catch {
      setNote({ ok: false, text: 'Không gửi được thông báo.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-extrabold text-foreground-950">
              Phí trưng bày gian hàng hàng tháng
            </h2>
            <p className="mt-1 text-xs text-foreground-600">
              Thu phí từ số dư ví của từng đối tác và gửi thông báo tới đúng đối tác đó. Mỗi tháng chỉ thu một lần.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-800 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-[oklch(var(--primary-500))]"
            />
            Bật phí trưng bày
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label htmlFor="fee-amount" className="text-[11px] font-semibold text-foreground-700">
              Mức phí mỗi tháng (đ)
            </label>
            <input
              id="fee-amount"
              type="number"
              min={0}
              step={10000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
          </div>
          <div>
            <label htmlFor="fee-month" className="text-[11px] font-semibold text-foreground-700">
              Kỳ thu phí
            </label>
            <input
              id="fee-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={saveConfig}
              disabled={busy}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 hover:bg-background-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-save-3-line text-sm leading-none"></i>
              Lưu mức phí
            </button>
            <button
              type="button"
              onClick={charge}
              disabled={busy || !enabled}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {busy ? (
                <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
              ) : (
                <i className="ri-subtract-line text-sm leading-none"></i>
              )}
              Thu phí tháng này
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề thông báo (để trống = tiêu đề mặc định)"
            className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
          />
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung thông báo (để trống = nội dung mặc định)"
            className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={sendNotice}
            disabled={busy}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-secondary-500 text-background-50 text-xs font-semibold hover:bg-secondary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-notification-3-line text-sm leading-none"></i>
            Gửi thông báo cho tất cả đối tác
          </button>
          <p className="text-[10px] text-foreground-500">
            Thông báo xuất hiện trong mục “Thông báo” của kênh đối tác.
          </p>
        </div>

        {note && (
          <p
            className={`mt-3 rounded-md border px-3 py-2 text-[11px] ${
              note.ok
                ? 'border-accent-200 bg-accent-50 text-accent-900'
                : 'border-primary-200 bg-primary-50 text-primary-800'
            }`}
          >
            {note.text}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-sm font-bold text-foreground-950">Số dư đối tác</h3>
          <button
            type="button"
            onClick={load}
            aria-label="Tải lại danh sách đối tác"
            className="w-7 h-7 flex items-center justify-center rounded-md border border-background-300 text-foreground-500 hover:text-primary-600 cursor-pointer"
          >
            <i className="ri-refresh-line text-xs leading-none"></i>
          </button>
        </div>

        {loading ? (
          <div className="mt-2 h-16 rounded-md bg-background-100 animate-pulse"></div>
        ) : vendors.length === 0 ? (
          <p className="mt-2 text-[11px] text-foreground-500">Chưa có đối tác nào.</p>
        ) : (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between gap-2 rounded-md border border-background-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground-950 truncate">{vendor.name}</p>
                  <p className="text-[10px] text-foreground-500">
                    {vendor.is_active ? 'Đang hoạt động' : 'Tạm khoá'}
                  </p>
                </div>
                <span className="text-xs font-bold text-foreground-800 whitespace-nowrap">
                  {formatCurrency(vendor.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <h3 className="font-heading text-sm font-bold text-foreground-950">Lịch sử thu phí gần đây</h3>
        {loading ? (
          <div className="mt-2 h-16 rounded-md bg-background-100 animate-pulse"></div>
        ) : notices.length === 0 ? (
          <p className="mt-2 text-[11px] text-foreground-500">Chưa thu phí tháng nào.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {notices.map((item) => (
              <div key={item.id} className="rounded-md border border-background-200 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground-950">
                    {names[item.vendor_id] ?? 'Đối tác'} · {formatCurrency(item.amount)}
                  </p>
                  <span className="text-[10px] text-foreground-500">{item.period ?? ''}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-foreground-600">{item.title}</p>
                <p className="text-[10px] text-foreground-400">{formatDateTime(item.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}