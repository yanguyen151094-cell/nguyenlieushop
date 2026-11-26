import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Deposit } from '@/types/db';

interface Person {
  name: string;
  email: string;
}

export default function DepositApprovalPanel({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<Deposit[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('deposits')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(60);
      if (queryError) throw queryError;
      const list = (data ?? []) as Deposit[];
      setItems(list);

      const ids = Array.from(new Set(list.map((item) => item.user_id)));
      if (ids.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ids);
        const map: Record<string, Person> = {};
        (profileRows ?? []).forEach((row) => {
          const item = row as { id: string; full_name: string | null; email: string | null };
          map[item.id] = {
            name: item.full_name?.trim() || item.email?.split('@')[0] || 'Người dùng',
            email: item.email ?? '',
          };
        });
        setPeople(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lệnh nạp tiền.');
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
          ? await supabase.rpc('approve_deposit', { p_deposit_id: id })
          : await supabase.rpc('reject_deposit', { p_deposit_id: id, p_note: 'Quản trị viên từ chối' });
      if (rpcError) throw rpcError;
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xử lý được lệnh nạp.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center rounded-md bg-primary-100 text-primary-700">
            <i className="ri-wallet-3-line text-sm leading-none"></i>
          </span>
          <div>
            <p className="text-sm font-bold text-foreground-950">Lệnh nạp tiền chờ duyệt</p>
            <p className="text-[11px] text-foreground-500">
              {loading ? 'Đang tải...' : `${items.length} lệnh · Duyệt xong tiền vào ví người dùng`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-refresh-line text-xs leading-none"></i>
          Tải lại
        </button>
      </div>

      <div className="border-t border-background-200 px-4 py-3">
        {error && <p className="mb-2 text-[11px] text-primary-700">{error}</p>}
        {loading ? (
          <div className="h-14 rounded-md bg-background-100 animate-pulse"></div>
        ) : items.length === 0 ? (
          <p className="text-[11px] text-foreground-500">Không có lệnh nạp nào đang chờ duyệt.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-background-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground-950">
                    {people[item.user_id]?.name ?? 'Người dùng'} · {formatCurrency(item.amount)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-foreground-600 truncate">
                    Mã nạp <span className="font-mono font-semibold">{item.transfer_code}</span>
                    {people[item.user_id]?.email ? ` · ${people[item.user_id].email}` : ''}
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
                    Duyệt & cộng ví
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
    </section>
  );
}