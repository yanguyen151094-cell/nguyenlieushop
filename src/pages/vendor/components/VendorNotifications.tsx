import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { VendorNotification } from '@/types/db';

const TYPE_META: Record<string, { icon: string; tone: string }> = {
  fee: { icon: 'ri-subtract-line', tone: 'bg-primary-100 text-primary-700' },
  notice: { icon: 'ri-megaphone-line', tone: 'bg-accent-100 text-accent-800' },
  system: { icon: 'ri-information-line', tone: 'bg-secondary-100 text-secondary-800' },
};

export default function VendorNotifications({ vendorId }: { vendorId: string }) {
  const [items, setItems] = useState<VendorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('vendor_notifications')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(60);
      if (queryError) throw queryError;
      setItems((data ?? []) as VendorNotification[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông báo.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((item) => !item.is_read).length;

  const markAll = async () => {
    if (unread === 0) return;
    setBusy(true);
    try {
      const { error: updateError } = await supabase
        .from('vendor_notifications')
        .update({ is_read: true })
        .eq('vendor_id', vendorId)
        .eq('is_read', false);
      if (updateError) throw updateError;
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch {
      setError('Không đánh dấu được đã đọc.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Thông báo từ quản trị viên</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Phí trưng bày hàng tháng và các thông báo quan trọng về gian hàng của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-accent-100 text-[11px] font-semibold text-accent-900 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
            {unread} chưa đọc
          </span>
          <button
            type="button"
            onClick={markAll}
            disabled={busy || unread === 0}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-800 hover:bg-background-100 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-check-double-line text-xs leading-none"></i>
            Đánh dấu đã đọc
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-primary-200 bg-primary-50 px-3 py-2">
          <p className="text-[11px] text-primary-800">{error}</p>
          <button
            type="button"
            onClick={load}
            className="h-7 px-2.5 rounded-md bg-background-50 text-[11px] font-semibold text-primary-800 whitespace-nowrap cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-3 h-20 rounded-md bg-background-100 animate-pulse"></div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-[11px] text-foreground-500">Chưa có thông báo nào.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.system;
            return (
              <article
                key={item.id}
                className={`rounded-md border px-3 py-2.5 ${
                  item.is_read ? 'border-background-200 bg-background-50' : 'border-accent-200 bg-accent-50/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 w-8 h-8 shrink-0 flex items-center justify-center rounded-md ${meta.tone}`}>
                    <i className={`${meta.icon} text-sm leading-none`}></i>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-foreground-950">{item.title}</p>
                      {item.amount > 0 && (
                        <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-primary-100 text-[9px] font-bold text-primary-800 whitespace-nowrap">
                          -{formatCurrency(item.amount)}
                        </span>
                      )}
                      {!item.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-foreground-600">{item.content}</p>
                    <p className="mt-1 text-[10px] text-foreground-400">
                      {formatDateTime(item.created_at)}
                      {item.period ? ` · Kỳ ${item.period}` : ''}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}