import { useCallback, useEffect, useRef, useState } from 'react';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  size: string;
  colour: string;
  qty: number;
}

const CART_KEY = 'alfa_bag_v1';

function loadCart(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((x) => x && typeof x.id === 'string' && Number(x.qty) > 0) : [];
  } catch {
    return [];
  }
}

/** The shopping bag, kept in this browser so it survives a refresh or a trip to WhatsApp. */
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Private mode or storage blocked: the bag still works for this visit.
    }
  }, [cart]);

  const add = useCallback((item: CartItem) => {
    setCart((items) => {
      const same = items.find((x) => x.id === item.id && x.size === item.size && x.colour === item.colour);
      if (!same) return [...items, item];
      return items.map((x) => (x === same ? { ...x, qty: x.qty + item.qty } : x));
    });
  }, []);

  const changeQty = useCallback((index: number, delta: number) => {
    setCart((items) => items.flatMap((x, i) => (i !== index ? [x] : x.qty + delta > 0 ? [{ ...x, qty: x.qty + delta }] : [])));
  }, []);

  const remove = useCallback((index: number) => setCart((items) => items.filter((_, i) => i !== index)), []);

  return { cart, add, changeQty, remove };
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState({ message: '', on: false });
  const timer = useRef<number | undefined>(undefined);

  const notice = useCallback(
    (message: string) => {
      setToast({ message, on: true });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast((t) => ({ ...t, on: false })), duration);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { toast, notice };
}

export function openWhatsApp(phone: string, text: string) {
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
}
