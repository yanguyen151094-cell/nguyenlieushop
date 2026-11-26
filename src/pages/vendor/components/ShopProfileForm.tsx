import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/types/db';

interface Props {
  profile: Profile;
  onSaved: () => Promise<void> | void;
}

export default function ShopProfileForm({ profile, onSaved }: Props) {
  const [storeName, setStoreName] = useState(profile.store_name ?? '');
  const [description, setDescription] = useState(profile.shop_description ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url ?? '');
  const [bankName, setBankName] = useState(profile.bank_name ?? '');
  const [bankNumber, setBankNumber] = useState(profile.bank_number ?? '');
  const [bankHolder, setBankHolder] = useState(profile.bank_holder ?? '');
  const [warrantyDays, setWarrantyDays] = useState(String(profile.store_warranty_days ?? 7));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setNote(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          store_name: storeName.trim(),
          shop_description: description.trim(),
          avatar_url: avatarUrl.trim() || null,
          banner_url: bannerUrl.trim() || null,
          bank_name: bankName.trim(),
          bank_number: bankNumber.trim(),
          bank_holder: bankHolder.trim(),
          store_warranty_days: Math.max(0, Number(warrantyDays) || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (error) throw error;
      await supabase.rpc('sync_shop_warranty');
      await onSaved();
      setNote({ ok: true, text: 'Đã lưu thông tin gian hàng.' });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Không lưu được thông tin.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50">
      <div className="p-4 md:p-5 border-b border-background-200">
        <h2 className="font-heading text-base font-extrabold text-foreground-950">Hình ảnh & thông tin gian hàng</h2>
        <p className="mt-1 text-xs text-foreground-600">
          Ảnh bìa và ảnh đại diện hiển thị công khai trên sàn. Bạn có thể thay đổi bất cứ lúc nào.
        </p>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Tên gian hàng</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="VD: Gian hàng tài khoản số 01"
            className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Giới thiệu gian hàng</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Mô tả ngắn về gian hàng, kinh nghiệm bán hàng, cam kết bảo hành..."
            className="w-full px-3 py-2.5 rounded-md border border-background-300 bg-background-50 text-sm leading-relaxed focus:outline-none focus:border-primary-400 resize-y"
          />
          <p className="mt-1 text-right text-[10px] text-foreground-400">{description.length}/500</p>
        </div>

        <div className="rounded-md bg-accent-50 border border-accent-200 p-3">
          <p className="text-xs font-semibold text-accent-900">Bảo hành riêng của gian hàng</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-accent-800">
            Gói bảo hành này được tự động cộng vào mọi sản phẩm của shop, hoàn toàn miễn phí và không làm tăng giá bán.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={0}
              max={365}
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(e.target.value)}
              className="w-24 h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
            <span className="text-xs text-foreground-700">ngày bảo hành miễn phí cho mọi sản phẩm</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Ảnh đại diện (liên kết)</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400"
            />
            <div className="mt-2 w-16 h-16 rounded-full overflow-hidden bg-background-100 border border-background-200 flex items-center justify-center">
              {avatarUrl.trim() ? (
                <img src={avatarUrl} alt="Ảnh đại diện gian hàng" className="w-full h-full object-cover object-top" />
              ) : (
                <i className="ri-store-2-line text-lg leading-none text-foreground-400"></i>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-semibold text-foreground-700 mb-1.5">Ảnh bìa gian hàng (liên kết)</label>
            <input
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-md border border-background-300 bg-background-50 text-sm focus:outline-none focus:border-primary-400"
            />
            <div className="mt-2 w-full h-20 rounded-md overflow-hidden bg-background-100 border border-background-200 flex items-center justify-center">
              {bannerUrl.trim() ? (
                <img src={bannerUrl} alt="Ảnh bìa gian hàng" className="w-full h-full object-cover object-top" />
              ) : (
                <i className="ri-image-line text-lg leading-none text-foreground-400"></i>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-md bg-background-100 p-3">
          <p className="text-xs font-semibold text-foreground-800">Tài khoản ngân hàng nhận tiền</p>
          <p className="mt-0.5 text-[11px] text-foreground-500">Dùng khi tạo lệnh rút tiền từ ví đối tác.</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ngân hàng"
              className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
            <input
              value={bankNumber}
              onChange={(e) => setBankNumber(e.target.value)}
              placeholder="Số tài khoản"
              className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
            <input
              value={bankHolder}
              onChange={(e) => setBankHolder(e.target.value)}
              placeholder="Chủ tài khoản"
              className="w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
          </div>
        </div>

        {note && (
          <div
            className={`rounded-md px-3 py-2.5 text-xs leading-relaxed ${
              note.ok ? 'bg-accent-50 text-accent-900 border border-accent-200' : 'bg-primary-50 text-primary-800 border border-primary-200'
            }`}
          >
            {note.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {saving ? (
            <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
          ) : (
            <i className="ri-save-line text-sm leading-none"></i>
          )}
          Lưu thông tin gian hàng
        </button>
      </div>
    </section>
  );
}