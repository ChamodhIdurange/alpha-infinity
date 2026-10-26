import { useState } from 'react';
import { mediaUrl } from '../../shared/media';

interface Props {
  videoUrl: string;
  notice: (message: string) => void;
}

export function Bulk({ videoUrl, notice }: Props) {
  const [playing, setPlaying] = useState(false);

  const play = () => {
    if (!videoUrl) {
      notice('Real workshop video can replace this placeholder when supplied.');
      return;
    }
    setPlaying(true);
  };

  return (
    <section id="bulk" className="bulk">
      <div className="contain">
        <div className="bulkgrid">
          <div className="bulktext">
            <span className="caps g">ALFA FOR BUSINESS</span>
            <h2 className="display">YOUR TEAM.<br />ONE LOOK.<br /><span className="g">DONE RIGHT.</span></h2>
            <p>We do more than ready-to-wear. Bring us your company uniform brief, promotional campaign or event requirement and we'll help with garments, printing and finishing.</p>
            <div className="chips"><span>CORPORATE POLOS</span><span>DTF PRINTING</span><span>EMBROIDERY</span><span>HIGH BUILD</span><span>EVENT WEAR</span></div>
            <a href="#contact" className="mainbtn">Request bulk quotation ↗</a>
          </div>
          <div className="filmbox">
            <img src="/assets/campaign-two.webp" alt="ALFA editorial campaign representing the bulk garment studio" loading="lazy" />
            <button id="playdemo" className="playbtn" title="Production video status" aria-label={videoUrl ? 'Play production video' : 'Production video placeholder'} onClick={play}>▶</button>
            <div className="filmtxt">
              <span className="caps g">BEHIND THE SEAMS</span>
              <h3>ONE VISION. ANY QUANTITY.</h3>
              <p>Your real workshop / printing video will appear here once supplied.</p>
            </div>
            {playing && (
              <video
                src={mediaUrl(videoUrl)}
                controls
                autoPlay
                playsInline
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000', zIndex: 5 }}
              />
            )}
          </div>
        </div>
        <div className="how">
          <div><div className="no">01 / SHARE YOUR BRIEF</div><b>Choose the garment</b><p>Tell us the fabric, colours, sizes, quantity and deadline.</p></div>
          <div><div className="no">02 / WE PLAN IT</div><b>Approve artwork &amp; quote</b><p>Review the placement, finish, pricing and production requirements.</p></div>
          <div><div className="no">03 / WE PRODUCE</div><b>From concept to handover</b><p>Your apparel is prepared for collection or arranged delivery.</p></div>
        </div>
      </div>
    </section>
  );
}
