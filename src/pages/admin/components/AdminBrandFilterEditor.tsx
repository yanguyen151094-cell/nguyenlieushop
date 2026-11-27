import { useEffect, useState } from 'react';
import { BRAND_FILTER_KEYS, brandByKey } from '@/lib/brandTheme';
import { DEFAULT_BRAND_LABELS, SETTING_KEYS } from '@/lib/siteContent';
import { saveSiteSetting, useSiteSetting } from '@/hooks/useSiteSetting';

interface BrandSetting extends Record<string, unknown> {
  title: string;
  labels: Record<string, string>;
  hidden: string[];
}

const FALLBACK: BrandSetting = {
  title: DEFAULT_BRAND_LABELS.title,
  labels: DEFAULT_BRAND_LABELS.labels,
  hidden: DEFAULT_BRAND_LABELS.hidden,
};

export default function AdminBrandFilterEditor() {
  const { value, loading, refresh } = useSiteSetting<BrandSetting>(SETTING_KEYS.brandLabels, FALLBACK);
  const [title, setTitle] = useState(FALLBACK.title);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setTitle(value.title?.trim() || FALLBACK.title);
    setLabels(value.labels ?? {});
    setHidden(Array.isArray(value.hidden) ? value.hidden : []);
  }, [value.title, value.labels, value.hidden]);

  const toggle = (key: string) => {
    setHidden((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const cleaned: Record<string, string> = {};
      Object.entries(labels).forEach(([key, label]) => {
        const next = (label ?? '').trim();
        if (next) cleaned[key] = next;
      });
      await saveSiteSetting(SETTING_KEYS.brandLabels, {
        title: title.trim() || FALLBACK.title,
        labels: cleaned,
        hidden,
      });
      await refresh();
      setNote({ ok: true, text: 'Đã lưu danh sách phân loại thương hiệu.' });
    } catch {
      setNote({ ok: false, text: 'Không lưu được danh sách. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-extrabold text-foreground-950">Phân loại thương hiệu</h2>
          <p className="mt-1 text-xs text-foreground-600">
            Đây là dải lọc thương hiệu hiển thị ở trang sản phẩm và dải nền tảng dưới banner. Anh sửa được từ ngữ, ẩn
            hoặc hiện từng thương hiệu.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 text-background-50 text-xs font-semibold hover:bg-primary-600 disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          {saving ? (
            <i className="ri-loader-4-line animate-spin text-sm leading-none"></i>
          ) : (
            <i className="ri-save-3-line text-sm leading-none"></i>
          )}
          Lưu danh sách
        </button>
      </div>

      <div className="mt-3">
        <label htmlFor="brand-filter-title" className="text-[11px] font-semibold text-foreground-700">
          Tiêu đề dải lọc
        </label>
        <input
          id="brand-filter-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Lọc theo thương hiệu"
          className="mt-1 w-full h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BRAND_FILTER_KEYS.map((key) => {
          const theme = brandByKey(key);
          const isHidden = hidden.includes(key);
          return (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-2 ${
                isHidden ? 'border-background-200 bg-background-100/50 opacity-60' : 'border-background-200 bg-background-100/60'
              }`}
            >
              <span
                className="w-7 h-7 shrink-0 flex items-center justify-center rounded-[6px]"
                style={{ backgroundImage: theme.gradient }}
              >
                <i className={`${theme.icon} text-white text-[14px] leading-none`}></i>
              </span>
              <input
                value={labels[key] ?? ''}
                onChange={(e) => setLabels((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={theme.label}
                className="flex-1 min-w-0 h-8 px-2 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
              />
              <button
                type="button"
                onClick={() => toggle(key)}
                className={`h-7 px-2 inline-flex items-center gap-1 rounded-md text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                  isHidden
                    ? 'bg-background-200 text-foreground-700 hover:bg-background-300'
                    : 'bg-accent-100 text-accent-900 hover:bg-accent-200'
                }`}
                title={isHidden ? 'Đang ẩn - bấm để hiện' : 'Đang hiện - bấm để ẩn'}
              >
                <i className={`${isHidden ? 'ri-eye-off-line' : 'ri-eye-line'} text-xs leading-none`}></i>
                {isHidden ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-foreground-500">
        Gợi ý: ô nào để trống sẽ dùng tên mặc định của thương hiệu. Thương hiệu bị ẩn sẽ không hiện trong dải lọc nhưng
        sản phẩm vẫn còn trên sàn.
      </p>

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