import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { vendorLabel } from '@/lib/format';

interface VendorInfo {
  store_code: string;
  avatar_url: string | null;
  banner_url: string | null;
  shop_description: string | null;
}

interface MediaItem {
  id: string;
  image_url: string;
  caption: string | null;
}

export default function VendorShopCard({ vendorId }: { vendorId: string }) {
  const [info, setInfo] = useState<VendorInfo | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [{ data: infoData }, { data: mediaData }] = await Promise.all([
          supabase.rpc('public_vendor_info', { p_vendor_id: vendorId }),
          supabase
            .from('shop_media')
            .select('id, image_url, caption')
            .eq('vendor_id', vendorId)
            .order('sort_order', { ascending: true })
            .limit(8),
        ]);
        if (!active) return;
        setInfo((infoData as VendorInfo) ?? null);
        setMedia((mediaData ?? []) as MediaItem[]);
      } catch {
        if (active) setInfo(null);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [vendorId]);

  if (!info && media.length === 0) return null;

  const storeName = vendorLabel(info?.store_code);

  return (
    <div className="mt-4 rounded-lg border border-background-200 bg-background-50 overflow-hidden">
      <div className="relative w-full h-24 bg-primary-950">
        {info?.banner_url && (
          <img
            src={info.banner_url}
            alt={`Ảnh bìa ${storeName}`}
            title={`${storeName} - gian hàng đối tác`}
            className="w-full h-full object-cover object-top opacity-80"
          />
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-end gap-3 -mt-7">
          <div className="w-14 h-14 rounded-full border-2 border-background-50 bg-secondary-100 overflow-hidden flex items-center justify-center">
            {info?.avatar_url ? (
              <img src={info.avatar_url} alt={storeName} className="w-full h-full object-cover object-top" />
            ) : (
              <i className="ri-store-2-line text-lg leading-none text-secondary-500"></i>
            )}
          </div>
          <div className="pb-1 min-w-0">
            <p className="text-sm font-bold text-foreground-950 truncate">{storeName}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-foreground-500">
              <i className="ri-shield-check-line text-xs leading-none text-accent-600"></i>
              Đối tác uy tín đã xác minh
            </p>
          </div>
        </div>

        {info?.shop_description && (
          <p className="mt-2.5 text-[12px] leading-relaxed text-foreground-600">{info.shop_description}</p>
        )}

        {media.length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {media.map((item) => (
              <div key={item.id} className="w-full h-16 rounded-md overflow-hidden bg-background-100">
                <img
                  src={item.image_url}
                  alt={item.caption || `Ảnh gian hàng ${storeName}`}
                  title={item.caption || storeName}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        )}

        <p className="mt-2.5 text-[11px] text-foreground-500">
          Tên thật của đối tác được bảo mật. Mọi giao dịch đều được sàn ghi nhận và bảo vệ.
        </p>
      </div>
    </div>
  );
}