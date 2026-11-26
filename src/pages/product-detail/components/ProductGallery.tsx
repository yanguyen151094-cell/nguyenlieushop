import { useEffect, useMemo, useState } from 'react';
import BrandCover from '@/components/product/BrandCover';
import type { BrandTheme } from '@/lib/brandTheme';

interface Props {
  images: string[];
  name: string;
  categoryName: string;
  brand: BrandTheme;
}

export default function ProductGallery({ images, name, categoryName, brand }: Props) {
  const gallery = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(gallery[0] ?? '');

  useEffect(() => {
    setActive(gallery[0] ?? '');
  }, [gallery]);

  return (
    <div>
      <div className="w-full h-64 md:h-80 rounded-lg border border-background-200 bg-secondary-100 overflow-hidden">
        {active ? (
          <img
            src={active}
            alt={name}
            title={`${name} - ${categoryName}`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <BrandCover brand={brand} size="lg" />
        )}
      </div>

      {gallery.length > 1 && (
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {gallery.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(url)}
              aria-label="Xem ảnh sản phẩm"
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border cursor-pointer ${
                active === url ? 'border-primary-400 ring-2 ring-primary-100' : 'border-background-200'
              }`}
            >
              <img src={url} alt={name} className="w-full h-full object-cover object-top" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}