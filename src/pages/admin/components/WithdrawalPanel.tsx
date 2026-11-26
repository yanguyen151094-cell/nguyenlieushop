import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Withdrawal } from '@/types/db';

interface Person {
  id: string;
  name: string;
  email: string;
}

export default function WithdrawalPanel() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);
      if (queryError) throw queryError;
      const list = (data ?? []) as Withdrawal[];
      setItems(list);

      const ids = Array.from(new Set(list.map((item) => item.vendor_id)));
      if (ids.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, email, store_name')
          .in('id', ids);
        const map: Record<string, Person> = {};
        (profileRows ?? []).forEach((row) => {
          const item = row as { id: string; full_name: string | null; email: string | null; store_name: string | null };
          map[item.id] = {
            id: item.id,
            name: item.store_name?.trim() || item.full_name?.trim() || item.email?.split('@')[0] || 'Đối tác',
            email: item.email ?? '',
          };
        });
        setPeople(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lệnh rút tiền.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    setError(null);
    try {
      const { error: rpcError } =
        action === 'approve'
          ? await supabase.rpc('approve_withdrawal', { p_withdrawal_id: id })
          : await supabase.rpc('reject_withdrawal', { p_withdrawal_id: id, p_note: 'Quản trị viên từ chối' });
      if (rpcError) throw rpcError;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xử lý được lệnh rút.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center rounded-md bg-accent-100 text-accent-800">
            <i className="ri-bank-card-line text-sm leading-none"></i>
          </span>
          <div>
            <p className="text-sm font-bold text-foreground-950">Lệnh rút tiền chờ duyệt</p>
            <p className="text-[11px] text-foreground-500">
              {loading ? 'Đang tải...' : `${items.length} lệnh cần xử lý`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-refresh-line text-xs leading-none"></i>
            Tải lại
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md bg-primary-500 text-background-50 text-[11px] font-semibold hover:bg-primary-600 whitespace-nowrap cursor-pointer"
          >
            <i className={`${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm leading-none`}></i>
            {open ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-background-200 px-4 py-3">
          {error && <p className="mb-2 text-[11px] text-accent-800">{error}</p>}
          {loading ? (
            <div className="h-14 rounded-md bg-background-100 animate-pulse"></div>
          ) : items.length === 0 ? (
            <p className="text-[11px] text-foreground-500">Không có lệnh rút nào đang chờ.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-background-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground-950">
                      {people[item.vendor_id]?.name ?? 'Đối tác'} · {formatCurrency(item.amount)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-foreground-600 truncate">
                      {item.bank_name} · {item.bank_number} · {item.bank_holder}
                    </p>
                    <p className="text-[10px] text-foreground-400">{formatDateTime(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => decide(item.id, 'approve')}
                      disabled={busyId === item.id}
                      className="h-8 px-2.5 rounded-md bg-accent-500 text-background-50 text-[11px] font-semibold hover:bg-accent-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(item.id, 'reject')}
                      disabled={busyId === item.id}
                      className="h-8 px-2.5 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-700 hover:bg-background-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}