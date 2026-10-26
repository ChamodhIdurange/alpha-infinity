import type { KeyboardEvent } from 'react';
import { formatLKR, mediaUrl } from '../../shared/media';
import type { Product } from '../../shared/types';

export const FILTERS = [
  { value: 'Featured', label: 'Featured' },
  { value: 'All', label: 'Shop all' },
  { value: 'Polos', label: 'Premium polos' },
  { value: 'Tees', label: 'Heavyweight tees' },
  { value: 'Performance', label: 'Performance' },
];

export function visibleProducts(products: Product[], category: string) {
  return products
    .filter((p) => category === 'All' || category === 'Featured' || p.category === category)
    .filter((p, i) => category !== 'Featured' || (p.featured !== false && i < 8));
}

export function priceLabel(p: Product) {
  if (p.stock === 0) return 'Currently unavailable';
  return p.price ? formatLKR(p.price) : 'Price on enquiry';
}

interface Props {
  products: Product[] | null;
  category: string;
  onFilter: (filter: string) => void;
  onOpen: (product: Product) => void;
}

export function Shop({ products, category, onFilter, onOpen }: Props) {
  const shown = products ? visibleProducts(products, category) : [];
  const openOnKey = (e: KeyboardEvent, p: Product) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(p);
    }
  };

  return (
    <section id="shop" className="shop">
      <div className="contain">
        <div className="sectionhead">
          <div><span className="caps">THE FIRST ALFA EDIT</span><h2 className="display">MADE FOR<br />YOUR EVERYDAY<span style={{ color: '#208048' }}>.</span></h2></div>
          <p>Premium materials. A clean silhouette. Minimal branding that says enough without saying too much.</p>
        </div>
        <div className="shopcontrols">
          {FILTERS.map((f) => (
            <button key={f.value} className={'flt' + (category === f.value ? ' active' : '')} aria-pressed={category === f.value} onClick={() => onFilter(f.value)}>{f.label}</button>
          ))}
          <span className="shopcount" id="shopcount">{products ? `${shown.length} styles` : ''}</span>
        </div>
        <div className="products" id="products" aria-busy={!products}>
          {shown.map((p) => (
            <article className="product" key={p.id}>
              <div className="pimg" data-fabric={p.image.includes('editorial') ? 'photo' : 'render'} tabIndex={0} role="button" aria-label={`Choose ${p.name} options`} onClick={() => onOpen(p)} onKeyDown={(e) => openOnKey(e, p)}>
                <img src={mediaUrl(p.image)} alt={`${p.name} concept`} loading="lazy" />
                <span className="badge">{p.badge}</span>
                <button type="button" className="quick" onClick={(e) => { e.stopPropagation(); onOpen(p); }}>Choose options ↗</button>
              </div>
              <div className="pmeta">
                <h3>{p.name}</h3>
                <p className="detail">{p.detail}</p>
                <div className="price">{priceLabel(p)}</div>
                <div className="dots">{p.colors.map((c) => <span key={c.name + c.hex} style={{ background: c.hex }} title={c.name}></span>)}</div>
              </div>
            </article>
          ))}
        </div>
        <div className="shopbottom"><span>Concept collection. Prices and availability subject to confirmation.</span><a className="shoplink" href="#contact">LOOKING FOR BULK QUANTITIES? ↗</a></div>
      </div>
    </section>
  );
}
