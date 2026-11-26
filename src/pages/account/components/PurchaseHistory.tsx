import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatDateTime, formatNumber, vendorLabel } from '@/lib/format';
import type { Order } from '@/types/db';

interface Props {
  buyerId: string;
}

const STATUS: Record<Order['status'], { label: string; className: string }> = {
  completed: { label: 'Hoàn tất', className: 'bg-accent-100 text-accent-900' },
  pending: { label: 'Đang xử lý', className: 'bg-secondary-100 text-secondary-900' },
  cancelled: { label: 'Đã huỷ', className: 'bg-background-200 text-foreground-600' },
};

export default function PurchaseHistory({ buyerId }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | Order['status']>('all');
  const [detail, setDetail] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (queryError) throw queryError;
      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lịch sử mua hàng.');
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) return false;
      if (!q) return true;
      return (
        order.product_name.toLowerCase().includes(q) ||
        order.vendor_code.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        order.warranty_label.toLowerCase().includes(q)
      );
    });
  }, [orders, keyword, status]);

  const totalSpent = useMemo(
    () => orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total_amount), 0),
    [orders],
  );

  const copyAccount = async (order: Order) => {
    try {
      await navigator.clipboard.writeText(order.account_data);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Lịch sử mua hàng</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Tìm lại tài khoản đã mua theo tên sản phẩm, mã gian hàng hoặc mã đơn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-md bg-secondary-100 border border-secondary-200 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-secondary-800">Số đơn</p>
            <p className="text-sm font-bold text-secondary-900">{formatNumber(orders.length)}</p>
          </div>
          <div className="rounded-md bg-accent-100 border border-accent-200 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-accent-800">Tổng chi</p>
            <p className="text-sm font-bold text-accent-900 whitespace-nowrap">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-base leading-none"></i>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="search"
            placeholder="Tìm theo tên sản phẩm, mã đơn, mã gian hàng..."
            className="w-full h-10 pl-9 pr-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | Order['status'])}
          className="h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400 cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="completed">Hoàn tất</option>
          <option value="pending">Đang xử lý</option>
          <option value="cancelled">Đã huỷ</option>
        </select>
      </div>

      {error && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
          <p className="text-xs text-accent-900">{error}</p>
          <button
            type="button"
            onClick={load}
            className="h-8 px-3 rounded-md bg-background-50 text-xs font-semibold text-accent-900 whitespace-nowrap cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-background-100 animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-background-300 px-5 py-10 text-center">
          <span className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-background-100 text-foreground-500">
            <i className="ri-shopping-bag-3-line text-xl leading-none"></i>
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground-900">
            {orders.length === 0 ? 'Bạn chưa có đơn hàng nào' : 'Không tìm thấy đơn phù hợp'}
          </p>
          <p className="mt-1 text-xs text-foreground-600">
            {orders.length === 0 ? 'Sản phẩm đã mua sẽ được lưu tại đây để tra cứu lại.' : 'Thử từ khoá khác hoặc bỏ bộ lọc trạng thái.'}
          </p>
          {orders.length === 0 && (
            <Link
              to="/san-pham"
              className="mt-4 inline-flex h-9 px-4 items-center rounded-md bg-primary-500 text-background-50 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Xem sản phẩm
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((order) => {
            const meta = STATUS[order.status] ?? STATUS.completed;
            return (
              <div key={order.id} className="rounded-lg border border-background-200 bg-background-50 p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground-950 line-clamp-1">{order.product_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground-600">
                      <span>{vendorLabel(order.vendor_code)}</span>
                      <span className="text-foreground-300">•</span>
                      <span>Số lượng {order.quantity}</span>
                      <span className="text-foreground-300">•</span>
                      <span className="font-semibold text-primary-700">{formatCurrency(order.total_amount)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-foreground-400">
                      <span>Mã đơn {order.id.slice(0, 8).toUpperCase()}</span>
                      <span>·</span>
                      <span>{formatDateTime(order.created_at)}</span>
                      {order.warranty_label && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <i className="ri-shield-check-line text-[11px] leading-none"></i>
                            {order.warranty_label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className={`h-6 px-2.5 inline-flex items-center rounded-full text-[10px] font-semibold whitespace-nowrap ${meta.className}`}>
                      {meta.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDetail(order);
                        setCopied(false);
                      }}
                      className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md bg-primary-500 text-background-50 text-[11px] font-semibold hover:bg-primary-600 whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-key-2-line text-xs leading-none"></i>
                      Xem tài khoản
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setDetail(null)}
            className="absolute inset-0 bg-foreground-950/50 cursor-default"
          ></button>
          <div className="relative w-full max-w-lg rounded-lg bg-background-50 border border-background-200 overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-background-200">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground-950 line-clamp-1">{detail.product_name}</p>
                <p className="mt-0.5 text-[11px] text-foreground-500">
                  Mã đơn {detail.id.slice(0, 8).toUpperCase()} · {formatDateTime(detail.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Đóng"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg leading-none"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground-800">Thông tin tài khoản</p>
                <button
                  type="button"
                  onClick={() => copyAccount(detail)}
                  className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
                >
                  <i className={`${copied ? 'ri-check-line' : 'ri-file-copy-line'} text-xs leading-none`}></i>
                  {copied ? 'Đã sao chép' : 'Sao chép tất cả'}
                </button>
              </div>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-background-100 border border-background-200 p-3 text-[12px] leading-relaxed text-foreground-800 whitespace-pre-wrap break-all font-mono">
                {detail.account_data || 'Chưa có dữ liệu bàn giao.'}
              </pre>
              {detail.warranty_label && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-800">
                  <i className="ri-shield-check-line text-xs leading-none"></i>
                  {detail.warranty_label}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}