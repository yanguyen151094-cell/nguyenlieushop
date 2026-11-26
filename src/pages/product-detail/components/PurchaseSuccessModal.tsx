import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/format';
import type { PurchaseResult } from './PurchasePanel';

interface Props {
  result: PurchaseResult;
  productName: string;
  onClose: () => void;
}

export default function PurchaseSuccessModal({ result, productName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.account_data);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-foreground-950/60 cursor-pointer"
      />
      <div className="relative w-full max-w-lg rounded-lg bg-background-50 border border-background-200 overflow-hidden animate-fade-up">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-background-200 bg-background-100">
          <span className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-500 text-background-50">
            <i className="ri-check-line text-lg leading-none"></i>
          </span>
          <div className="min-w-0">
            <p className="font-heading text-sm font-bold text-foreground-950">Mua thành công</p>
            <p className="mt-0.5 text-xs text-foreground-600 line-clamp-1">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 cursor-pointer"
          >
            <i className="ri-close-line text-lg leading-none"></i>
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-md bg-background-100 px-3 py-2">
              <p className="text-[11px] text-foreground-500">Tổng thanh toán</p>
              <p className="mt-0.5 text-sm font-bold text-foreground-950">{formatCurrency(result.total)}</p>
            </div>
            <div className="rounded-md bg-background-100 px-3 py-2">
              <p className="text-[11px] text-foreground-500">Bảo hành</p>
              <p className="mt-0.5 text-sm font-bold text-foreground-950">
                {result.warranty_label || 'Không bảo hành'}
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold text-foreground-700 mb-2">
            Thông tin tài khoản ({result.quantity} tài khoản)
          </p>
          <pre className="w-full max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border border-background-200 bg-background-100 px-3 py-3 text-[12.5px] leading-relaxed text-foreground-900 font-mono">
            {result.account_data}
          </pre>

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className={`${copied ? 'ri-check-line' : 'ri-file-copy-line'} text-sm leading-none`}></i>
              {copied ? 'Đã sao chép' : 'Sao chép thông tin'}
            </button>
            <Link
              to="/san-pham"
              onClick={onClose}
              className="flex-1 h-10 inline-flex items-center justify-center rounded-md border border-background-300 text-xs font-semibold text-foreground-800 hover:border-primary-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              Tiếp tục mua sắm
            </Link>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-foreground-500">
            Vui lòng đổi mật khẩu ngay sau khi nhận tài khoản. Thông tin này luôn xem lại được trong mục
            Đơn hàng.
          </p>
        </div>
      </div>
    </div>
  );
}