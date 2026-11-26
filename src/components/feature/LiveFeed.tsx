import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { TransactionRow, TransactionType } from '@/types/db';
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format';
import { LIVE_DEMO_TRANSACTIONS } from '@/mocks/liveTransactions';

const TYPE_META: Record<TransactionType, { icon: string; bubble: string }> = {
  purchase: { icon: 'ri-shopping-bag-3-line', bubble: 'bg-accent-100 text-accent-800' },
  deposit: { icon: 'ri-add-line', bubble: 'bg-primary-100 text-primary-700' },
  sale: { icon: 'ri-store-2-line', bubble: 'bg-secondary-100 text-secondary-800' },
  withdraw: { icon: 'ri-arrow-down-line', bubble: 'bg-secondary-100 text-secondary-800' },
};

const FEED_INTERVAL = 4200;

export default function LiveFeed({ limit = 12 }: { limit?: number }) {
  const [items, setItems] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [ready, setReady] = useState(false);
  const demoIndex = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      try {
        const [feedRes, countRes] = await Promise.all([
          supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit),
          supabase
            .from('transactions')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfDay.toISOString()),
        ]);
        if (feedRes.error) throw feedRes.error;
        if (active) {
          setItems((feedRes.data ?? []) as TransactionRow[]);
          setTodayCount(countRes.count ?? 0);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) {
          setLoading(false);
          setReady(true);
        }
      }
    };

    load();

    const channel = supabase
      .channel('public:transactions:feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new as TransactionRow;
          setItems((prev) => [row, ...prev.filter((it) => it.id !== row.id)].slice(0, limit));
          setTodayCount((count) => count + 1);
        },
      )
      .subscribe();

    const timer = window.setInterval(() => setTick((t) => t + 1), 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [limit]);

  useEffect(() => {
    if (!ready || loading) return undefined;

    const ticker = window.setInterval(() => {
      const demo = LIVE_DEMO_TRANSACTIONS[demoIndex.current % LIVE_DEMO_TRANSACTIONS.length];
      demoIndex.current += 1;
      const row: TransactionRow = {
        id: `live-${Date.now()}-${demoIndex.current}`,
        type: demo.type as TransactionType,
        user_id: null,
        amount: demo.amount,
        display_name: demo.display_name,
        description: demo.description,
        product_name: demo.product_name,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [row, ...prev].slice(0, limit));
      setTodayCount((count) => count + 1);
    }, FEED_INTERVAL);

    return () => window.clearInterval(ticker);
  }, [ready, loading, limit]);

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-background-200 bg-background-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-dot-pulse"></span>
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-800 whitespace-nowrap">
            Bảng tin giao dịch
          </p>
          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-background-50 border border-background-200 text-[10px] font-semibold text-foreground-600 whitespace-nowrap">
            <i className="ri-flashlight-line text-[11px] leading-none text-accent-600"></i>
            {formatNumber(todayCount)} hôm nay
          </span>
        </div>
        <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-accent-100 text-[10px] font-bold uppercase tracking-wider text-accent-900 whitespace-nowrap">
          <i className="ri-live-line text-[11px] leading-none"></i>
          Live
        </span>
      </div>

      <div className="max-h-[420px] overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-background-200 animate-pulse"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-3/4 rounded bg-background-200 animate-pulse"></div>
                  <div className="h-2 w-1/3 rounded bg-background-100 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : failed && items.length === 0 ? (
          <p className="p-5 text-xs text-foreground-500">Không tải được bảng tin giao dịch.</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-xs text-foreground-500">Chưa có giao dịch nào.</p>
        ) : (
          <ul>
            {items.map((item) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.purchase;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 px-4 py-3 border-b border-background-100 last:border-0 animate-slide-in"
                >
                  <span
                    className={`mt-0.5 w-7 h-7 shrink-0 flex items-center justify-center rounded-md ${meta.bubble}`}
                  >
                    <i className={`${meta.icon} text-[13px] leading-none`}></i>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] leading-snug text-foreground-700">
                      <span className="font-semibold text-foreground-950">{item.display_name}</span>{' '}
                      {item.description}{' '}
                      {item.product_name ? (
                        <span className="font-medium text-primary-600">{item.product_name}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-foreground-400">{timeAgo(item.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-foreground-700 whitespace-nowrap">
                    {item.type === 'deposit' ? '+' : ''}
                    {formatCurrency(item.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}