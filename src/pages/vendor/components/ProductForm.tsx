import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORIES, formatCurrency } from '@/lib/format';
import { uploadPublicImage } from '@/lib/imageUpload';
import { detectBrand, realProductImages } from '@/lib/brandTheme';
import BrandCover from '@/components/product/BrandCover';
import type { Product, WarrantyOption } from '@/types/db';
import WarrantyOptionsEditor from './WarrantyOptionsEditor';

interface Props {
  vendorId: string;
  vendorCode: string;
  shopWarrantyDays?: number;
  initial?: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

const FORMAT_PRESETS = [
  'user | pass | 2fa | mail',
  'Tài khoản | Mật khẩu',
  'Email | Mật khẩu | Mã 2FA',
  'Số điện thoại | Mật khẩu',
];

function buildDefaultWarranty(shopDays: number): WarrantyOption[] {
  const list: WarrantyOption[] = [{ label: 'Không bảo hành', days: 0, extra_price: 0 }];
  if (shopDays > 0) {
    list.push({ label: `Bảo hành ${shopDays} ngày (theo shop)`, days: shopDays, extra_price: 0 });
  }
  list.push({ label: 'Bảo hành 24h', days: 1, extra_price: 0 });
  list.push({ label: 'Bảo hành 7 ngày', days: 7, extra_price: 15000 });
  return list;
}

export default function ProductForm({
  vendorId,
  vendorCode,
  shopWarrantyDays = 7,
  initial,
  onSaved,
  onCancel,
}: Props) {
  const initialImages = initial ? realProductImages(initial) : [];
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0].slug);
  const [basePrice, setBasePrice] = useState(String(initial?.base_price ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [images, setImages] = useState<string[]>(initialImages);
  const [coverUrl, setCoverUrl] = useState(initialImages[0] ?? '');
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [deliveryFormat, setDeliveryFormat] = useState(initial?.delivery_format ?? 'user | pass | 2fa | mail');
  const [deliveryTime, setDeliveryTime] = useState(initial?.delivery_time ?? 'Tự động 24/7');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [warranty, setWarranty] = useState<WarrantyOption[]>(
    initial?.warranty_options?.length ? initial.warranty_options : buildDefaultWarranty(shopWarrantyDays),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const brand = detectBrand(name, category);
  const hasOwnImage = images.length > 0;

  const addImages = (urls: string[]) => {
    setImages((prev) => {
      const merged = [...prev];
      urls.forEach((url) => {
        if (url && !merged.includes(url)) merged.push(url);
      });
      return merged;
    });
    setCoverUrl((prev) => prev || urls[0] || '');
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setImageNote(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadPublicImage(file, 'products');
        uploaded.push(url);
      }
      addImages(uploaded);
      setImageNote(`Đã tải lên ${uploaded.length} ảnh.`);
    } catch (err) {
      setImageNote(err instanceof Error ? err.message : 'Không tải được ảnh.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setImageNote('Liên kết ảnh cần bắt đầu bằng http:// hoặc https://');
      return;
    }
    addImages([url]);
    setLinkInput('');
    setImageNote('Đã thêm ảnh từ liên kết.');
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((item) => item !== url));
    setCoverUrl((prev) => (prev === url ? '' : prev));
  };

  const handleSave = async () => {
    setError(null);
    if (name.trim().length < 3) {
      setError('Tên sản phẩm cần ít nhất 3 ký tự.');
      return;
    }
    const price = Number(basePrice);
    if (!price || price <= 0) {
      setError('Giá gốc phải lớn hơn 0.');
      return;
    }
    const cleanWarranty = warranty
      .filter((item) => item.label.trim())
      .map((item) => ({
        label: item.label.trim(),
        days: Math.max(0, Number(item.days) || 0),
        extra_price: Number(item.extra_price) || 0,
      }));
    if (cleanWarranty.length === 0) {
      setError('Cần ít nhất một gói bảo hành.');
      return;
    }

    const finalImages = [...images];
    const cover = coverUrl || finalImages[0] || '';
    if (cover && !finalImages.includes(cover)) finalImages.unshift(cover);

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category,
        base_price: price,
        description: description.trim(),
        image_url: cover || null,
        images: finalImages,
        delivery_format: deliveryFormat.trim() || 'Tài khoản | Mật khẩu',
        delivery_time: deliveryTime.trim() || 'Tự động 24/7',
        is_active: isActive,
        warranty_options: cleanWarranty,
      };

      if (initial) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', initial.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('products').insert({
          ...payload,
          vendor_id: vendorId,
          vendor_code: vendorCode,
          stock_count: 0,
          sold_count: 0,
        });
        if (insertError) throw insertError;
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không lưu được sản phẩm.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <h3 className="font-heading text-sm font-bold text-foreground-950">
        {initial ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h3>

      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Tên sản phẩm</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Via Facebook cổ 2015 - 2FA đầy đủ"
            className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400 cursor-pointer"
            >
              {CATEGORIES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Giá gốc (đ)</label>
            <input
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="150000"
              className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400"
            />
            {Number(basePrice) > 0 && (
              <p className="mt-1 text-[11px] text-foreground-500">{formatCurrency(Number(basePrice))}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Mô tả chi tiết</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1200))}
            rows={4}
            placeholder="Mô tả tài khoản, thông tin bàn giao, lưu ý khi sử dụng..."
            className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm leading-relaxed focus:outline-none focus:border-primary-400 resize-y"
          />
          <p className="mt-1 text-right text-[10px] text-foreground-400">{description.length}/1200</p>
        </div>

        <div className="rounded-md border border-background-200 bg-background-100/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground-800">Ảnh sản phẩm</p>
              <p className="mt-0.5 text-[11px] text-foreground-500">
                Tải ảnh từ máy hoặc dán liên kết. Có thể thêm nhiều ảnh và chọn 1 ảnh làm ảnh bìa.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-secondary-100 text-[10px] font-semibold text-secondary-800">
              <i className="ri-image-2-line text-[11px] leading-none"></i>
              {images.length} ảnh
            </span>
          </div>

          <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {uploading ? (
                <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
              ) : (
                <i className="ri-upload-2-line text-sm leading-none"></i>
              )}
              {uploading ? 'Đang tải ảnh...' : 'Tải ảnh từ máy'}
            </button>

            <div className="flex flex-1 min-w-0 gap-2">
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Dán liên kết ảnh https://..."
                className="flex-1 min-w-0 h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="h-9 px-3 inline-flex items-center gap-1 rounded-md border border-background-300 text-xs font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-link text-sm leading-none"></i>
                Thêm
              </button>
            </div>
          </div>

          {imageNote && <p className="mt-2 text-[11px] text-foreground-600">{imageNote}</p>}

          <div className="mt-2.5 flex items-center gap-2.5 rounded-md border border-dashed border-background-300 bg-background-50 p-2">
            <div className="w-14 h-14 shrink-0 rounded overflow-hidden">
              <BrandCover brand={brand} size="xs" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground-800">
                Ảnh mặc định theo thương hiệu: {brand.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-foreground-500">
                {hasOwnImage
                  ? 'Sản phẩm đang dùng ảnh riêng bạn tải lên.'
                  : `Chưa có ảnh riêng, hệ thống tự dùng ảnh bìa ${brand.label} của YAMATO SHOP.`}
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((url) => {
                const isCover = coverUrl === url;
                return (
                  <div
                    key={url}
                    className={`relative rounded-md overflow-hidden border bg-background-50 ${
                      isCover ? 'border-primary-400 ring-2 ring-primary-100' : 'border-background-200'
                    }`}
                  >
                    <div className="w-full h-20">
                      <img src={url} alt="Ảnh sản phẩm" className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() => setCoverUrl(url)}
                        className={`text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                          isCover ? 'text-primary-700' : 'text-foreground-500 hover:text-primary-600'
                        }`}
                      >
                        {isCover ? 'Ảnh bìa' : 'Chọn bìa'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        aria-label="Xoá ảnh"
                        className="w-5 h-5 flex items-center justify-center rounded text-foreground-400 hover:text-accent-700 cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-[11px] leading-none"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
            Định dạng tài khoản bàn giao
          </label>
          <input
            value={deliveryFormat}
            onChange={(e) => setDeliveryFormat(e.target.value)}
            placeholder="Tài khoản | Mật khẩu | Mã 2FA"
            className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400"
          />
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-500">
            Bạn tự quy định các thành phần, ngăn cách bằng dấu <span className="font-mono">|</span>. Định dạng này dùng
            khi nhập kho và hiển thị cho người mua.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {FORMAT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDeliveryFormat(preset)}
                className={`h-7 px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                  deliveryFormat === preset
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-background-300 text-foreground-600 hover:bg-background-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Thời gian giao</label>
          <input
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            placeholder="Tự động 24/7"
            className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        {shopWarrantyDays > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-accent-200 bg-accent-50 px-3 py-2.5">
            <i className="ri-shield-check-line mt-0.5 text-sm leading-none text-accent-700"></i>
            <p className="text-[11px] leading-relaxed text-accent-900">
              Gói <span className="font-semibold">Bảo hành {shopWarrantyDays} ngày (theo shop)</span> được hệ thống tự động
              thêm vào sản phẩm, miễn phí và không làm tăng giá bán.
            </p>
          </div>
        )}

        <WarrantyOptionsEditor value={warranty} onChange={setWarranty} />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-primary-500 cursor-pointer"
          />
          <span className="text-xs font-medium text-foreground-700">Đang mở bán trên sàn</span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-accent-300 bg-accent-50 px-3 py-2.5">
            <i className="ri-error-warning-line mt-0.5 text-sm leading-none text-accent-800"></i>
            <p className="text-xs leading-relaxed text-accent-900">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {saving ? <i className="ri-loader-4-line animate-spin text-sm leading-none"></i> : <i className="ri-save-line text-sm leading-none"></i>}
            {initial ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 rounded-md border border-background-300 text-sm font-semibold text-foreground-700 hover:bg-background-100 whitespace-nowrap cursor-pointer"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}