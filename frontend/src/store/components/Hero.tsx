import { Fragment, useState, type ReactNode } from 'react';
import { mediaUrl } from '../../shared/media';
import type { Campaign } from '../../shared/types';

/** "WEAR|YOUR OWN|*STANDARD.*" → three lines with STANDARD. highlighted. */
export function campaignTitle(title: string): ReactNode {
  return title.split('|').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split(/\*([^*]+)\*/g).map((part, j) => (j % 2 ? <em key={j}>{part}</em> : part))}
    </Fragment>
  ));
}

interface Props {
  slides: Campaign[];
  onShowPolos: () => void;
}

export function Hero({ slides, onShowPolos }: Props) {
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, slides.length - 1);
  const slide = slides[active];

  return (
    <section className={'hero ' + (active ? 'slide-' + active : '')} id="home">
      <div className="hero-photo" id="herophoto" style={slide.image ? { backgroundImage: `url(${JSON.stringify(mediaUrl(slide.image))})` } : undefined}></div>
      <div className="contain hero-grid">
        <div className="hero-copy">
          <div className="eyeline caps" id="herokicker">{slide.kicker}</div>
          <h1 className="display" id="herotitle">{campaignTitle(slide.title)}</h1>
          <p className="subtitle" id="herodesc">{slide.description}</p>
          <div className="hero-buttons">
            <a id="herocta" className="mainbtn" href={slide.link}>{slide.cta} <span>↗</span></a>
            {slide.secondary && <a id="herosecond" className="mainbtn ghostbtn" href={slide.secondary_link}>{slide.secondary} <span>↗</span></a>}
          </div>
          <div className="hero-trust"><span><b>✧</b>FABRIC FIRST</span><span><b>◈</b>MODERN FIT</span><span><b>↗</b>SRI LANKAN LABEL</span></div>
        </div>
        <div className="hero-side" id="hero-side">
          <div className="backhalo"></div>
          <div className="depthring"></div>
          <img src="/assets/polo-forest.png" className="floatpiece" id="heroPolo" alt="Floating forest green ALFA polo concept" fetchPriority="high" />
          <div className="side-badge"><strong>01 / 03</strong><small>THE POLO EDIT</small></div>
        </div>
      </div>
      <div className="heronumbers">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={'hnum' + (i === active ? ' active' : '')}
            aria-label={`Show campaign ${i + 1}`}
            aria-pressed={i === active}
            onClick={() => {
              setSelected(i);
              if (i === 1) onShowPolos();
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
      <div className="hero-vertical">DESIGNED TO STAND APART</div>
    </section>
  );
}
