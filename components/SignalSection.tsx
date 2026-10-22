'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import type { Content } from '@/lib/content';
import { plain } from '@/lib/rich';
import s from './SignalSection.module.css';

/* Схема «все разделы сходятся в одном расчёте»: дорожки с бегущими импульсами
   к центральному узлу, луч света, карточка с искрами и бегущие строки. */

type Pt = { x: number; y: number };
type Layout = { w: number; h: number; nodes: (Pt & { xm: number; ey: number })[]; vlines: number[] };

// Координаты в процентах; xm — где дорожка поворачивает, ey — где входит в узел.
const DESKTOP: Layout = {
  w: 1200, h: 460,
  nodes: [
    { x: 6, y: 18, xm: 26, ey: 40 }, { x: 2, y: 54, xm: 18, ey: 50 }, { x: 8, y: 88, xm: 31, ey: 60 },
    { x: 94, y: 18, xm: 74, ey: 40 }, { x: 98, y: 54, xm: 82, ey: 50 }, { x: 92, y: 88, xm: 69, ey: 60 },
  ],
  vlines: [46.5, 50, 53.5],
};
const MOBILE: Layout = {
  w: 360, h: 430,
  nodes: [
    { x: 2, y: 12, xm: 29, ey: 42 }, { x: 2, y: 50, xm: 20, ey: 50 }, { x: 2, y: 88, xm: 29, ey: 58 },
    { x: 98, y: 12, xm: 71, ey: 42 }, { x: 98, y: 50, xm: 80, ey: 50 }, { x: 98, y: 88, xm: 71, ey: 58 },
  ],
  vlines: [44, 50, 56],
};

/** Ортогональная дорожка со скруглёнными углами: от узла → поворот → вход в центр. */
function trace(l: Layout, n: Layout['nodes'][number]) {
  const X = (v: number) => (v * l.w) / 100, Y = (v: number) => (v * l.h) / 100;
  const x0 = X(n.x), y0 = Y(n.y), xm = X(n.xm), ey = Y(n.ey), xc = X(50);
  if (Math.abs(y0 - ey) < 1) return `M${x0} ${y0}H${xc}`;
  const r = Math.min(10, Math.abs(ey - y0) / 2), dx = Math.sign(xm - x0), dy = Math.sign(ey - y0), dx2 = Math.sign(xc - xm);
  return `M${x0} ${y0}H${xm - dx * r}Q${xm} ${y0} ${xm} ${y0 + dy * r}V${ey - dy * r}Q${xm} ${ey} ${xm + dx2 * r} ${ey}H${xc}`;
}

type P = [number, number];

/** Точки ломаной для импульса (углы без скругления — на скорости незаметно). */
function routes(l: Layout, count: number) {
  const X = (v: number) => (v * l.w) / 100, Y = (v: number) => (v * l.h) / 100;
  const ins: P[][] = l.nodes.slice(0, count).map(n => Math.abs(n.y - n.ey) < .5
    ? [[X(n.x), Y(n.y)], [X(50), Y(n.ey)]]
    : [[X(n.x), Y(n.y)], [X(n.xm), Y(n.y)], [X(n.xm), Y(n.ey)], [X(50), Y(n.ey)]]);
  const up: P[][] = l.vlines.map(x => [[X(x), -60], [X(x), Y(50)]]);
  const down: P[][] = l.vlines.map(x => [[X(x), Y(50)], [X(x), l.h + 70]]);
  return [...ins.map((pts, i) => ({ pts, dur: 2800 + (i % 3) * 500, delay: 1200 + ((i * 830) % 3000) })),
    ...up.map((pts, i) => ({ pts, dur: 3400, delay: 1600 + i * 900 })),
    ...down.map((pts, i) => ({ pts, dur: 3100, delay: 2400 + i * 700 }))];
}

/** Анимация только transform/opacity через Web Animations — идёт на видеокарте,
    не перерисовывает страницу и не дёргается, даже если основной поток занят. */
function animatePulse(el: HTMLElement, pts: P[], dur: number, delay: number) {
  const seg = pts.slice(1).map((p, i) => {
    const [x0, y0] = pts[i], len = Math.hypot(p[0] - x0, p[1] - y0);
    return { from: pts[i], to: p, len, ang: Math.atan2(p[1] - y0, p[0] - x0) * 180 / Math.PI };
  });
  const total = seg.reduce((a, s) => a + s.len, 0), travel = .6;
  const tf = (p: P, a: number) => `translate3d(${p[0]}px,${p[1]}px,0) rotate(${a}deg)`;
  const frames: Keyframe[] = [];
  let run = 0;
  seg.forEach(sg => {
    frames.push({ offset: run / total * travel, transform: tf(sg.from, sg.ang) });
    run += sg.len;
    frames.push({ offset: run / total * travel, transform: tf(sg.to, sg.ang) });
  });
  const last = seg[seg.length - 1];
  frames.push({ offset: 1, transform: tf(last.to, last.ang) });
  const opts: KeyframeAnimationOptions = { duration: dur, delay, iterations: Infinity, fill: 'both' };
  return [
    el.animate(frames, opts),
    el.animate([{ opacity: 0 }, { opacity: 1, offset: .05 }, { opacity: 1, offset: travel - .04 }, { opacity: 0, offset: travel }, { opacity: 0 }], opts),
  ];
}

function Network({ l, cls, count, run }: { l: Layout; cls: string; count: number; run: 'off' | 'play' | 'pause' }) {
  const X = (v: number) => (v * l.w) / 100, Y = (v: number) => (v * l.h) / 100;
  const paths = l.nodes.slice(0, count).map(n => trace(l, n));
  const down = l.vlines.map(x => `M${X(x)} ${Y(50)}V${l.h}`);
  const up = l.vlines.map(x => `M${X(x)} 0V${Y(50)}`);
  // Тупиковые «дорожки платы» — фон, без импульсов.
  const stubs = [
    `M${X(18)} ${Y(8)}H${X(36)}V${Y(24)}`, `M${X(82)} ${Y(8)}H${X(64)}V${Y(24)}`,
    `M${X(14)} ${Y(72)}H${X(38)}`, `M${X(86)} ${Y(72)}H${X(62)}`,
    `M${X(40)} ${Y(96)}V${Y(80)}H${X(44)}`, `M${X(60)} ${Y(96)}V${Y(80)}H${X(56)}`,
  ];
  const box = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const anims = useRef<Animation[]>([]);
  const list = routes(l, count);

  // Слой импульсов рисуется в «родных» координатах схемы и масштабируется целиком.
  useEffect(() => {
    const b = box.current, st = stage.current;
    if (!b || !st) return;
    const ro = new ResizeObserver(() => { st.style.transform = `scale(${b.clientWidth / l.w})`; });
    ro.observe(b);
    return () => ro.disconnect();
  }, [l.w]);

  useEffect(() => {
    const st = stage.current;
    if (!st || run === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!anims.current.length) {
      Array.from(st.children).forEach((el, i) => { const r = list[i]; if (r) anims.current.push(...animatePulse(el as HTMLElement, r.pts, r.dur, r.delay)); });
    }
    anims.current.forEach(a => (run === 'play' ? a.play() : a.pause()));
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { anims.current.forEach(a => a.cancel()); anims.current = []; }, []);

  return <div ref={box} className={`${s.layer} ${cls}`} aria-hidden="true">
    <svg className={s.svg} viewBox={`0 0 ${l.w} ${l.h}`}>
      <g className={s.stubs}>{stubs.map((d, i) => <path key={i} d={d} pathLength={1000} />)}</g>
      <g className={s.traces}>{[...paths, ...up, ...down].map((d, i) => <path key={i} d={d} pathLength={1000} style={{ transitionDelay: `${i * 70}ms` }} />)}</g>
    </svg>
    <div className={s.pulseClip}><div ref={stage} className={s.stage} style={{ width: l.w, height: l.h }}>
      {list.map((_, i) => <i key={i} className={s.pulse} />)}
    </div></div>
  </div>;
}

/** Искры, поднимающиеся над тёплым градиентом. Рисуем только когда карточка видна. */
function Sparks() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, visible = false;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const resize = () => { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const make = (anywhere: boolean) => ({ x: Math.random() * w, y: anywhere ? Math.random() * h : h + 5, v: .15 + Math.random() * .55, r: .4 + Math.random() * 1.4, a: .25 + Math.random() * .75, drift: (Math.random() - .5) * .25, t: Math.random() * 6.28 });
    resize();
    const sparks = Array.from({ length: 50 }, () => make(true));
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of sparks) {
        p.y -= p.v; p.t += .03; p.x += p.drift + Math.sin(p.t) * .15;
        if (p.y < -5) Object.assign(p, make(false));
        const life = Math.min(1, p.y / h * 1.4);
        ctx.globalAlpha = p.a * life * (.6 + .4 * Math.sin(p.t * 2));
        ctx.fillStyle = p.r > 1.2 ? '#ffd2a1' : '#ff9a4d';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    addEventListener('resize', resize);
    return () => { io.disconnect(); cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className={s.sparks} aria-hidden="true" />;
}

/** Фразы появляются по словам (как «Speed Up AI, Reduce Latency» в референсе). */
function WordCycle({ phrases }: { phrases: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || phrases.length < 2) return;
    const id = setInterval(() => setI(v => (v + 1) % phrases.length), 3600);
    return () => clearInterval(id);
  }, [phrases.length]);
  return <span className={s.words} aria-live="off">
    {phrases[i].split(' ').map((w, k) => <span key={`${i}-${k}`} style={{ animationDelay: `${k * 110}ms` }}>{w}&nbsp;</span>)}
  </span>;
}

export default function SignalSection({ content: c }: { content: Content }) {
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { setInView(e.isIntersecting); if (e.isIntersecting) setOn(true); }, { threshold: .15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Пятно света за курсором: двигаем transform раз в кадр, без перерисовки панели.
  const spot = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => { if (spot.current) spot.current.style.transform = `translate3d(${x - 300}px,${y - 300}px,0)`; });
  };

  const run = !on ? 'off' : inView ? 'play' : 'pause';
  const services = c.services.items.slice(0, 6);
  const title = [c.scene3.line1, c.scene3.line2, c.scene3.line3].map(plain).join(' ');
  const tags = [...c.services.items.map(i => i.title), ...c.why.items.map(i => i.title)];
  const rows = [tags, [...tags].reverse(), [...tags.slice(3), ...tags.slice(0, 3)]];
  const phrases = ['Точный расчёт.', 'Надёжные узлы.', 'Спокойная экспертиза.', 'Конструкции на века.'];
  const glyphs = ['▦', '⌗', '▤', '≋', '◎', '◇', '△', '▣'];

  return <section ref={root} className={`${s.wrap} ${on ? s.on : ''} ${inView ? '' : s.paused}`} aria-labelledby="signal-title">
    <div className={s.panel} onPointerMove={onMove}>
      <div className={s.beam} aria-hidden="true" />
      <div ref={spot} className={s.spot} aria-hidden="true" />
      <div className={s.head}>
        <p className={s.badge}><i />{c.scene3.button.replace(/[→↗]/g, '').trim() || 'УСЛУГИ'} · CULMANN</p>
        <h2 id="signal-title" aria-label={title}>{title.split(/\s+/).map((w, i) => <Fragment key={i}><span className={s.mask} aria-hidden="true"><span style={{ transitionDelay: `${150 + i * 90}ms` }}>{w}</span></span> </Fragment>)}</h2>
        <p className={s.lead}>{c.scene3.p1}</p>
        <div className={s.ctas}><a className={s.primary} href="#inquiry">Обсудить проект <span>↗</span></a><a className={s.ghost} href="#expertise">Все услуги</a></div>
      </div>
      <div className={s.net}>
        <Network l={DESKTOP} cls={s.desk} count={services.length} run={run} />
        <Network l={MOBILE} cls={s.mob} count={services.length} run={run} />
        <div className={s.fade} aria-hidden="true" />
        {services.map((item, i) => {
          const d = DESKTOP.nodes[i], m = MOBILE.nodes[i], right = i >= 3;
          return <a key={i} href="#expertise" className={`${s.node} ${right ? s.right : ''}`} title={item.title}
            style={{ '--x': `${right ? 100 - d.x : d.x}%`, '--y': `${d.y}%`, '--mx': `${right ? 100 - m.x : m.x}%`, '--my': `${m.y}%`, transitionDelay: `${500 + i * 90}ms` } as React.CSSProperties}>
            <b>{glyphs[i % glyphs.length]}</b><span>{item.code.split(' ')[0]}</span>
          </a>;
        })}
        <div className={s.chip}><span className={s.glow} aria-hidden="true" /><span className={s.chipCore}><i className={s.ring} aria-hidden="true" /><small>CULMANN</small>РАСЧЁТ</span></div>
      </div>
    </div>

    <div className={s.duo}>
      <div className={s.flame}>
        <Sparks />
        <div className={s.flameGrid} aria-hidden="true" />
        <div className={s.rays} aria-hidden="true"><i /><i /><i /></div>
        <p className={s.flameText}>{plain(c.projects.captionTitle)}:<br /><WordCycle phrases={phrases} /></p>
      </div>
      <div className={s.info}>
        <h3>{c.scene3.p2}</h3>
        <p>{c.services.note}</p>
        <div className={s.marquee} aria-hidden="true">
          {rows.map((row, r) => <div key={r} className={s.row} style={{ animationDuration: `${38 + r * 9}s`, animationDirection: r % 2 ? 'reverse' : 'normal' }}>
            {[...row, ...row].map((t, i) => <span key={i} className={s.tag}><b>{glyphs[(i + r) % glyphs.length]}</b>{t}</span>)}
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}
