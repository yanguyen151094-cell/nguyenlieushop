import { useEffect, useRef, useState } from 'react';
import { uploadPublicImage } from '@/lib/imageUpload';
import { saveSiteSetting, useSiteSetting } from '@/hooks/useSiteSetting';
import {
  DEFAULT_BANNER_SLIDES,
  DEFAULT_SITE_CONTACT,
  SETTING_KEYS,
  type BannerSlide,
  type SiteContact,
} from '@/lib/siteContent';

interface BannerSetting extends Record<string, unknown> {
  slides: BannerSlide[];
}

interface ContactSetting extends Record<string, unknown> {
  contact: SiteContact;
}

interface Props {
  onSaved?: () => void;
}

export default function AdminBannerEditor({ onSaved }: Props) {
  const banner = useSiteSetting<BannerSetting>(SETTING_KEYS.banner, { slides: DEFAULT_BANNER_SLIDES });
  const contact = useSiteSetting<ContactSetting>(SETTING_KEYS.contact, { contact: DEFAULT_SITE_CONTACT });

  const [slides, setSlides] = useState<BannerSlide[]>(DEFAULT_BANNER_SLIDES);
  const [info, setInfo] = useState<SiteContact>(DEFAULT_SITE_CONTACT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const targetRef = useRef<string | null>(null);

  useEffect(() => {
    setSlides(banner.value.slides?.length ? banner.value.slides : DEFAULT_BANNER_SLIDES);
  }, [banner.value.slides]);

  useEffect(() => {
    setInfo({ ...DEFAULT_SITE_CONTACT, ...(contact.value.contact ?? {}) });
  }, [contact.value.contact]);

  const patchSlide = (key: string, field: keyof BannerSlide, next: string) => {
    setSlides((prev) => prev.map((slide) => (slide.key === key ? { ...slide, [field]: next } : slide)));
  };

  const pickImage = (key: string) => {
    targetRef.current = key;
    fileRef.current?.click();
  };

  const upload = async (file: File) => {
    const key = targetRef.current;
    if (!key) return;
    setUploading(key);
    setNote(null);
    try {
      const url = await uploadPublicImage(file, 'banners');
      patchSlide(key, 'image', url);
      setNote({ ok: true, text: 'Đã tải ảnh banner mới. Bấm “Lưu nội dung” để áp dụng.' });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Không tải được ảnh.' });
    } finally {
      setUploading(null);
      targetRef.current = null;
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addSlide = () => {
    const id = `slide-${Date.now()}`;
    setSlides((prev) => [
      ...prev,
      {
        key: id,
        platform: 'Thương hiệu mới',
        icon: 'ri-store-2-fill',
        badge: 'Khuyến mãi mới',
        title: 'Tiêu đề banner mới',
        highlight: 'điểm nhấn ngắn',
        desc: 'Mô tả ngắn gọn về sản phẩm hoặc chương trình muốn giới thiệu tới khách hàng.',
        image:
          'https://readdy.ai/api/search-image?query=premium%20dark%20abstract%20commerce%20background%20with%20warm%20amber%20light%20accents%20and%20soft%20geometric%20shapes%2C%20clean%20elegant%20banner%20visual&width=1600&height=600&seq=yamato-banner-new&orientation=landscape',
        to: '/san-pham',
        cta: 'Xem ngay',
      },
    ]);
  };

  const save = async () => {
    if (slides.some((slide) => !slide.title.trim())) {
      setNote({ ok: false, text: 'Mỗi banner cần có tiêu đề.' });
      return;
    }
    setSaving(true);
    setNote(null);
    try {
      await saveSiteSetting(SETTING_KEYS.banner, { slides });
      await saveSiteSetting(SETTING_KEYS.contact, { contact: info });
      await Promise.all([banner.refresh(), contact.refresh()]);
      setNote({ ok: true, text: 'Đã cập nhật nội dung website.' });
      onSaved?.();
    } catch {
      setNote({ ok: false, text: 'Không lưu được nội dung. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-extrabold text-foreground-950">Banner trang chủ</h2>
            <p className="mt-1 text-xs text-foreground-600">
              Sửa chữ, đổi ảnh, thêm hoặc xoá banner. Thay đổi hiển thị ngay trên trang chủ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addSlide}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md border border-background-300 text-xs font-semibold text-foreground-800 hover:bg-background-100 whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line text-sm leading-none"></i>
              Thêm banner
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
              Lưu nội dung
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

        <div className="mt-3 space-y-3">
          {slides.map((slide, index) => (
            <div key={slide.key} className="rounded-md border border-background-200 bg-background-100/60 p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-52 shrink-0">
                  <div className="w-full h-28 rounded-md overflow-hidden border border-background-200 bg-background-200">
                    {slide.image ? (
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-foreground-500">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => pickImage(slide.key)}
                    disabled={uploading === slide.key}
                    className="mt-1.5 h-8 w-full inline-flex items-center justify-center gap-1 rounded-md border border-background-300 bg-background-50 text-[11px] font-semibold text-foreground-800 hover:bg-background-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                  >
                    {uploading === slide.key ? (
                      <i className="ri-loader-4-line animate-spin text-xs leading-none"></i>
                    ) : (
                      <i className="ri-upload-2-line text-xs leading-none"></i>
                    )}
                    Đổi ảnh
                  </button>
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={slide.platform}
                    onChange={(e) => patchSlide(slide.key, 'platform', e.target.value)}
                    placeholder="Tên thương hiệu"
                    className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                  />
                  <input
                    value={slide.badge}
                    onChange={(e) => patchSlide(slide.key, 'badge', e.target.value)}
                    placeholder="Nhãn nhỏ phía trên"
                    className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                  />
                  <input
                    value={slide.title}
                    onChange={(e) => patchSlide(slide.key, 'title', e.target.value)}
                    placeholder="Tiêu đề banner"
                    className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                  />
                  <input
                    value={slide.highlight}
                    onChange={(e) => patchSlide(slide.key, 'highlight', e.target.value)}
                    placeholder="Dòng nhấn màu vàng"
                    className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                  />
                  <input
                    value={slide.to}
                    onChange={(e) => patchSlide(slide.key, 'to', e.target.value)}
                    placeholder="Liên kết (VD: /san-pham?brand=tiktok)"
                    className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                  />
                  <input
                    value={slide.cta}
                    onChange={(e) => patchSlide(slide.key, 'cta', e.target.value)}
                    placeholder="Chữ trên nút"
                    className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
                  />
                  <textarea
                    value={slide.desc}
                    onChange={(e) => patchSlide(slide.key, 'desc', e.target.value)}
                    rows={2}
                    placeholder="Mô tả ngắn"
                    className="sm:col-span-2 px-2.5 py-2 rounded-md border border-background-300 bg-background-50 text-xs resize-none focus:outline-none focus:border-primary-400"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-foreground-500">Banner {index + 1}</p>
                <button
                  type="button"
                  onClick={() => setSlides((prev) => prev.filter((item) => item.key !== slide.key))}
                  className="h-7 px-2 inline-flex items-center gap-1 rounded-md text-[11px] font-semibold text-primary-700 hover:bg-primary-50 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-xs leading-none"></i>
                  Xoá banner
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
        <h2 className="font-heading text-base font-extrabold text-foreground-950">Thông tin liên hệ</h2>
        <p className="mt-1 text-xs text-foreground-600">Thông tin này dùng cho chân trang và phần hỗ trợ khách hàng.</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={info.hotline}
            onChange={(e) => setInfo({ ...info, hotline: e.target.value })}
            placeholder="Hotline"
            className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
          />
          <input
            value={info.email}
            onChange={(e) => setInfo({ ...info, email: e.target.value })}
            placeholder="Email hỗ trợ"
            className="h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
          />
          <input
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            placeholder="Địa chỉ"
            className="sm:col-span-2 h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
          />
          <input
            value={info.working_hours}
            onChange={(e) => setInfo({ ...info, working_hours: e.target.value })}
            placeholder="Giờ làm việc / ghi chú"
            className="sm:col-span-2 h-9 px-2.5 rounded-md border border-background-300 bg-background-50 text-xs focus:outline-none focus:border-primary-400"
          />
        </div>
      </section>

      {note && (
        <p
          className={`rounded-md border px-3 py-2 text-[11px] ${
            note.ok ? 'border-accent-200 bg-accent-50 text-accent-900' : 'border-primary-200 bg-primary-50 text-primary-800'
          }`}
        >
          {note.text}
        </p>
      )}
    </div>
  );
}