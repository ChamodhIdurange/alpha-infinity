import { DEFAULT_SIZES, mediaUrl } from '../../shared/media';
import type { Product } from '../../shared/types';

export interface Selection {
  product: Product;
  colour: string;
  size: string;
  qty: number;
}

export function startSelection(product: Product): Selection {
  const sizes = product.sizes?.length ? product.sizes : DEFAULT_SIZES;
  return { product, colour: product.colors[0]?.name ?? '', size: sizes.includes('M') ? 'M' : sizes[0], qty: 1 };
}

interface Props {
  open: boolean;
  selection: Selection | null;
  onChange: (selection: Selection) => void;
  onClose: () => void;
  onAdd: (selection: Selection) => void;
}

export function ProductModal({ open, selection, onChange, onClose, onAdd }: Props) {
  const p = selection?.product;
  const unavailable = p?.stock === 0;
  const sizes = p?.sizes?.length ? p.sizes : DEFAULT_SIZES;
  const set = (patch: Partial<Selection>) => selection && onChange({ ...selection, ...patch });

  return (
    <div className={'modal' + (open ? ' on' : '')} id="productmodal" role="dialog" aria-modal="true" aria-label="Product options" aria-hidden={!open} inert={!open}>
      <div className="modalpic">{p && <img id="modalimage" src={mediaUrl(p.image)} alt={p.name} />}</div>
      <div className="modaldetail">
        <button id="modalclose" className="close" aria-label="Close product options" onClick={onClose}>×</button>
        <span className="caps g">THE ALFA EDIT / SHOP</span>
        <h2 id="modalname">{p?.name}</h2>
        <p id="modaldesc">{p?.description}</p>
        <div className="formlab">SELECT COLOUR <span id="variantname">{selection ? '· ' + selection.colour : ''}</span></div>
        <div className="variants" id="colorvariants">
          {p?.colors.map((c) => (
            <button key={c.name + c.hex} aria-label={c.name} title={c.name} aria-pressed={selection?.colour === c.name} className={'colbtn ' + (selection?.colour === c.name ? 'active' : '')} style={{ background: c.hex }} onClick={() => set({ colour: c.name })}></button>
          ))}
        </div>
        <div className="formlab">CHOOSE SIZE</div>
        <div className="variants" id="sizevariants">
          {p && sizes.map((s) => (
            <button key={s} className={'varbtn ' + (s === selection?.size ? 'active' : '')} aria-pressed={s === selection?.size} onClick={() => set({ size: s })}>{s}</button>
          ))}
        </div>
        <div className="formlab">QUANTITY</div>
        <div className="variants">
          <button className="varbtn" id="minusqty" aria-label="Decrease quantity" onClick={() => set({ qty: Math.max(1, (selection?.qty ?? 1) - 1) })}>−</button>
          <span id="qtyview" style={{ padding: 11 }} aria-live="polite">{selection?.qty ?? 1}</span>
          <button className="varbtn" id="plusqty" aria-label="Increase quantity" onClick={() => set({ qty: Math.min(99, (selection?.qty ?? 1) + 1) })}>+</button>
        </div>
        <button id="addcart" className="mainbtn" disabled={unavailable} onClick={() => selection && !unavailable && onAdd(selection)}>{unavailable ? 'Currently unavailable' : 'Add to bag ↗'}</button>
        <p>Concept products. Final pricing and availability are confirmed by the ALFA team.</p>
      </div>
    </div>
  );
}
