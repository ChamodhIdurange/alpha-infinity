export function Footer({ instagramUrl }: { instagramUrl?: string }) {
  return (
    <footer className="footer">
      <div className="contain footgrid">
        <a className="brand" href="#home"><img className="brandwolf" src="/assets/wolf-face.png" alt="" /><span className="brandstack"><img className="brandword" src="/assets/alfa-wordmark.png" alt="ALFA" /><span className="brandtiny">INFINITY</span></span></a>
        <div className="footlinks">
          <a href="#shop">Shop</a>
          <a href="#experience">3D Studio</a>
          <a href="#bulk">Bulk orders</a>
          <a href="#contact">Contact</a>
          {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>}
        </div>
        <div className="smallprint">© {new Date().getFullYear()} ALFA · By Alfa Infinity<br />A brand of Alfa Skull Ceylon Pvt Ltd.</div>
      </div>
    </footer>
  );
}
