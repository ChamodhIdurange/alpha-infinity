import { useState } from 'react';

interface Props {
  announcement: string;
  cartCount: number;
  onOpenBag: () => void;
}

export function Header({ announcement, cartCount, onOpenBag }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="offer"><span>THE ALFA EDIT / SRI LANKA</span><span>✦</span><span>{announcement}</span></div>
      <header className="site-head">
        <div className="contain headgrid">
          <a className="brand" href="#home" aria-label="ALFA home"><img className="brandwolf" src="/assets/wolf-face.png" alt="" /><span className="brandstack"><img className="brandword" src="/assets/alfa-wordmark.png" alt="ALFA" /><span className="brandtiny">INFINITY</span></span></a>
          <nav className="nav" aria-label="Main">
            <a className="selected" href="#home">Home</a>
            <a href="#shop">Shop</a>
            <a href="#collections">Collections</a>
            <a href="#experience">3D Studio</a>
            <a href="#bulk">Bulk Orders</a>
          </nav>
          <div className="actions">
            <button id="search" className="iconbtn" aria-label="Browse products" onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}>
              <svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="7.1" /><path d="m16 16 5 5" /></svg>
            </button>
            <button id="cartbtn" className="iconbtn" aria-label="Your shopping bag" onClick={onOpenBag}>
              <svg viewBox="0 0 24 24"><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              <span className="cartcount" id="cartcount">{cartCount}</span>
            </button>
            <a href="#contact" className="mainbtn headquote">Get a quote ↗</a>
            <button className="iconbtn menu" id="menubtn" aria-label="Toggle menu" aria-expanded={menuOpen} aria-controls="mobilenav" onClick={() => setMenuOpen((o) => !o)}>
              <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
          </div>
        </div>
        <nav className={'mobile-nav' + (menuOpen ? ' on' : '')} id="mobilenav" aria-label="Mobile navigation">
          <a href="#home" onClick={closeMenu}>Home</a>
          <a href="#shop" onClick={closeMenu}>Shop collection</a>
          <a href="#collections" onClick={closeMenu}>Collections</a>
          <a href="#experience" onClick={closeMenu}>3D product studio</a>
          <a href="#bulk" onClick={closeMenu}>Bulk orders</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>
      </header>
    </>
  );
}
