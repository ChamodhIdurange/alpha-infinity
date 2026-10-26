import { CATEGORIES, DEFAULT_SETTINGS } from './defaults.js';
import type { Banner, Campaign, Colour, Product, Settings } from './types.js';

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const invalid = (message: string) => new HttpError(422, message);

type Input = Record<string, unknown>;

function asObject(value: unknown, message: string): Input {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(message);
  return value as Input;
}

export function cleanText(value: unknown, maxLength = 250, required = false): string {
  const text = (typeof value === 'string' ? value : value == null ? '' : String(value)).trim();
  if (text.length > maxLength) throw invalid(`Text must be under ${maxLength} characters.`);
  if (required && !text) throw invalid('Required text is missing.');
  return text;
}

export function checkImage(value: unknown): string {
  const s = cleanText(value, 400, true);
  if (s.startsWith('assets/') || s.startsWith('uploads/')) {
    if (s.includes('..') || s.includes('\\') || s.includes('?')) throw invalid('Invalid image path.');
  } else if (!s.startsWith('https://')) {
    throw invalid('Image should be a local uploaded image, asset, or HTTPS URL.');
  }
  return s;
}

export function checkLink(value: unknown): string {
  const s = cleanText(value, 400);
  if (s && !(s.startsWith('#') || s.startsWith('https://') || s.startsWith('uploads/'))) {
    throw invalid('Use an anchor (#shop), an HTTPS link or an uploaded file.');
  }
  return s;
}

function checkColours(value: unknown): Colour[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) throw invalid('Provide 1–16 colours.');
  return value.map((entry) => {
    const c = asObject(entry, 'Invalid colour entry.');
    const name = cleanText(c.name, 35, true);
    const hex = cleanText(c.hex, 7, true);
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw invalid('Colour needs a valid #RRGGBB code.');
    return { name, hex };
  });
}

/** Blank means "not set"; otherwise a whole number in [min, max). */
function optionalInteger(value: unknown, min: number, max: number, typeMessage: string, rangeMessage: string): number | null {
  if (value === '' || value == null) return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n)) throw invalid(typeMessage);
  if (n < min || n >= max) throw invalid(rangeMessage);
  return n;
}

function slotId(value: unknown, message: string): number {
  const id = Number(value);
  if (![0, 1, 2].includes(id)) throw invalid(message);
  return id;
}

const flag = (value: unknown, fallback = true) => (value === undefined ? fallback : Boolean(value));

export function checkedProduct(body: unknown): Product {
  const p = asObject(body, 'Invalid product.');
  const id = cleanText(p.id, 40, true).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(id)) throw invalid('Product ID can only contain letters, numbers, - and _.');
  const category = cleanText(p.category, 35, true);
  if (!(CATEGORIES as readonly string[]).includes(category)) throw invalid('Unknown collection.');
  const sizes = p.sizes === undefined ? ['S', 'M', 'L', 'XL', '2XL'] : p.sizes;
  if (!Array.isArray(sizes) || !sizes.length || sizes.length > 15) throw invalid('Please provide available sizes.');
  const position = Number(p.position ?? 0);
  if (!Number.isInteger(position)) throw invalid('Display order must be a whole number.');
  return {
    id,
    name: cleanText(p.name, 100, true),
    category,
    detail: cleanText(p.detail, 180, true),
    description: cleanText(p.description, 1200),
    image: checkImage(p.image),
    badge: cleanText(p.badge, 45),
    price: optionalInteger(p.price, 1, 10_000_000, 'Price must be a whole number in LKR.', 'Enter a realistic price in LKR.'),
    stock: optionalInteger(p.stock, 0, 1_000_000, 'Stock must be a number.', 'Invalid stock quantity.'),
    sizes: sizes.map((s) => cleanText(s, 12, true)),
    colors: checkColours(p.colors ?? []),
    active: flag(p.active),
    featured: flag(p.featured),
    position,
  };
}

export function checkedCampaign(body: unknown): Campaign {
  const c = asObject(body, 'Invalid campaign.');
  return {
    id: slotId(c.id, 'Three campaign slots are available.'),
    kicker: cleanText(c.kicker, 80, true),
    title: cleanText(c.title, 140, true),
    description: cleanText(c.description, 300, true),
    cta: cleanText(c.cta, 50, true),
    link: checkLink(c.link || '#shop'),
    secondary: cleanText(c.secondary, 50),
    secondary_link: checkLink(c.secondary_link || '#bulk'),
    image: checkImage(c.image),
    active: flag(c.active),
  };
}

export function checkedBanner(body: unknown): Banner {
  const b = asObject(body, 'Invalid banner.');
  return {
    id: slotId(b.id, 'Three collection banners are available.'),
    eyebrow: cleanText(b.eyebrow, 80, true),
    title: cleanText(b.title, 120, true),
    description: cleanText(b.description, 250),
    image: checkImage(b.image),
    link: checkLink(b.link || '#shop'),
    filter: cleanText(b.filter, 30),
  };
}

/** Only known setting keys are accepted; keys that are absent are left unchanged. */
export function checkedSettings(body: unknown): Settings {
  const payload = asObject(body, 'Invalid settings.');
  const out: Settings = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (!(key in payload)) continue;
    let value = cleanText(payload[key], 350);
    if (key === 'phone' && !/^[0-9]{8,15}$/.test(value)) throw invalid('WhatsApp phone must be international digits only.');
    if (key === 'video_url' && value) {
      value = checkLink(value);
      if (!(value.startsWith('uploads/') && value.toLowerCase().endsWith('.mp4')) && !value.startsWith('https://')) {
        throw invalid('Provide an uploaded MP4 file or an HTTPS video URL.');
      }
    }
    if (key === 'instagram_url' && value && !value.startsWith('https://')) throw invalid('Instagram link must use HTTPS.');
    out[key] = value;
  }
  return out;
}
