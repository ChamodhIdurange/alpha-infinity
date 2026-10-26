import { mediaUrl } from '../../shared/media';
import type { CartItem } from '../hooks';

interface Props {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onChangeQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onSend: () => void;
}

export function CartDrawer({ open, cart, onClose, onChangeQty, onRemove, onSend }: Props) {
  const count = cart.reduce((n, x) => n + x.qty, 0);

  return (
    <div className={'drawer' + (open ? ' on' : '')} id="drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden={!open} inert={!open}>
      <div className="drawerhead">
        <h2>Your bag <span id="bagtotal">({count})</span></h2>
        <button className="close" id="bagclose" aria-label="Close bag" onClick={onClose}>×</button>
      </div>
      <div className="cartlines" id="cartlines">
        {cart.length ? (
          cart.map((x, i) => (
            <div className="cartline" key={`${x.id}|${x.colour}|${x.size}`}>
              <img src={mediaUrl(x.image)} alt={x.name} />
              <div>
                <b>{x.name}</b>
                <small>{x.colour} · {x.size}</small>
                <small>Confirm price on WhatsApp</small>
                <div className="cartchange">
                  <button aria-label="Reduce quantity" onClick={() => onChangeQty(i, -1)}>−</button>
                  <span>{x.qty}</span>
                  <button aria-label="Increase quantity" onClick={() => onChangeQty(i, 1)}>+</button>
                  <button onClick={() => onRemove(i)}>Remove</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">YOUR BAG IS EMPTY.<br /><br />Discover your next ALFA essential.<br /><a href="#shop" id="emptyshop" onClick={onClose}>Shop collection ↗</a></div>
        )}
      </div>
      <div className="cartbottom">
        <button className="mainbtn" id="sendcart" onClick={onSend}>Send order on WhatsApp ↗</button>
        <p>No live checkout or payment processing is connected. The ALFA team confirms availability and final prices.</p>
      </div>
    </div>
  );
}
