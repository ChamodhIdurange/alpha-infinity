/** Catalogue paths are stored as "assets/…" or "uploads/…"; HTTPS URLs pass through untouched. */
export function mediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^(https:|data:|\/)/.test(path)) return path;
  return '/' + path;
}

export const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export const formatLKR = (price: number | string) => `LKR ${Number(price).toLocaleString('en-LK')}`;
