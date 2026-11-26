import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTime } from '@/lib/format';
import { uploadPublicImage } from '@/lib/imageUpload';

interface ShopMedia {
  id: string;
  vendor_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

interface Props {
  vendorId: string;
}

export default function ShopGallery({ vendorId }: Props) {
  const [items, setItems] = useState<ShopMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkText, setLinkText] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('shop_media')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setItems((data ?? []) as ShopMedia[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thư viện ảnh.');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const links = linkText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (links.length === 0) {
      setNote('Vui lòng dán ít nhất một liên kết ảnh.');
      return;
    }
    setSaving(true);
    setNote(null);
    try {
      const rows = links.map((url, index) => ({
        vendor_id: vendorId,
        image_url: url,
        caption: caption.trim() || null,
        sort_order: items.length + index,
      }));
      const { error: insertError } = await supabase.from('shop_media').insert(rows);
      if (insertError) throw insertError;
      setLinkText('');
      setCaption('');
      setNote(`Đã thêm ${rows.length} ảnh vào gian hàng.`);
      await load();
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Không thêm được ảnh.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setNote(null);
    try {
      const rows: { vendor_id: string; image_url: string; caption: string | null; sort_order: number }[] = [];
      let index = 0;
      for (const file of Array.from(files)) {
        const url = await uploadPublicImage(file, 'shops');
        rows.push({
          vendor_id: vendorId,
          image_url: url,
          caption: null,
          sort_order: items.length + index,
        });
        index += 1;
      }
      const { error: insertError } = await supabase.from('shop_media').insert(rows);
      if (insertError) throw insertError;
      setNote(`Đã tải lên ${rows.length} ảnh.`);
      await load();
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Không tải được ảnh.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (id: string) => {
    await supabase.from('shop_media').delete().eq('id', id);
    load();
  };

  const updateCaption = async (id: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, caption: value } : item)));
  };

  const saveCaption = async (id: string, value: string) => {
    await supabase.from('shop_media').update({ caption: value.trim() || null }).eq('id', id);
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50">
      <div className="p-4 md:p-5 border-b border-background-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-base font-extrabold text-foreground-950">Thư viện ảnh gian hàng</h2>
            <p className="mt-1 text-xs text-foreground-600">
              Thêm bao nhiêu ảnh cũng được — ảnh minh hoạ sản phẩm, bảng giá, cam kết bảo hành...
            </p>
          </div>
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-secondary-100 text-[11px] font-semibold text-secondary-800">
            <i className="ri-image-2-line text-xs leading-none"></i>
            {items.length} ảnh
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="rounded-md bg-background-100 p-3">
          <label className="block text-xs font-semibold text-foreground-700 mb-1.5">
            Liên kết ảnh (mỗi dòng một ảnh)
          </label>
          <textarea
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            rows={3}
            placeholder={'https://...anh-1.jpg\nhttps://...anh-2.jpg'}
            className="w-full px-3 py-2 rounded-md border border-background-300 bg-background-50 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-primary-400 resize-y"
          />
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Chú thích (không bắt buộc)"
              className="w-full sm:flex-1 h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-primary-300 bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {uploading ? (
                <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
              ) : (
                <i className="ri-upload-2-line text-sm leading-none"></i>
              )}
              {uploading ? 'Đang tải...' : 'Tải ảnh từ máy'}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {saving ? (
                <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
              ) : (
                <i className="ri-add-line text-sm leading-none"></i>
              )}
              Thêm ảnh
            </button>
          </div>
          {note && <p className="mt-2 text-[11px] text-foreground-600">{note}</p>}
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
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-background-100 animate-pulse"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-background-300 px-5 py-8 text-center">
            <span className="mx-auto w-11 h-11 flex items-center justify-center rounded-full bg-background-100 text-foreground-500">
              <i className="ri-image-add-line text-lg leading-none"></i>
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground-900">Chưa có ảnh nào</p>
            <p className="mt-1 text-xs text-foreground-600">Dán liên kết ảnh ở khung phía trên để thêm vào gian hàng.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-background-200 overflow-hidden bg-background-50">
                <div className="w-full h-28 bg-background-100">
                  <img src={item.image_url} alt={item.caption ?? 'Ảnh gian hàng'} className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-2">
                  <input
                    value={item.caption ?? ''}
                    onChange={(e) => updateCaption(item.id, e.target.value)}
                    onBlur={(e) => saveCaption(item.id, e.target.value)}
                    placeholder="Chú thích ảnh"
                    className="w-full h-7 px-1.5 rounded border border-transparent hover:border-background-300 focus:border-primary-400 bg-transparent text-[11px] focus:outline-none"
                  />
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-foreground-400">{formatDateTime(item.created_at)}</span>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label="Xoá ảnh"
                      className="w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:text-accent-700 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-xs leading-none"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}