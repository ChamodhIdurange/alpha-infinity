import { Fragment } from 'react';
import { mediaUrl } from '../../shared/media';
import type { Banner } from '../../shared/types';

const ALT_TEXT = ['Model wearing a dark premium ALFA polo', 'ALFA heavyweight essentials editorial', 'ALFA menswear editorial duo'];

const LINK_LABELS = ['Explore polos ↗', 'Discover tees ↗', 'Bulk orders ↗'];

interface Props {
  banners: Banner[];
  onFilter: (filter: string) => void;
}

export function Collections({ banners, onFilter }: Props) {
  return (
    <section id="collections" className="banners">
      <div className="contain bannergrid">
        {banners.map((b, i) => (
          <a key={b.id} href={b.link} className="bn" data-target-filter={b.filter || undefined} onClick={b.filter ? () => onFilter(b.filter) : undefined}>
            <img src={mediaUrl(b.image)} alt={ALT_TEXT[i] ?? ''} loading="lazy" />
            <div className="bnbody">
              <span className="caps">{b.eyebrow}</span>
              <h3>{b.title.split('|').map((line, j) => <Fragment key={j}>{j > 0 && <br />}{line}</Fragment>)}</h3>
              <p>{b.description}</p>
              <span className="bnlink">{LINK_LABELS[i]}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
