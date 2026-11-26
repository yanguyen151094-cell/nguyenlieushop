import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, formatNumber, getCategory } from '@/lib/format';
import type { Product } from '@/types/db';
import { resolveCover } from '@/lib/brandTheme';
import BrandCover from '@/components/product/BrandCover';
import ProductForm from './ProductForm';

interface Props {
  vendorId: string;
  vendorCode: string;
  shopWarrantyDays?: number;
}

export default function VendorProducts({ vendorId, vendorCode, shopWarrantyDays = 7 }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockText, setStockText] = useState('');
  const [stockBusy, setStockBusy] = useState(false);
  const [stockNote, setStockNote] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setProducts((data ?? []) as Product[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (product: Product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    load();
  };

  const removeProduct = async (product: Product) => {
    await supabase.from('product_stock').delete().eq('product_id', product.id);
    await supabase.from('products').delete().eq('id', product.id);
    setConfirmId(null);
    load();
  };

  const submitStock = async () => {
    if (!stockTarget) return;
    const lines = stockText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setStockNote('Vui lòng dán ít nhất một dòng tài khoản.');
      return;
    }
    setStockBusy(true);
    setStockNote(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('vendor_add_stock', {
        p_product_id: stockTarget.id,
        p_lines: lines.join('\n'),
      });
      if (rpcError) throw rpcError;
      setStockNote(`Đã thêm ${formatNumber(Number(data ?? lines.length))} tài khoản vào kho.`);
      setStockText('');
      await load();
    } catch (err) {
      setStockNote(err instanceof Error ? err.message : 'Không nhập được kho.');
    } finally {
      setStockBusy(false);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Sản phẩm của gian hàng</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Thêm sản phẩm, đổi giá, chỉnh gói bảo hành và nhập kho tài khoản không giới hạn.
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-800">
            <i className="ri-shield-check-line text-xs leading-none"></i>
            Bảo hành {shopWarrantyDays} ngày theo shop được tự động thêm miễn phí vào mọi sản phẩm.
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line text-base leading-none"></i>
            Thêm sản phẩm
          </button>
        )}
      </div>

      {creating && (
        <div className="mt-4">
          <ProductForm
            vendorId={vendorId}
            vendorCode={vendorCode}
            shopWarrantyDays={shopWarrantyDays}
            onSaved={() => {
              setCreating(false);
              load();
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
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
      ) : products.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-background-300 bg-background-50 px-5 py-10 text-center">
          <span className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-background-100 text-foreground-500">
            <i className="ri-inbox-line text-xl leading-none"></i>
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground-900">Gian hàng chưa có sản phẩm</p>
          <p className="mt-1 text-xs text-foreground-600">Bấm “Thêm sản phẩm” để đăng bán mặt hàng đầu tiên.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {products.map((product) => {
            const category = getCategory(product.category);
            const isEditing = editingId === product.id;
            const cover = resolveCover(product);
            return (
              <div key={product.id} className="rounded-lg border border-background-200 bg-background-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 md:p-4">
                  <div className="w-full sm:w-20 h-20 shrink-0 rounded-md overflow-hidden bg-secondary-100 flex items-center justify-center">
                    {cover.image ? (
                      <img
                        src={cover.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <BrandCover brand={cover.brand} size="xs" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground-950 line-clamp-1">{product.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground-600">
                      <span>{category.name}</span>
                      <span className="text-foreground-300">•</span>
                      <span className="font-semibold text-primary-700">{formatCurrency(product.base_price)}</span>
                      <span className="text-foreground-300">•</span>
                      <span>Tồn {formatNumber(product.stock_count)}</span>
                      <span className="text-foreground-300">•</span>
                      <span>Đã bán {formatNumber(product.sold_count)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleActive(product)}
                      className={`h-8 px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                        product.is_active
                          ? 'bg-accent-100 text-accent-900 hover:bg-accent-200'
                          : 'bg-background-200 text-foreground-600 hover:bg-background-300'
                      }`}
                    >
                      {product.is_active ? 'Đang bán' : 'Đang ẩn'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStockTarget(product);
                        setStockText('');
                        setStockNote(null);
                        setEditingId(null);
                      }}
                      className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-download-2-line text-xs leading-none"></i>
                      Nhập kho
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(isEditing ? null : product.id);
                        setStockTarget(null);
                      }}
                      className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md bg-primary-500 text-background-50 text-[11px] font-semibold hover:bg-primary-600 whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-edit-line text-xs leading-none"></i>
                      {isEditing ? 'Đóng' : 'Sửa'}
                    </button>
                    {confirmId === product.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => removeProduct(product)}
                          className="h-8 px-2.5 rounded-md bg-accent-500 text-background-50 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                        >
                          Xoá ngay
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="h-8 px-2.5 rounded-md border border-background-300 text-[11px] font-semibold text-foreground-700 whitespace-nowrap cursor-pointer"
                        >
                          Huỷ
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(product.id)}
                        aria-label="Xoá sản phẩm"
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-background-300 text-foreground-500 hover:text-accent-700 hover:border-accent-300 cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-xs leading-none"></i>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-background-200 p-3 md:p-4">
                    <ProductForm
                      vendorId={vendorId}
                      vendorCode={vendorCode}
                      shopWarrantyDays={shopWarrantyDays}
                      initial={product}
                      onSaved={() => {
                        setEditingId(null);
                        load();
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                )}

                {stockTarget?.id === product.id && (
                  <div className="border-t border-background-200 p-3 md:p-4">
                    <p className="text-xs font-semibold text-foreground-700">Nhập kho tài khoản</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-foreground-500">
                      Mỗi dòng là một tài khoản, theo định dạng{' '}
                      <span className="font-semibold text-foreground-800">
                        {stockTarget.delivery_format || 'Tài khoản | Mật khẩu'}
                      </span>
                      . Bạn có thể sửa định dạng trong mục “Sửa” của sản phẩm.
                    </p>
                    <textarea
                      value={stockText}
                      onChange={(e) => setStockText(e.target.value)}
                      rows={5}
                      placeholder={(stockTarget.delivery_format || 'Tài khoản | Mật khẩu')
                        .split('|')
                        .map((part, index) => `${part.trim() || `mục${index + 1}`}1`)
                        .join('|')}

                      className="mt-2 w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 font-mono text-xs leading-relaxed focus:outline-none focus:border-primary-400 resize-y"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={submitStock}
                        disabled={stockBusy}
                        className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                      >
                        {stockBusy ? (
                          <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
                        ) : (
                          <i className="ri-upload-2-line text-sm leading-none"></i>
                        )}
                        Nhập vào kho
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockTarget(null)}
                        className="h-9 px-3 rounded-md border border-background-300 text-xs font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
                      >
                        Đóng
                      </button>
                      {stockNote && <span className="text-[11px] text-foreground-600">{stockNote}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}