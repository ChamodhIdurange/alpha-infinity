export interface Colour {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  detail: string;
  description: string;
  image: string;
  badge: string;
  price: number | string | null;
  stock?: number | null;
  sizes?: string[];
  colors: Colour[];
  active?: boolean;
  featured?: boolean;
  position?: number;
}

export interface Campaign {
  id: number;
  kicker: string;
  /** Lines separated by "|"; words wrapped in *asterisks* are shown in green. */
  title: string;
  description: string;
  cta: string;
  link: string;
  secondary: string;
  secondary_link: string;
  image: string;
  active: boolean;
}

export interface Banner {
  id: number;
  eyebrow: string;
  /** Lines separated by "|". */
  title: string;
  description: string;
  image: string;
  link: string;
  filter: string;
}

export type Settings = Record<string, string>;

export interface CatalogueData {
  products: Product[];
  campaigns: Campaign[];
  banners: Banner[];
  settings: Settings;
}

export interface AdminData extends CatalogueData {
  products: Required<Product>[];
  csrf: string;
}
