import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/types/db';

export interface PurchaseResult {
  order_id: string;
  account_data: string;
  total: number;
  quantity: number;
  warranty_label: string;
  warranty_days: number;
}

interface Props {
  product: Product;
  onSuccess: (result: PurchaseResult) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'Bạn cần đăng nhập để mua hàng.',
  INSUFFICIENT_BALANCE: 'Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví.',
  OUT_OF_STOCK: 'Sản phẩm đã hết hàng trong kho.',
  NOT_ENOUGH_STOCK: 'Kho không đủ số lượng bạn chọn.',
  PRODUCT_NOT_FOUND: 'Sản phẩm không còn tồn tại.',
  INVALID_QUANTITY: 'Số lượng không hợp lệ.',
  QUANTITY_TOO_LARGE: 'Số lượng tối đa mỗi đơn là 10.',
  PROFILE_NOT_FOUND: 'Không tìm thấy hồ sơ người dùng.',
};

export default function PurchasePanel({ product, onSuccess }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const options = useMemo(
    () => [...(product.warranty_options ?? [])].sort((a, b) => a.extra_price - b.extra_price),
    [product.warranty_options],
  );

  const [selected, setSelected] = useState(options.length > 1 ? options[1].label : options[0]?.label ?? '');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = options.find((o) => o.label === selected) ?? options[0];
  const extra = current?.extra_price ?? 0;
  const unitPrice = product.base_price + extra;
  const total = unitPrice * quantity;
  const maxQty = Math.max(1, Math.min(product.stock_count, 10));
  const inStock = product.stock_count > 0;

  const handleBuy = async () => {
    setError(null);
    if (!session) {
      navigate('/dang-nhap');
      return;
    }
    if (!inStock) {
      setError('Sản phẩm đã hết hàng.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('purchase_product', {
        p_product_id: product.id,
        p_warranty_label: selected ?? '',
        p_quantity: quantity,
      });
      if (rpcError) {
        const code = Object.keys(ERROR_MESSAGES).find((key) => rpcError.message.includes(key));
        setError(code ? ERROR_MESSAGES[code] : 'Giao dịch thất bại, vui lòng thử lại.');
        return;
      }
      onSuccess(data as unknown as PurchaseResult);
      await refreshProfile();
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-5">
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-background-200">
        <div>
          <p className="text-[11px] text-foreground-500">Giá niêm yết</p>
          <p className="font-heading text-2xl font-extrabold text-primary-600 whitespace-nowrap">
            {formatCurrency(product.base_price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-foreground-500">Tồn kho</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-900">
            <span
              className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-accent-500' : 'bg-foreground-400'}`}
            ></span>
            {inStock ? `Còn ${product.stock_count}` : 'Hết hàng'}
          </p>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-xs font-semibold text-foreground-700 mb-2">Chọn gói bảo hành</p>
        <div className="space-y-2">
          {options.map((opt) => {
            const active = opt.label === selected;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setSelected(opt.label)}
                className={`w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-background-300 bg-background-50 hover:border-primary-300'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
                      active ? 'border-primary-500' : 'border-background-400'
                    }`}
                  >
                    {active && <span className="w-2 h-2 rounded-full bg-primary-500"></span>}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-foreground-950">{opt.label}</span>
                    <span className="block text-[11px] text-foreground-500">
                      {opt.days > 0 ? `Hỗ trợ đổi trong ${opt.days} ngày` : 'Không hỗ trợ đổi trả'}
                    </span>
                  </span>
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold whitespace-nowrap ${
                    opt.extra_price === 0
                      ? 'text-foreground-500'
                      : 'text-primary-600'
                  }`}
                >
                  {opt.extra_price === 0
                    ? 'Miễn phí'
                    : `${opt.extra_price > 0 ? '+' : '-'}${formatCurrency(Math.abs(opt.extra_price))}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-foreground-700">Số lượng</span>
        <div className="flex items-center gap-1 rounded-md border border-background-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-8 flex items-center justify-center text-foreground-700 hover:bg-background-100 cursor-pointer"
            aria-label="Giảm số lượng"
          >
            <i className="ri-subtract-line text-sm leading-none"></i>
          </button>
          <span className="w-8 text-center text-sm font-semibold text-foreground-950">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            className="w-8 h-8 flex items-center justify-center text-foreground-700 hover:bg-background-100 cursor-pointer"
            aria-label="Tăng số lượng"
          >
            <i className="ri-add-line text-sm leading-none"></i>
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-background-100 px-3 py-2.5">
        <div className="flex items-center justify-between text-xs text-foreground-600">
          <span>Đơn giá</span>
          <span className="font-medium text-foreground-900">{formatCurrency(unitPrice)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-foreground-600">Tổng thanh toán</span>
          <span className="font-heading text-base font-extrabold text-primary-600 whitespace-nowrap">
            {formatCurrency(total)}
          </span>
        </div>
        {profile && (
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-foreground-500">
            <span>Số dư khả dụng</span>
            <span className={profile.balance < total ? 'text-accent-700 font-semibold' : 'font-medium'}>
              {formatCurrency(profile.balance)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
          <i className="ri-error-warning-line mt-0.5 text-sm leading-none text-accent-800"></i>
          <p className="text-xs leading-relaxed text-accent-900">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleBuy}
        disabled={submitting || !inStock}
        className="mt-4 w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 text-background-50 text-sm font-bold hover:bg-primary-600 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
      >
        {submitting ? (
          <>
            <i className="ri-loader-4-line animate-spin text-base leading-none"></i>
            Đang xử lý giao dịch...
          </>
        ) : (
          <>
            <i className="ri-shopping-bag-3-line text-base leading-none"></i>
            {session ? 'Mua ngay bằng ví' : 'Đăng nhập để mua'}
          </>
        )}
      </button>

      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-foreground-500">
        Hệ thống giao tài khoản tự động ngay sau khi trừ ví. Thông tin được lưu trong mục Đơn hàng.
      </p>
    </div>
  );
}