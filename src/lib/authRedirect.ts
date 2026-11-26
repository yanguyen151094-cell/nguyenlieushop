const AUTH_ROUTE_PREFIXES = [
  '/dang-nhap',
  '/dang-ky',
  '/auth',
];

/**
 * Chỉ chấp nhận đường dẫn nội bộ an toàn sau khi đăng nhập thông thường.
 * Từ chối URL tuyệt đối, protocol-relative và mọi trang xác thực.
 */
export function validateOrdinaryPostAuthNext(rawNext: string | null | undefined): string {
  if (!rawNext) return '/';
  let value = rawNext.trim();
  if (!value) return '/';
  try {
    value = decodeURIComponent(value);
  } catch {
    return '/';
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return '/';
  if (value.includes('\\')) return '/';

  const pathOnly = value.split('?')[0].split('#')[0].toLowerCase();
  if (AUTH_ROUTE_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`))) {
    return '/';
  }
  return value;
}