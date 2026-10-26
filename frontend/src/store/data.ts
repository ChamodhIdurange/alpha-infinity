import { useEffect, useState } from 'react';
import type { Banner, Campaign, CatalogueData, Product, Settings } from '../shared/types';

// Shown only if the API can't be reached; normally the server embeds live CMS data in the page.
export const FALLBACK_PRODUCTS: Product[] = [
  { id: 'ALFA-POLO-01', name: 'Signature Piqué Polo', category: 'Polos', detail: 'Premium crocodile fabric · Regular fit', description: 'Structured collar, comfortable piqué texture and understated detail. A clean staple built for work and weekends.', image: 'assets/polo-forest.png', badge: 'THE SIGNATURE', price: '', colors: [{ name: 'Forest', hex: '#164535' }, { name: 'Charcoal', hex: '#262b29' }, { name: 'Stone', hex: '#dbd2b7' }, { name: 'Slate', hex: '#708080' }] },
  { id: 'ALFA-POLO-02', name: 'Executive Polo / Charcoal', category: 'Polos', detail: 'Piqué fabric · Minimal face emblem', description: 'Modern fit, classic construction and subtle branding. Designed for the smarter everyday look.', image: 'assets/polo-black.png', badge: 'WORK EDIT', price: '', colors: [{ name: 'Charcoal', hex: '#252a28' }, { name: 'Forest', hex: '#164535' }, { name: 'Stone', hex: '#dbd2b7' }] },
  { id: 'ALFA-TEE-220', name: 'The Everyday 220 Tee', category: 'Tees', detail: '220 GSM · Relaxed everyday fit', description: 'A heavyweight everyday essential with a considered shape and minimal branding.', image: 'assets/tee-editorial.webp', badge: 'EVERYDAY', price: '', colors: [{ name: 'Black', hex: '#232628' }, { name: 'White', hex: '#f1eee6' }, { name: 'Forest', hex: '#234b38' }] },
  { id: 'ALFA-TEE-240', name: 'The 240 Heavyweight Tee', category: 'Tees', detail: '240 GSM · Premium weight & drape', description: 'For a confident silhouette that feels premium without being loud.', image: 'assets/team-editorial.webp', badge: 'HEAVYWEIGHT', price: '', colors: [{ name: 'Charcoal', hex: '#222424' }, { name: 'Ivory', hex: '#efe9dc' }, { name: 'Navy', hex: '#172c3e' }] },
  { id: 'ALFA-BLEND-01', name: 'Movement Performance Tee', category: 'Performance', detail: 'Polyester blend · Lightweight comfort', description: 'A versatile, easy-care performance blend for active everyday wear.', image: 'assets/polo-slate.png', badge: 'ACTIVE EDIT', price: '', colors: [{ name: 'Slate', hex: '#7a8785' }, { name: 'Black', hex: '#232628' }, { name: 'Navy', hex: '#193147' }] },
];

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id: 0, kicker: 'THE ALFA STANDARD / DROP 001', title: 'WEAR|YOUR OWN|*STANDARD.*', description: 'Premium piqué polos. Weighty everyday tees. The kind of pieces you put on and instantly feel different in.', cta: 'Shop collection', link: '#shop', secondary: 'Explore bulk orders', secondary_link: '#bulk', image: '', active: true },
  { id: 1, kicker: 'CAMPAIGN 002 / SIGNATURE POLOS', title: 'WORK READY.|*WEEKEND*|APPROVED.', description: 'A premium crocodile-fabric polo that fits your day, from the first meeting to the last coffee.', cta: 'Shop premium polos', link: '#shop', secondary: 'Discover the studio', secondary_link: '#experience', image: '', active: true },
  { id: 2, kicker: 'CAMPAIGN 003 / ALFA BUSINESS', title: 'ONE TEAM.|*ONE*|IDENTITY.', description: 'Custom apparel, elevated office uniforms and bulk garment production for teams who care how they show up.', cta: 'Get a bulk quote', link: '#contact', secondary: 'Shop the collection', secondary_link: '#shop', image: '', active: true },
];

export const DEFAULT_BANNERS: Banner[] = [
  { id: 0, eyebrow: '01 / THE SIGNATURE', title: 'THE POLO|COLLECTION.', description: 'Elevated collars. Understated detail. Office to off-duty.', image: 'assets/polo-editorial.webp', link: '#shop', filter: 'Polos' },
  { id: 1, eyebrow: '02 / BUILT DIFFERENT', title: 'THE HEAVYWEIGHT|EDIT.', description: '220 GSM & 240 GSM everyday essentials.', image: 'assets/tee-editorial.webp', link: '#shop', filter: 'Tees' },
  { id: 2, eyebrow: '03 / MADE TOGETHER', title: 'ALFA FOR|YOUR TEAM.', description: 'Corporate polos, events and bulk apparel production.', image: 'assets/team-editorial.webp', link: '#bulk', filter: '' },
];

export const DEFAULT_SETTINGS: Settings = {
  phone: '94710910951',
  display_phone: '071 091 0951',
  order_note: 'Please confirm price, stock and delivery.',
  announcement: 'PREMIUM POLOS · HEAVYWEIGHT TEES · CUSTOM WEAR',
  video_url: '',
};

const FALLBACK: CatalogueData = { products: FALLBACK_PRODUCTS, campaigns: [], banners: [], settings: {} };

function readEmbedded(): CatalogueData | null {
  try {
    return JSON.parse(document.getElementById('alfa-data')?.textContent || 'null');
  } catch {
    return null;
  }
}

export interface Storefront {
  /** null until the catalogue has loaded. */
  products: Product[] | null;
  campaigns: Campaign[];
  banners: Banner[];
  settings: Settings;
}

/**
 * Catalogue data: embedded in the HTML by the server in production, fetched from
 * /api/storefront in development, and the built-in concept range if neither works.
 */
export function useStorefront(): Storefront {
  const [data, setData] = useState<CatalogueData | null>(readEmbedded);

  useEffect(() => {
    if (data) return;
    fetch('/api/storefront', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Store data unavailable'))))
      .then(setData)
      .catch((err) => {
        console.warn('Using local catalogue preview', err);
        setData(FALLBACK);
      });
  }, [data]);

  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const [k, v] of Object.entries(data?.settings ?? {})) if (v) settings[k] = v;

  return {
    products: data?.products ?? null,
    campaigns: data?.campaigns.length ? data.campaigns : DEFAULT_CAMPAIGNS,
    banners: DEFAULT_BANNERS.map((b, i) => data?.banners[i] ?? b),
    settings,
  };
}
