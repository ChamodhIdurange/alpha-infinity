import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../shared/types';
import { Bulk } from './components/Bulk';
import { CartDrawer } from './components/CartDrawer';
import { Collections } from './components/Collections';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductModal, startSelection, type Selection } from './components/ProductModal';
import { Shop } from './components/Shop';
import { Showcase } from './components/Showcase';
import { useStorefront } from './data';
import { openWhatsApp, useCart, useToast } from './hooks';

const RIBBON = [
  ['✦', 'PREMIUM PIQUÉ FABRICS'],
  ['◈', '220 / 240 GSM ESSENTIALS'],
  ['↗', 'CUSTOM & CORPORATE ORDERS'],
  ['✧', 'MADE FOR EVERYDAY'],
];

export function StoreApp() {
  const { products, campaigns, banners, settings } = useStorefront();
  const { cart, add, changeQty, remove } = useCart();
  const { toast, notice } = useToast();
  const [category, setCategory] = useState('Featured');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const overlayOn = modalOpen || bagOpen;

  const closeAll = useCallback(() => {
    setModalOpen(false);
    setBagOpen(false);
  }, []);

  const openBag = () => {
    setModalOpen(false);
    setBagOpen(true);
  };

  const openProduct = (product: Product) => {
    setSelection(startSelection(product));
    setBagOpen(false);
    setModalOpen(true);
  };

  const addToBag = (s: Selection) => {
    add({ id: s.product.id, name: s.product.name, image: s.product.image, size: s.size, colour: s.colour, qty: s.qty });
    openBag();
    notice('Added to your bag');
  };

  const sendCart = () => {
    if (!cart.length) {
      notice('Choose an item first');
      return;
    }
    const lines = cart.map((x, i) => `${i + 1}. ${x.name} (${x.id})\nColour: ${x.colour} · Size: ${x.size} · Qty: ${x.qty}`);
    openWhatsApp(settings.phone, 'Hello ALFA! I would like to enquire about:\n\n' + lines.join('\n\n') + '\n\n' + settings.order_note);
  };

  useEffect(() => {
    document.body.classList.toggle('modal-lock', overlayOn);
  }, [overlayOn]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && closeAll();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeAll]);

  const showPolos = () => setCategory('Polos');

  return (
    <>
      <Header announcement={settings.announcement} cartCount={cart.reduce((n, x) => n + x.qty, 0)} onOpenBag={openBag} />
      <main>
        <Hero slides={campaigns} onShowPolos={showPolos} />
        <div className="ribbon"><div className="contain">{RIBBON.map(([icon, text]) => <span className="ribbonitem" key={text}><b>{icon}</b> {text}</span>)}</div></div>
        <Collections banners={banners} onFilter={setCategory} />
        <Shop products={products} category={category} onFilter={setCategory} onOpen={openProduct} />
        <Showcase onShowPolos={showPolos} />
        <Bulk videoUrl={settings.video_url} notice={notice} />
        <Contact phone={settings.phone} displayPhone={settings.display_phone} />
      </main>
      <Footer instagramUrl={settings.instagram_url} />
      <div className={'overlay' + (overlayOn ? ' on' : '')} id="overlay" onClick={closeAll}></div>
      <CartDrawer open={bagOpen} cart={cart} onClose={closeAll} onChangeQty={changeQty} onRemove={remove} onSend={sendCart} />
      <ProductModal open={modalOpen} selection={selection} onChange={setSelection} onClose={closeAll} onAdd={addToBag} />
      <div className={'toast' + (toast.on ? ' on' : '')} id="toast" role="status" aria-live="polite">{toast.message}</div>
    </>
  );
}
