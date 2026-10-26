import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const COLOURS = [
  { visual: 'forest', title: 'Forest green', name: 'FOREST GREEN', swatch: '#0a4030' },
  { visual: 'black', title: 'Charcoal', name: 'CHARCOAL', swatch: '#292f2d' },
  { visual: 'cream', title: 'Stone', name: 'STONE', swatch: '#d9cfb5' },
  { visual: 'slate', title: 'Slate', name: 'SLATE', swatch: '#717e7e' },
];

interface Props {
  onShowPolos: () => void;
}

/**
 * 360° concept turnaround: two photo-textured panels (front/back) on a CSS 3D turntable,
 * not a photogrammetric garment mesh. The angle is applied straight to the DOM so dragging
 * and auto-spin don't re-render React on every frame.
 */
export function Showcase({ onShowPolos }: Props) {
  const [colour, setColour] = useState(COLOURS[0]);
  const [autoSpin, setAutoSpin] = useState(false);
  const viewer = useRef<HTMLDivElement>(null);
  const turntable = useRef<HTMLDivElement>(null);
  const angle = useRef(-8);
  const drag = useRef({ active: false, lastX: 0 });
  const frame = useRef(0);

  const setAngle = useCallback((deg: number, animate = false) => {
    angle.current = deg;
    const el = turntable.current;
    if (!el) return;
    el.style.transition = animate ? 'transform .5s cubic-bezier(.22,.7,.15,1)' : 'none';
    el.style.transform = `rotateY(${deg}deg)`;
  }, []);

  useEffect(() => setAngle(angle.current), [setAngle]);

  useEffect(() => {
    if (!autoSpin) return;
    let lastTick = 0;
    const step = (t: number) => {
      if (lastTick) setAngle(angle.current + (t - lastTick) * 0.035);
      lastTick = t;
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [autoSpin, setAngle]);

  const halt = () => setAutoSpin(false);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button')) return;
    halt();
    drag.current = { active: true, lastX: e.clientX };
    viewer.current?.classList.add('is-dragging');
    try {
      viewer.current?.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already released.
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    setAngle(angle.current + (e.clientX - drag.current.lastX) * 0.62);
    drag.current.lastX = e.clientX;
  };
  const stopDrag = () => {
    drag.current.active = false;
    viewer.current?.classList.remove('is-dragging');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    halt();
    setAngle(angle.current + (e.key === 'ArrowLeft' ? -15 : 15), true);
  };
  const rotate = (deg: number | null) => {
    halt();
    setAngle(deg === null ? 0 : angle.current + deg, true);
  };

  return (
    <section id="experience" className="showcase">
      <div className="contain showcasegrid">
        <div className="showtext">
          <span className="caps">ALFA / PRODUCT STUDIO 001</span>
          <h2 className="display">A BETTER<br />WAY TO <span className="g">WEAR.</span></h2>
          <p>Explore the signature polo from front to back. Rich fabric texture, a refined collar and your new silver lion emblem—small, bold and premium.</p>
          <div className="swatcher">
            <b>EXPLORE COLOUR</b>
            {COLOURS.map((c) => (
              <button key={c.visual} className={'sw' + (c === colour ? ' active' : '')} title={c.title} aria-label={c.title} aria-pressed={c === colour} style={{ background: c.swatch }} onClick={() => setColour(c)}></button>
            ))}
          </div>
          <div className="show-note" id="colourname">{colour.name} / LION EMBLEM</div>
          <a className="mainbtn" href="#shop" id="poloedit" onClick={onShowPolos}>Discover this collection ↗</a>
        </div>
        <div
          className="showviewer"
          id="showviewer"
          ref={viewer}
          aria-label="Drag left or right to rotate the polo through 360 degrees"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onKeyDown={onKeyDown}
        >
          <div className="glow"></div>
          <div className="orbit"></div>
          <div className="turntable" id="turntable" ref={turntable}>
            <img className="turnface turnfront" id="shirt3d" src={`/assets/polo-${colour.visual}.png`} alt="ALFA premium polo with the silver lion chest emblem" />
            <img className="turnface turnback" id="shirtback" src={`/assets/polo-${colour.visual}-back-concept.png`} alt="Illustrated back view of ALFA polo" />
          </div>
          <span className="show-corner">360° TURNAROUND / CONCEPT</span>
          <div className="turncontrols">
            <button type="button" className="turnbtn" id="spinleft" aria-label="Rotate left" onClick={() => rotate(-45)}>↶</button>
            <button type="button" className="turnbtn" id="spinreset" aria-label="Reset to front" onClick={() => rotate(null)}>FRONT</button>
            <button type="button" className="turnbtn" id="spinright" aria-label="Rotate right" onClick={() => rotate(45)}>↷</button>
            <button type="button" className={'turnbtn' + (autoSpin ? ' playing' : '')} id="spinauto" aria-label="Auto rotate" aria-pressed={autoSpin} onClick={() => setAutoSpin((on) => !on)}>{autoSpin ? 'PAUSE' : 'AUTO SPIN'}</button>
          </div>
          <span className="draghint">↔ DRAG TO ROTATE · FRONT / BACK PREVIEW</span>
        </div>
      </div>
    </section>
  );
}
