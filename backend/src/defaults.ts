import type { Banner, Campaign, Product } from './types.js';

export const DEFAULT_SETTINGS: Record<string, string> = {
  brand: 'ALFA',
  parent_brand: 'Alfa Infinity',
  phone: '94710910951',
  display_phone: '071 091 0951',
  instagram_url: '',
  video_url: '',
  announcement: 'PREMIUM POLOS · HEAVYWEIGHT TEES · CUSTOM WEAR',
  order_note: 'We confirm prices, stock and delivery before payment.',
};

export const CATEGORIES = ['Polos', 'Tees', 'Performance', 'Other'] as const;

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

type SeedProduct = Omit<Product, 'active' | 'featured' | 'position'>;

export const DEFAULT_PRODUCTS: SeedProduct[] = [
  { id: 'ALFA-POLO-01', name: 'Signature Piqué Polo', category: 'Polos', detail: 'Premium crocodile fabric · Regular fit', description: 'Structured collar, comfortable piqué texture and understated detail. A clean staple built for work and weekends.', image: 'assets/polo-forest.png', badge: 'THE SIGNATURE', price: null, stock: null, sizes: SIZES, colors: [{ name: 'Forest', hex: '#164535' }, { name: 'Charcoal', hex: '#262b29' }, { name: 'Stone', hex: '#dbd2b7' }, { name: 'Slate', hex: '#708080' }] },
  { id: 'ALFA-POLO-02', name: 'Executive Polo / Charcoal', category: 'Polos', detail: 'Piqué fabric · Minimal face emblem', description: 'Modern fit, classic construction and subtle branding. Designed for the smarter everyday look.', image: 'assets/polo-black.png', badge: 'WORK EDIT', price: null, stock: null, sizes: SIZES, colors: [{ name: 'Charcoal', hex: '#252a28' }, { name: 'Forest', hex: '#164535' }, { name: 'Stone', hex: '#dbd2b7' }] },
  { id: 'ALFA-TEE-220', name: 'The Everyday 220 Tee', category: 'Tees', detail: '220 GSM · Relaxed everyday fit', description: 'A heavyweight everyday essential with a considered shape and minimal branding.', image: 'assets/tee-editorial.webp', badge: 'EVERYDAY', price: null, stock: null, sizes: SIZES, colors: [{ name: 'Black', hex: '#232628' }, { name: 'White', hex: '#f1eee6' }, { name: 'Forest', hex: '#234b38' }] },
  { id: 'ALFA-TEE-240', name: 'The 240 Heavyweight Tee', category: 'Tees', detail: '240 GSM · Premium weight & drape', description: 'For a confident silhouette that feels premium without being loud.', image: 'assets/team-editorial.webp', badge: 'HEAVYWEIGHT', price: null, stock: null, sizes: SIZES, colors: [{ name: 'Charcoal', hex: '#222424' }, { name: 'Ivory', hex: '#efe9dc' }, { name: 'Navy', hex: '#172c3e' }] },
  { id: 'ALFA-BLEND-01', name: 'Movement Performance Tee', category: 'Performance', detail: 'Polyester blend · Lightweight comfort', description: 'A versatile, easy-care performance blend for active everyday wear.', image: 'assets/polo-slate.png', badge: 'ACTIVE EDIT', price: null, stock: null, sizes: SIZES, colors: [{ name: 'Slate', hex: '#7a8785' }, { name: 'Black', hex: '#232628' }, { name: 'Navy', hex: '#193147' }] },
];

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id: 0, kicker: 'THE ALFA STANDARD / DROP 001', title: 'WEAR|YOUR OWN|*STANDARD.*', description: 'Premium piqué polos. Weighty everyday tees. The kind of pieces you put on and instantly feel different in.', cta: 'Shop collection', link: '#shop', secondary: 'Explore bulk orders', secondary_link: '#bulk', image: 'assets/campaign.webp', active: true },
  { id: 1, kicker: 'CAMPAIGN 002 / SIGNATURE POLOS', title: 'WORK READY.|*WEEKEND*|APPROVED.', description: 'A premium crocodile-fabric polo that fits your day, from the first meeting to the last coffee.', cta: 'Shop premium polos', link: '#shop', secondary: 'Discover the studio', secondary_link: '#experience', image: 'assets/campaign-two.webp', active: true },
  { id: 2, kicker: 'CAMPAIGN 003 / ALFA BUSINESS', title: 'ONE TEAM.|*ONE*|IDENTITY.', description: 'Custom apparel, elevated office uniforms and bulk garment production for teams who care how they show up.', cta: 'Get a bulk quote', link: '#contact', secondary: 'Shop the collection', secondary_link: '#shop', image: 'assets/team-editorial.webp', active: true },
];

export const DEFAULT_BANNERS: Banner[] = [
  { id: 0, eyebrow: '01 / THE SIGNATURE', title: 'THE POLO|COLLECTION.', description: 'Elevated collars. Understated detail. Office to off-duty.', image: 'assets/polo-editorial.webp', link: '#shop', filter: 'Polos' },
  { id: 1, eyebrow: '02 / BUILT DIFFERENT', title: 'THE HEAVYWEIGHT|EDIT.', description: '220 GSM & 240 GSM everyday essentials.', image: 'assets/tee-editorial.webp', link: '#shop', filter: 'Tees' },
  { id: 2, eyebrow: '03 / MADE TOGETHER', title: 'ALFA FOR|YOUR TEAM.', description: 'Corporate polos, events and bulk apparel production.', image: 'assets/team-editorial.webp', link: '#bulk', filter: 'All' },
];
