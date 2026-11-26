import { supabase } from '@/lib/supabaseClient';

export type ImageFolder = 'products' | 'shops' | 'banners';

const BUCKETS: Record<ImageFolder, string> = {
  products: 'product-images',
  shops: 'shop-media',
  banners: 'product-images',
};

const MAX_SIZE = 5 * 1024 * 1024;

function safeExtension(name: string): string {
  const raw = (name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  return raw || 'jpg';
}

export async function uploadPublicImage(file: File, folder: ImageFolder): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ hỗ trợ tệp ảnh (jpg, png, webp...).');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Mỗi ảnh tối đa 5MB.');
  }
  const bucket = BUCKETS[folder];
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  });
  if (error) {
    throw new Error('Không tải được ảnh lên. Vui lòng thử lại hoặc dán liên kết ảnh.');
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}