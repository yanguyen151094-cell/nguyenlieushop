import { useEffect, useRef, useState } from 'react';
import { uploadPublicImage } from '@/lib/imageUpload';
import { saveSiteSetting, useSiteSetting } from '@/hooks/useSiteSetting';
import { DEFAULT_LIVE_SHOWCASE, SETTING_KEYS, type LiveShowcaseItem } from '@/lib/siteContent';

interface ShowcaseSetting extends Record<string, unknown> {
  items: LiveShowcaseItem[];
  enabled: boolean;
}

export default function AdminLiveShowcaseEditor() {
  const showcase = useSiteSetting<ShowcaseSetting>(SETTING_KEYS.liveShowcase, {
    items: DEFAULT_LIVE_SHOWCASE,
    enabled: true,
  });

  const [items, setItems] = useState<LiveShowcaseItem[]>(DEFAULT_LIVE_SHOWCASE);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const targetRef = useRef<string | null>(null);

  useEffect(() => {
    setItems(showcase.value.items?.length ? showcase.value.items : DEFAULT_LIVE_SHOWCASE);
    setEnabled(showcase.value.enabled !== false);
  }, [showcase.value.items, showcase.value.enabled]);

  const patch = (id: string, field: keyof LiveShowcaseItem, next: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: next } : item)));
  };

  const pickImage = (id: string) => {
    targetRef.current = id;
    fileRef.current?.click();
  };

  const upload = async (file: File) => {
    const id = targetRef.current;
    if (!id) return;
    setUploadingId(id);
    setNote(null);
    try {
      const url = await uploadPublicImage(file, 'banners');
      patch(id, 'image', url);
      setNote({ ok: true, text: 'Đã tải ảnh mới. Bấm “Lưu ảnh tài khoản live” để áp dụng.' });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Không tải được ảnh.' });
    } finally {
      setUploadingId(null);
      targetRef.current = null;
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `live-${Date.now()}`,
        image: '',
        title: 'Tài khoản live mới',
        subtitle: 'Mô tả ngắn về tài khoản đang mở bán',
        tag: 'Đang live',
        to: '/san-pham',
      },
    ]);
  };

  const save = async () => {
    const clean = items.filter((item) => item.image.trim());
    if (clean.length === 0) {
      setNote({ ok: false, text: 'Cần ít nhất một ảnh tài khoản live. Hãy tải ảnh từ máy.' });
      return;
    }
    setSaving(true);
    setNote(null);
    try {
      setItems(clean);
      await saveSiteSetting(SETTING_KEYS.liveShowcase, { items: clean, enabled });
      await showcase.refresh();
      setNote({ ok: true, text: 'Đã cập nhật dải ảnh tài khoản live trên trang chủ.' });
    } catch {
      setNote({ ok: false, text: 'Không lưu được. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Ảnh tài khoản live</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Dải ảnh nằm ngay dưới banner trang chủ. Anh tải ảnh thật của từng tài khoản live, đổi tiêu đề và liên kết.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-primary-500 cursor-pointer"
            />
            Hiện trên trang chủ
          </label>
          <button
            type="button"
            onClick={addItem}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 hover:bg-background-100 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line text-sm leading-none"></i>
            Thêm ảnh
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {saving ? (
              <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
            ) : (
              <i className="ri-save-3-line text-sm leading-none"></i>
            )}
            Lưu ảnh tài khoản live
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-background-200 bg-background-100/60 p-3">
            <div className="flex gap-2.5">
              <div className="w-20 h-24 shrink-0 rounded-md overflow-hidden border border-background-200 bg-background-200">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-foreground-500 text-center px-1">
                    Chưa có ảnh
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <input
                  value={item.title}
                  onChange={(e) => patch(item.id, 'title', e.target.value)}
                  placeholder="Tên tài khoản live"
                  className="w-full h-8 px-2 rounded-md border border-background-300 bg-background-50 text-[11px] focus:outline-none focus:border-primary-400"
                />
                <input
                  value={item.tag}
                  onChange={(e) => patch(item.id, 'tag', e.target.value)}
                  placeholder="Nhãn (Đang live)"
                  className="w-full h-8 px-2 rounded-md border border-background-300 bg-background-50 text-[11px] focus:outline-none focus:border-primary-400"
                />
                <input
                  value={item.to}
                  onChange={(e) => patch(item.id, 'to', e.target.value)}
                  placeholder="Liên kết (/san-pham?brand=tiktok)"
                  className="w-full h-8 px-2 rounded-md border border-background-300 bg-background-50 text-[11px] focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>

            <textarea
              value={item.subtitle}
              onChange={(e) => patch(item.id, 'subtitle', e.target.value)}
              rows={2}
              placeholder="Mô tả ngắn"
              className="mt-2 w-full px-2 py-1.5 rounded-md border border-background-300 bg-background-50 text-[11px] resize-none focus:outline-none focus:border-primary-400"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => pickImage(item.id)}
                disabled={uploadingId === item.id}
                className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-background-300 bg-background-50 text-[11px] font-semibold text-foreground-800 hover:bg-background-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                {uploadingId === item.id ? (
                  <i className="ri-loader-4-line animate-spin text-xs leading-none"></i>
                ) : (
                  <i className="ri-upload-2-line text-xs leading-none"></i>
                )}
                Tải ảnh
              </button>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
                className="h-8 px-2 inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-primary-700 hover:bg-primary-50 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-delete-bin-line text-xs leading-none"></i>
                Xoá
              </button>
            </div>
          </div>
        ))}
      </div>

      {note && (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-[11px] ${
            note.ok ? 'border-accent-200 bg-accent-50 text-accent-900' : 'border-primary-200 bg-primary-50 text-primary-800'
          }`}
        >
          {note.text}
        </p>
      )}
    </section>
  );
}