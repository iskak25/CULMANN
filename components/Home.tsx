'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { css } from '@/lib/css';
import { rich, plain } from '@/lib/rich';
import type { Content } from '@/lib/content';
import { parseVideo } from '@/lib/video';
import Building, { GEO } from './Building';

type Theme = 'dark' | 'light';
type Els = Record<string, HTMLElement[]>;

const TOPICS = ['Проектирование', 'Обследование', 'Тендер', 'Вакансия', 'Другое'];

const GRAIN = {
  position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, opacity: 'var(--grain)',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
} as React.CSSProperties;

const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (v: number) => v * v * (3 - 2 * v);
const seg = (t: number, a: number, b: number) => sm(cl((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export default function Home({ content: c }: { content: Content }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<'ru' | 'kg'>('ru');
  const [active, setActive] = useState(1);
  const [topic, setTopic] = useState(0);
  const [sent, setSent] = useState(false);
  const notSent = !sent;
  const [playing, setPlaying] = useState(false);
  const video = parseVideo(c.projects.videoUrl);

  /* mutable-состояние сцен (аналог полей класса Component в макете) */
  const S = useRef<{ E: Els; narrow: boolean; autoOn: boolean }>({ E: {}, narrow: false, autoOn: false });

  /* ---------- Тема ---------- */
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === 'light' || t === 'dark') setTheme(t);
  }, []);
  const setThemeSaved = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    setTheme(t);
    try { document.cookie = `culmann-theme=${t};path=/;max-age=31536000;samesite=lax`; } catch {}
  }, []);
  const toggleTheme = () => setThemeSaved(theme === 'dark' ? 'light' : 'dark');
  const themeTitle = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';

  /* ---------- Лента «Почему мы» ---------- */
  const scrollTrack = (i: number) => {
    const tr = S.current.E.track?.[0];
    const card = tr?.children[i] as HTMLElement | undefined;
    if (tr && card) tr.scrollTo({ left: card.offsetLeft - tr.offsetLeft, behavior: 'smooth' });
  };
  const n = c.why.items.length;
  const prev = () => { const i = (active - 1 + n) % n; setActive(i); scrollTrack(Math.max(0, i - 1)); };
  const next = () => { const i = (active + 1) % n; setActive(i); scrollTrack(Math.max(0, i - 1)); };
  const why = c.why.items.map(({ title: t, text: d }, i) => {
    const on = i === active;
    return {
      n: String(i + 1).padStart(2, '0'), t, d,
      bg: on ? 'var(--inv-bg)' : 'var(--surface)', fg: on ? 'var(--inv-fg)' : 'var(--text)',
      mut: on ? 'var(--inv-muted)' : 'var(--muted)', num: on ? 'var(--accent)' : 'var(--text)',
      bd: on ? 'var(--inv-bg)' : 'var(--border)', pick: () => setActive(i),
    };
  });
  const DOC_COLOR = { ok: '#5FA86B', soon: 'var(--accent)', muted: 'var(--muted)' } as const;
  const docs = c.docs.items.map((d) => ({ t: d.title, n: d.number, s: d.status, c: DOC_COLOR[d.state] }));
  const serviceCells: (Content['services']['items'][number] | 'note')[] = [...c.services.items];
  serviceCells.splice(Math.min(2, serviceCells.length), 0, 'note');
  const topics = TOPICS.map((label, i) => ({
    label, bg: i === topic ? 'var(--accent)' : 'transparent', fg: i === topic ? 'var(--bg)' : 'var(--text)',
    bd: i === topic ? 'var(--accent)' : 'var(--hair)', pick: () => setTopic(i),
  }));
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true); setFormError('');
    try {
      const r = await fetch('/api/lead', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.get('name'), contact: fd.get('contact'), org: fd.get('org'), message: fd.get('message'), website: fd.get('website'), topic: TOPICS[topic] }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Не удалось отправить');
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось отправить');
    } finally { setSending(false); }
  };
  const reset = () => setSent(false);

  const setRu = () => setLang('ru');
  const setKg = () => setLang('kg');
  const ruBg = lang === 'ru' ? 'var(--text)' : 'transparent';
  const ruFg = lang === 'ru' ? 'var(--bg)' : 'var(--muted)';
  const kgBg = lang === 'kg' ? 'var(--text)' : 'transparent';
  const kgFg = lang === 'kg' ? 'var(--bg)' : 'var(--muted)';

  /* ---------- Переход к сцене по клику на штрих ---------- */
  const goScene = (k: number) => {
    S.current.autoOn = false;
    const pin = S.current.E.pin?.[0];
    if (!pin) return;
    const range = pin.offsetHeight - innerHeight;
    window.scrollTo({ top: pin.offsetTop + (k / 2) * range, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const go0 = () => goScene(0), go1 = () => goScene(1), go2 = () => goScene(2);

  /* ======================================================================
     Сцены первого экрана и переходы между секциями (перенос из макета)
     ====================================================================== */
  useEffect(() => {
    const st = S.current;
    const E: Els = {};
    document.querySelectorAll<HTMLElement>('[data-a]').forEach((el) => { (E[el.dataset.a!] = E[el.dataset.a!] || []).push(el); });
    st.E = E;

    const layout = () => {
      const narrow = innerWidth < 820;
      st.narrow = narrow;
      if (E.nav) E.nav[0].style.display = innerWidth < 1180 ? 'none' : 'flex';
      const s = E.stage[0].style;
      if (narrow) { s.left = '0'; s.bottom = '42%'; } else { s.left = '36%'; s.bottom = '0'; }
      E.scene.forEach((el, i) => { el.style.justifyContent = narrow ? 'flex-end' : i === 2 ? 'space-between' : 'center'; });
    };

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const pin = E.pin[0], r = pin.getBoundingClientRect(), vh = innerHeight;
      const range = r.height - vh;
      const p = range > 0 ? cl(-r.top / range) : 0;
      const t = p * 2;

      const sw = E.stage[0].clientWidth, sh = E.stage[0].clientHeight;
      const bs = cl(Math.min(sh / 760, sw / 640), 0.25, 1.1);
      const A = st.narrow ? [[.5, .95], [.58, 1.05], [.6, .45]] : [[.5, .84], [.6, .98], [.55, .36]];
      const e1 = seg(t, 0, 1), e2 = seg(t, 1, 2);
      const ax = (t <= 1 ? lerp(A[0][0], A[1][0], e1) : lerp(A[1][0], A[2][0], e2)) * sw;
      const ay = (t <= 1 ? lerp(A[0][1], A[1][1], e1) : lerp(A[1][1], A[2][1], e2)) * sh;
      const s = bs * (t <= 1 ? lerp(1, 1.25, e1) : lerp(1.25, st.narrow ? 1.85 : 2.7, e2));
      const k = seg(t, 1.1, 1.9);
      const g = GEO;
      const ry = -28 - 15 * (t / 2), rx = -7 - 4 * (t / 2);
      E.anchor[0].style.transform = `translate3d(${ax}px,${ay}px,0)`;
      const b = E.bld[0];
      b.style.transform = `scale3d(${s},${s},${s}) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${-g.jx * k}px,${-g.jy * k}px,${-g.jz * k}px)`;
      b.style.setProperty('--fac', (1 - seg(t, 0.25, 0.85)).toFixed(3));
      b.style.setProperty('--frm', seg(t, 0.2, 0.8).toFixed(3));

      const rw = 640 * bs, rh = 190 * bs;
      let cx: number, cy: number, sc: number, o: number, rot: number;
      if (t < 1.05) {
        const a = seg(t, 0.1, 0.7);
        cx = A[0][0] * sw + 140 * a; cy = A[0][1] * sh - g.H * bs * 0.55 + 90 * a; sc = 1 - 0.4 * a; o = 1 - a; rot = -10;
      } else {
        const q = seg(t, 1.35, 1.9);
        cx = A[2][0] * sw + 40; cy = A[2][1] * sh - 20; sc = 0.6 + 0.5 * q; o = q; rot = -18;
      }
      E.ring.forEach((el) => {
        el.style.width = rw + 'px'; el.style.height = rh + 'px';
        el.style.transform = `translate(${cx - rw / 2}px,${cy - rh / 2}px) rotate(${rot}deg) scale(${sc})`;
        el.style.opacity = String(o * seg(t, 0.25, 0.8));
      });
      const co = E.callout[0];
      co.style.transform = `translate(${A[2][0] * sw}px,${A[2][1] * sh}px)`;
      co.style.opacity = String(seg(t, 1.75, 2));

      E.s1l.forEach((el, i) => {
        const v = 1 - seg(t, 0.05 + i * 0.04, 0.45 + i * 0.04);
        el.style.opacity = String(v); el.style.transform = `translateY(${-24 * (1 - v)}px)`;
      });
      E.s1x.forEach((el, i) => {
        const v = 1 - seg(t, 0.1 + i * 0.03, 0.5 + i * 0.03);
        el.style.opacity = String(v); el.style.transform = `translateY(${-20 * (1 - v)}px)`;
      });

      const out2 = seg(t, 1.15, 1.45);
      E.s2wrap[0].style.transform = `translateY(${-(t - 0.8) * 60 * 0.6 - out2 * 60}px)`;
      E.s2f.forEach((el, i) => { el.style.opacity = String(seg(t, 0.55 + i * 0.1, 0.9 + i * 0.1) * (1 - out2)); });
      E.s2m.forEach((el, i) => {
        const fi = Math.floor(i / 2);
        const v = seg(t, 0.55 + fi * 0.1 + (i % 2) * 0.05, 0.9 + fi * 0.1 + (i % 2) * 0.05);
        el.style.transform = `translateY(${(1 - v) * 110}%)`;
      });

      E.s3l.forEach((el, i) => { const v = seg(t, 1.45 + i * 0.07, 1.8 + i * 0.07); el.style.transform = `translateY(${(1 - v) * 110}%)`; });
      const c3 = seg(t, 1.72, 1.97);
      E.s3c[0].style.opacity = String(c3); E.s3c[0].style.transform = `translateY(${(1 - c3) * 24}px)`;

      const act = t < 0.5 ? 0 : t < 1.5 ? 1 : 2;
      E.scene.forEach((el, i) => {
        el.style.visibility = (i === 0 ? t < 0.8 : i === 1 ? t > 0.4 && t < 1.6 : t > 1.3) ? 'visible' : 'hidden';
        el.inert = i !== act;
        el.setAttribute('aria-hidden', String(i !== act));
      });
      E.ind.forEach((el, i) => el.parentElement?.setAttribute('aria-pressed', String(i === act)));
      E.ind.forEach((el, i) => { el.style.width = i === act ? '36px' : '16px'; el.style.background = i === act ? 'var(--accent)' : 'var(--muted)'; });
      E.hint[0].style.opacity = vh < 720 ? '0' : String(1 - seg(p, 0, 0.04));
      E.hdrbg[0].style.opacity = r.top < -24 ? '1' : '0';
    };

    /* Переходы между секциями: появление, параллакс, наложение (GSAP ScrollTrigger) */
    gsap.registerPlugin(ScrollTrigger);
    let mm: gsap.MatchMedia | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const initGsap = () => {
      const main = document.querySelector('main'); if (!main) return;
      const secs = Array.from(main.children).filter((el) => el.tagName === 'SECTION') as HTMLElement[];
      const footer = Array.from(main.children).find((el) => el.tagName === 'FOOTER') as HTMLElement | undefined;
      const pad = 'clamp(20px,5vw,80px)', side = `max(${pad}, calc((100% - 1280px) / 2 + ${pad}))`;
      secs.forEach((sec) => {
        Object.assign(sec.style, { maxWidth: 'none', margin: '0', paddingLeft: side, paddingRight: side, position: 'relative' });
        if (sec.style.paddingBottom === '0px') sec.style.paddingBottom = 'clamp(64px,8vw,112px)';
      });
      if (footer) Object.assign(footer.style, { position: 'relative', zIndex: String(2 + secs.length), background: 'var(--bg)' });
      const byId = (id: string) => secs.find((x) => x.id === id);
      const whySec = secs.find((x) => x.dataset.screenLabel === '03 Почему мы');
      mm = gsap.matchMedia();
      mm.add({ motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
        const { motion } = ctx.conditions as { motion: boolean };
        if (!motion) return;
        const groups: Element[][] = [];
        const about = byId('about');
        if (about) { groups.push([...about.children[0].children]); groups.push([...about.children[1].children]); }
        if (whySec) { groups.push([whySec.children[0]]); groups.push([...whySec.children[1].children]); }
        const sv = byId('services'); if (sv) { groups.push([sv.children[0]]); groups.push([...sv.children[1].children]); }
        const pj = byId('projects');
        if (pj) { groups.push([pj.children[0]]); groups.push([...pj.children[1].children]); groups.push([pj.children[2]]); groups.push([pj.children[3]]); }
        const dc = byId('docs');
        if (dc) { const fr = dc.children[0]; groups.push([fr.children[0]]); groups.push([...fr.children[1].children[0].children, fr.children[1].children[1]]); }
        const ct = byId('contacts'); if (ct) groups.push([...ct.children]);
        if (footer) groups.push([...footer.children[0].children]);
        groups.forEach((gr) => {
          gr = gr.filter(Boolean); if (!gr.length) return;
          gr.forEach((el, i) => gsap.from(el, { y: 28, opacity: 0, duration: 0.65, delay: Math.min(i * 0.06, 0.18), ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 96%', once: true } }));
        });
      });
      [300, 1200].forEach((ms) => timers.push(setTimeout(() => ScrollTrigger.refresh(), ms)));
      document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    };

    /* Режим презентации: ?autoplay — страница сама прокручивает сцены (цикл 12 с) */
    let autoFrame = 0;
    const startAuto = () => {
      st.autoOn = true; const t0 = performance.now();
      const step = (now: number) => {
        if (!st.autoOn) return;
        const pin = E.pin[0], range = pin.offsetHeight - innerHeight;
        const ph = ((now - t0) % 12000) / 12000;
        const p = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        window.scrollTo(0, pin.offsetTop + p * range);
        autoFrame = requestAnimationFrame(step);
      };
      autoFrame = requestAnimationFrame(step);
    };

    let alive = true, frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; if (alive) update(); });
    };
    const onResize = () => { layout(); update(); };
    const stopAuto = () => { st.autoOn = false; cancelAnimationFrame(autoFrame); };
    const onMotionChange = () => { if (motion.matches) stopAuto(); update(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('wheel', stopAuto, { passive: true });
    window.addEventListener('touchstart', stopAuto, { passive: true });
    window.addEventListener('keydown', stopAuto);
    motion.addEventListener('change', onMotionChange);
    layout(); update();
    initGsap();

    const resizeObserver = new ResizeObserver(onScroll);
    resizeObserver.observe(E.stage[0]);
    resizeObserver.observe(E.pin[0]);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      E.stage[0].style.setProperty('--orbit-state', entry.isIntersecting && !document.hidden ? 'running' : 'paused');
    });
    visibilityObserver.observe(E.pin[0]);
    const onVisibility = () => {
      const rect = E.pin[0].getBoundingClientRect();
      E.stage[0].style.setProperty('--orbit-state', !document.hidden && rect.bottom > 0 && rect.top < innerHeight ? 'running' : 'paused');
      if (document.hidden) stopAuto(); else onScroll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    if (/[?&]autoplay/.test(location.search) && !motion.matches) startAuto();

    return () => {
      alive = false; stopAuto(); cancelAnimationFrame(frame); timers.forEach(clearTimeout);
      resizeObserver.disconnect(); visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotionChange);
      window.removeEventListener('keydown', stopAuto);
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize);
      window.removeEventListener('wheel', stopAuto); window.removeEventListener('touchstart', stopAuto);
      mm?.revert();
    };
  }, []);

  return (
    <>
      <div style={css('position:fixed;inset:0;pointer-events:none;z-index:0;display:grid;grid-template-columns:repeat(6,1fr);padding:0 clamp(20px,5vw,80px)')}>
        <div style={css('border-left:1px solid var(--line)')} /><div style={css('border-left:1px solid var(--line)')} /><div style={css('border-left:1px solid var(--line)')} /><div style={css('border-left:1px solid var(--line)')} /><div style={css('border-left:1px solid var(--line)')} /><div style={css('border-left:1px solid var(--line);border-right:1px solid var(--line)')} />
      </div>
      <div className="site-grain" style={GRAIN} />
<header style={css("color:var(--text);position:fixed;top:0;left:0;right:0;z-index:50;padding:18px clamp(20px,5vw,80px);display:flex;align-items:center;justify-content:space-between;gap:20px")}>
  <div data-a="hdrbg" style={css("position:absolute;inset:0;background:var(--hdr);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--hair);opacity:0;transition:opacity .35s")}></div>
  <a href="#top" style={css("position:relative;display:flex;align-items:center;gap:12px;color:var(--text)")}>
    <div style={css("width:14px;height:14px;border:1.5px solid var(--accent);transform:rotate(45deg)")}></div>
    <div style={css("font:500 15px/1 Manrope;letter-spacing:.32em")}>CULMANN</div>
  </a>
  <nav data-a="nav" style={css("position:relative;display:flex;gap:2px;padding:4px;border:1px solid var(--hair);border-radius:999px;font:500 12px/1 Manrope;white-space:nowrap;justify-content:center")}>
    <a href="#top" style={css("padding:9px 14px;border-radius:999px;background:var(--text);color:var(--bg)")}>Главная</a>
    <a href="#about" style={css("padding:9px 12px;color:var(--muted)")} className="nl">О компании</a>
    <a href="#services" style={css("padding:9px 12px;color:var(--muted)")} className="nl">Услуги</a>
    <a href="#projects" style={css("padding:9px 12px;color:var(--muted)")} className="nl">Проекты</a>
    <a href="#docs" style={css("padding:9px 12px;color:var(--muted)")} className="nl">Тендеры</a>
    <a href="#docs" style={css("padding:9px 12px;color:var(--muted)")} className="nl">Документы</a>
    <a href="#contacts" style={css("padding:9px 12px;color:var(--muted)")} className="nl">Контакты</a>
  </nav>
  <div style={css("position:relative;display:flex;align-items:center;gap:10px")}>
    <div style={css("display:flex;font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.08em;border:1px solid var(--hair);border-radius:999px;padding:3px")}>
      <button onClick={setRu} style={css(`all:unset;cursor:pointer;padding:8px 10px;border-radius:999px;background:${ruBg};color:${ruFg}`)}>RU</button>
      <button onClick={setKg} style={css(`all:unset;cursor:pointer;padding:8px 10px;border-radius:999px;background:${kgBg};color:${kgFg}`)}>KG</button>
    </div>
    <button onClick={toggleTheme} title={themeTitle} style={css("all:unset;cursor:pointer;width:38px;height:38px;border:1px solid var(--hair);border-radius:50%;display:grid;place-items:center;color:var(--text)")}>
      <div style={css("width:14px;height:14px;border-radius:50%;border:1.5px solid currentColor;background:linear-gradient(90deg,currentColor 50%,transparent 50%)")}></div>
    </button>
    <a href="#contacts" style={css("padding:12px 18px;border-radius:999px;background:var(--btn-bg);color:var(--btn-fg);font:600 12px/1 Manrope;box-shadow:var(--glow)")}>Связаться</a>
  </div>
</header>

<section id="top" data-a="pin" data-screen-label="01 Первый экран" style={css("color:var(--text);position:relative;height:280svh;z-index:1")}>
  <div style={css("position:sticky;top:0;height:100vh;overflow:hidden;background:var(--hero-bg)")}>
    <div data-a="stage" style={css("position:absolute;left:36%;top:0;right:0;bottom:0;perspective:1800px")}>
      <div data-a="ring" style={css("position:absolute;left:0;top:0;width:640px;height:190px;border:1.5px solid var(--accent);border-radius:50%;box-shadow:var(--glow);z-index:0;will-change:transform,opacity")}></div>
      <div className="building-orbit" style={css("position:absolute;inset:0;z-index:1;transform-style:preserve-3d")}><Building /></div>
      <div data-a="ring" style={css("position:absolute;left:0;top:0;width:640px;height:190px;border:1.5px solid var(--accent);border-radius:50%;box-shadow:var(--glow);z-index:2;clip-path:polygon(0 0,38% 0,38% 100%,0 100%);will-change:transform,opacity")}></div>
      <div data-a="callout" style={css("position:absolute;left:0;top:0;z-index:3;opacity:0;pointer-events:none")}>
        <div style={css("position:absolute;left:-34px;top:-34px;width:68px;height:68px;border-radius:50%;border:1px solid var(--accent);box-shadow:var(--glow)")}></div>
        <div style={css("position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--accent)")}></div>
        <div style={css("position:absolute;right:34px;top:0;width:72px;border-top:1px solid var(--accent)")}></div>
        <div style={css("position:absolute;right:114px;top:-9px;width:max-content;max-width:220px;text-align:right;font:500 11px/1.4 'IBM Plex Mono',monospace;letter-spacing:.06em;color:var(--text)")}>УЗЕЛ «КОЛОННА — ПЛИТА»<br /><span style={css("color:var(--muted)")}>армирование · расчёт на продавливание</span></div>
      </div>
    </div>

    <div data-a="scene" style={css("position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;justify-content:center;padding:96px clamp(24px,7vw,120px) 80px;pointer-events:none")}>
      <div style={css("max-width:min(640px,52vw);display:flex;flex-direction:column;gap:28px")}>
        <div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.14em;color:var(--muted)")} data-a="s1x">{c.hero.label}</div>
        <h1 aria-label={plain(`${c.hero.line1} ${c.hero.line2} ${c.hero.line3}`)} style={css("margin:0;font:300 clamp(44px,6.2vw,96px)/1.02 Manrope;letter-spacing:-.035em;text-wrap:balance")}>
          <div data-a="s1l">{rich(c.hero.line1)}</div>
          <div data-a="s1l">{rich(c.hero.line2)}</div>
          <div data-a="s1l">{rich(c.hero.line3)}</div>
        </h1>
        <div data-a="s1x" style={css("width:56px;border-top:1px solid var(--muted)")}></div>
        <p data-a="s1x" style={css("margin:0;max-width:360px;font:400 16px/1.6 Manrope;color:var(--muted);text-wrap:pretty")}>{c.hero.lead}</p>
        <a data-a="s1x" href="#projects" style={css("display:flex;align-items:center;gap:16px;color:var(--text);font:500 12px/1 Manrope;letter-spacing:.14em;pointer-events:auto;width:max-content")}>
          <div style={css("width:52px;height:52px;border-radius:50%;border:1px solid var(--accent);display:grid;place-items:center;color:var(--accent);font-size:18px;box-shadow:var(--glow)")}>→</div>{c.hero.cta}
        </a>
      </div>
    </div>

    <div data-a="scene" style={css("position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;justify-content:center;padding:96px clamp(24px,7vw,120px) 80px;pointer-events:none")}>
      <div data-a="s2wrap" style={css("max-width:380px;display:flex;flex-direction:column;gap:40px")}>
        {c.hero.facts.map((f, i) => (
          <div key={i} data-a="s2f" style={css("opacity:0;display:flex;flex-direction:column;gap:10px")}>
            <div style={css("overflow:hidden")}><div data-a="s2m" style={css("font:300 clamp(30px,3vw,40px)/1.05 Manrope;letter-spacing:-.02em")}>{rich(f.head)}</div></div>
            <div style={css("overflow:hidden")}><div data-a="s2m" style={css("font:400 15px/1.55 Manrope;color:var(--muted)")}>{f.text}</div></div>
          </div>
        ))}
      </div>
    </div>

    <div data-a="scene" style={css("position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;justify-content:space-between;padding:128px clamp(24px,7vw,120px) 72px;pointer-events:none")}>
      <h2 aria-label={plain(`${c.scene3.line1} ${c.scene3.line2} ${c.scene3.line3}`)} style={css("margin:0;font:300 clamp(44px,5.4vw,84px)/1.02 Manrope;letter-spacing:-.035em")}>
        <div style={css("overflow:hidden;padding-bottom:.06em")}><div data-a="s3l">{c.scene3.line1}</div></div>
        <div style={css("overflow:hidden;padding-bottom:.06em")}><div data-a="s3l">{c.scene3.line2}</div></div>
        <div style={css("overflow:hidden;padding-bottom:.06em")}><div data-a="s3l" style={css("color:var(--accent)")}>{c.scene3.line3}</div></div>
      </h2>
      <div data-a="s3c" style={css("opacity:0;align-self:flex-end;display:flex;flex-wrap:wrap;gap:32px;align-items:flex-end;max-width:640px")}>
        <p style={css("margin:0;flex:1 1 200px;font:400 14px/1.6 Manrope;color:var(--muted)")}>{c.scene3.p1}</p>
        <p style={css("margin:0;flex:1 1 200px;font:400 14px/1.6 Manrope;color:var(--muted)")}>{c.scene3.p2}</p>
        <a href="#services" style={css("pointer-events:auto;padding:16px 26px;border-radius:999px;border:1px solid var(--accent);color:var(--text);font:500 12px/1 Manrope;letter-spacing:.14em")}>{c.scene3.button}</a>
      </div>
    </div>


    <div style={css("position:absolute;left:clamp(10px,2.2vw,36px);top:50%;transform:translateY(-50%);z-index:6;display:flex;flex-direction:column;gap:14px")}>
      <button onClick={go0} aria-label="Сцена 1" style={css("all:unset;cursor:pointer;padding:6px 0")}><div data-a="ind" style={css("height:2px;width:36px;background:var(--accent);transition:width .35s,background-color .35s")}></div></button>
      <button onClick={go1} aria-label="Сцена 2" style={css("all:unset;cursor:pointer;padding:6px 0")}><div data-a="ind" style={css("height:2px;width:16px;background:var(--muted);transition:width .35s,background-color .35s")}></div></button>
      <button onClick={go2} aria-label="Сцена 3" style={css("all:unset;cursor:pointer;padding:6px 0")}><div data-a="ind" style={css("height:2px;width:16px;background:var(--muted);transition:width .35s,background-color .35s")}></div></button>
    </div>

    <div data-a="hint" style={css("position:absolute;left:clamp(24px,7vw,120px);bottom:28px;z-index:6;display:flex;flex-direction:column;gap:12px;font:500 10px/1 'IBM Plex Mono',monospace;letter-spacing:.18em;color:var(--muted)")}>
      ПРОКРУТИТЕ
      <div style={css("width:1px;height:44px;background:linear-gradient(var(--accent),transparent);box-shadow:var(--glow)")}></div>
    </div>
  </div>
</section>

<main style={css("color:var(--text);position:relative;z-index:1;background:var(--bg)")}>
  <section id="about" data-screen-label="02 О компании" style={css("padding:clamp(80px,12vw,160px) clamp(20px,5vw,80px) 0;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:72px")}>
    <div style={css("display:flex;flex-wrap:wrap;gap:40px 64px;align-items:flex-start")}>
      <div style={css("flex:0 1 220px;display:flex;gap:12px;font:500 11px/1.5 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}><span style={css("color:var(--accent)")}>+</span>{c.about.label}</div>
      <p style={css("flex:1 1 520px;margin:0;font:300 clamp(28px,3.4vw,48px)/1.18 Manrope;letter-spacing:-.02em;text-wrap:pretty")}>{rich(c.about.statement)}</p>
    </div>
    <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px")}>
      {c.about.stats.map((s, i) => (
        <div key={i} style={css("padding:24px;border:1px solid var(--border);border-radius:16px;background:var(--surface);display:flex;flex-direction:column;gap:28px")}><div style={css("font:300 52px/1 Manrope;letter-spacing:-.03em;color:var(--accent)")}>{s.value}</div><div style={css("font:400 14px/1.5 Manrope;color:var(--muted)")}>{s.label}</div></div>
      ))}
    </div>
  </section>

  <section data-screen-label="03 Почему мы" style={css("padding:clamp(80px,10vw,140px) clamp(20px,5vw,80px) 0;max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;gap:40px")}>
    <div style={css("flex:0 1 220px;display:flex;flex-direction:column;justify-content:space-between;gap:32px")}>
      <div style={css("display:flex;flex-direction:column;gap:16px")}>
        <div style={css("font:500 11px/1.5 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}><span style={css("color:var(--accent)")}>+ </span>{c.why.label}</div>
        <p style={css("margin:0;font:400 14px/1.6 Manrope;color:var(--muted)")}>{c.why.text}</p>
      </div>
      <div style={css("display:flex;gap:8px")}>
        <button onClick={prev} aria-label="Назад" style={css("all:unset;cursor:pointer;width:48px;height:48px;border-radius:12px;background:var(--inv-bg);color:var(--inv-fg);display:grid;place-items:center;font-size:16px")}>←</button>
        <button onClick={next} aria-label="Вперёд" style={css("all:unset;cursor:pointer;width:48px;height:48px;border-radius:12px;background:var(--inv-bg);color:var(--inv-fg);display:grid;place-items:center;font-size:16px")}>→</button>
      </div>
    </div>
    <div data-a="track" style={css("flex:1 1 560px;min-width:0;display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px")}>
      {why.map((w, i) => (
        <div key={i} role="button" tabIndex={0} aria-pressed={i === active} onClick={w.pick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); w.pick(); } }} style={css(`flex:0 0 clamp(230px,22vw,280px);scroll-snap-align:start;cursor:pointer;min-height:300px;padding:24px;border-radius:16px;border:1px solid ${w.bd};background:${w.bg};color:${w.fg};display:flex;flex-direction:column;justify-content:space-between;gap:40px;transition:background-color .35s,color .35s`)}>
          <div style={css(`font:300 44px/1 Manrope;letter-spacing:-.03em;color:${w.num}`)}>{w.n}</div>
          <div style={css("display:flex;flex-direction:column;gap:12px")}>
            <div style={css("font:500 18px/1.25 Manrope")}>{w.t}</div>
            <div style={css(`font:400 13px/1.55 Manrope;color:${w.mut}`)}>{w.d}</div>
          </div>
        </div>
      ))}
    </div>
  </section>

  <section id="services" data-screen-label="04 Услуги" style={css("padding:clamp(100px,12vw,160px) clamp(20px,5vw,80px) 0;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:56px")}>
    <h2 style={css("margin:0;font:300 clamp(36px,5vw,72px)/1.05 Manrope;letter-spacing:-.035em;max-width:1000px;text-wrap:balance")}>{rich(c.services.title)}</h2>
    <div style={css("display:flex;flex-wrap:wrap;gap:12px")}>
      {serviceCells.map((it, i) => it === 'note' ? (
        <div key={i} style={css("flex:1 1 180px;min-height:280px;padding:28px;display:flex;align-items:center;font:400 13px/1.6 Manrope;color:var(--muted)")}>{c.services.note}</div>
      ) : (
        <a key={i} href="#contacts" style={css(`flex:${it.wide ? '2 1 420px' : '1 1 240px'};min-height:${it.style === 'surface' ? 240 : 280}px;padding:28px;border-radius:20px;${it.style === 'inv' ? 'background:var(--inv-bg);color:var(--inv-fg)' : it.style === 'grad' ? 'background:var(--grad-card);border:1px solid var(--border);color:var(--text)' : 'background:var(--surface);border:1px solid var(--border);color:var(--text)'};display:flex;flex-direction:column;justify-content:space-between;gap:24px`)}>
          <div style={css("display:flex;justify-content:space-between;gap:16px")}>
            <div style={css("display:flex;flex-direction:column;gap:8px")}><div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--accent)")}>{it.code}</div><div style={css("font:400 24px/1.15 Manrope;letter-spacing:-.01em")}>{it.title}</div></div>
            {it.wide && <div style={css("flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--border);display:grid;place-items:center;color:var(--accent)")}>↗</div>}
          </div>
          <div style={css(`font:400 13px/1.55 Manrope;color:${it.style === 'inv' ? 'var(--inv-muted)' : 'var(--muted)'};max-width:460px`)}>{it.text}</div>
        </a>
      ))}
    </div>
  </section>

  <section id="projects" data-screen-label="05 Проекты" style={css("padding:clamp(100px,12vw,160px) clamp(20px,5vw,80px) 0;max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:40px")}>
    <div style={css("display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:24px")}>
      <div style={css("display:flex;flex-direction:column;gap:16px")}>
        <div style={css("font:500 11px/1.5 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}><span style={css("color:var(--accent)")}>+ </span>{c.projects.label}</div>
        <h2 style={css("margin:0;font:400 clamp(28px,3.4vw,44px)/1.1 Manrope;letter-spacing:.01em;text-transform:uppercase;max-width:760px;text-wrap:balance")}>{rich(c.projects.title)}</h2>
      </div>
      <a href="#projects" style={css("padding:16px 26px;border-radius:999px;border:1px solid var(--text);color:var(--text);font:500 13px/1 Manrope")}>{c.projects.button}</a>
    </div>
    <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;align-items:start")}>
      {c.projects.items.map((p, i) => (
        <div key={i} style={css(i === 1 ? "display:flex;flex-direction:column;gap:12px" : "display:flex;flex-direction:column;gap:12px;padding-top:24px")}>
          <div style={css(`aspect-ratio:${i === 1 ? '4/3.4' : '4/3'};border-radius:20px;overflow:hidden;background:repeating-linear-gradient(135deg,var(--ph-a) 0 10px,var(--ph-b) 10px 20px);border:1px solid var(--border);display:grid;place-items:center;font:400 11px/1 'IBM Plex Mono',monospace;color:var(--muted);position:relative`)}>{p.image ? <img src={p.image} alt={p.title} loading="lazy" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover")} /> : (i === 1 ? 'фото объекта' : 'фото объекта · 4:3')}</div>
          <div style={css("display:flex;flex-direction:column;gap:4px")}><div style={css("font:500 14px/1.3 Manrope")}>{p.title}</div><div style={css("font:400 13px/1.4 Manrope;color:var(--muted)")}>{p.text}</div></div>
        </div>
      ))}
    </div>
    <div style={css("position:relative;aspect-ratio:21/9;min-height:280px;border-radius:24px;overflow:hidden;background:repeating-linear-gradient(135deg,var(--ph-a) 0 10px,var(--ph-b) 10px 20px);border:1px solid var(--border);display:grid;place-items:center")}>
      {playing && video ? (
        video.kind === 'iframe'
          ? <iframe src={video.src} title="Видео об объекте" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" style={css("position:absolute;inset:0;width:100%;height:100%;border:0;background:#000")} />
          : <video src={video.src} controls autoPlay playsInline style={css("position:absolute;inset:0;width:100%;height:100%;background:#000")} />
      ) : (
        <>
          {!video && <div style={css("position:absolute;left:24px;top:24px;font:400 11px/1 'IBM Plex Mono',monospace;color:var(--muted)")}>{c.projects.video}</div>}
          <button onClick={() => video && setPlaying(true)} aria-label={video ? 'Смотреть видео' : 'Видео пока не добавлено'} style={css(`all:unset;cursor:${video ? 'pointer' : 'default'};width:76px;height:76px;border-radius:50%;background:var(--inv-bg);color:var(--inv-fg);display:grid;place-items:center;font-size:18px;box-shadow:var(--glow)`)}>▶</button>
        </>
      )}
    </div>
    <div style={css("display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;align-items:flex-end")}>
      <div style={css("font:400 clamp(24px,2.4vw,32px)/1.1 Manrope;text-transform:uppercase")}>{rich(c.projects.captionTitle)}</div>
      <p style={css("margin:0;max-width:380px;font:400 13px/1.6 Manrope;color:var(--muted)")}>{c.projects.captionText}</p>
    </div>
  </section>

  <section id="docs" data-screen-label="06 Документы и тендеры" style={css("padding:clamp(100px,12vw,160px) clamp(20px,5vw,80px) 0;max-width:1280px;margin:0 auto")}>
    <div style={css("border:1px solid var(--border);border-radius:24px;padding:clamp(24px,3vw,40px);display:flex;flex-direction:column;gap:32px;box-shadow:var(--glow);background:var(--bg-alt)")}>
      <div style={css("display:flex;align-items:center;gap:20px;font:500 13px/1 Manrope;letter-spacing:.18em;color:var(--accent)")}><div style={css("flex:1;border-top:1px solid var(--border)")}></div>{c.docs.title}<div style={css("flex:1;border-top:1px solid var(--border)")}></div></div>
      <div style={css("display:flex;flex-wrap:wrap;gap:24px")}>
        <div style={css("flex:3 1 520px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px")}>
          {docs.map((d, i) => (
            <div key={i} style={css("padding:20px;border:1px solid var(--border);border-radius:14px;background:var(--surface);display:flex;gap:16px")}>
              <div style={css("flex:none;width:44px;height:56px;border:1px solid var(--accent);border-radius:4px;display:flex;flex-direction:column;gap:5px;padding:10px 8px;box-sizing:border-box")}><div style={css("border-top:1px solid var(--accent)")}></div><div style={css("border-top:1px solid var(--accent);width:70%")}></div><div style={css("border-top:1px solid var(--accent)")}></div></div>
              <div style={css("display:flex;flex-direction:column;gap:6px;min-width:0")}>
                <div style={css("font:500 14px/1.3 Manrope")}>{d.t}</div>
                <div style={css("font:400 12px/1.4 'IBM Plex Mono',monospace;color:var(--muted)")}>{d.n}</div>
                <div style={css("display:flex;align-items:center;gap:8px;font:400 12px/1.4 Manrope;color:var(--muted)")}><div style={css(`width:6px;height:6px;border-radius:50%;background:${d.c}`)}></div>{d.s}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={css("flex:1 1 260px;padding:24px;border-radius:14px;background:var(--inv-bg);color:var(--inv-fg);display:flex;flex-direction:column;gap:20px")}>
          <div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--accent)")}>{c.docs.tenderTitle}</div>
          <div style={css("display:flex;flex-direction:column")}>
            {c.docs.links.map((l, i) => (
              <a key={i} href={l.href} style={css(`display:flex;justify-content:space-between;padding:12px 0;${i < c.docs.links.length - 1 ? 'border-bottom:1px solid var(--inv-muted);' : ''}color:var(--inv-fg);font:400 15px/1.3 Manrope`)}>{l.label}<span>→</span></a>
            ))}
          </div>
          <a href="#contacts" style={css("margin-top:auto;text-align:center;padding:14px;border-radius:999px;background:var(--accent);color:var(--bg);font:600 13px/1 Manrope")}>{c.docs.download}</a>
        </div>
      </div>
    </div>
  </section>

  <section id="contacts" data-screen-label="07 Заявка" style={css("padding:clamp(100px,12vw,160px) clamp(20px,5vw,80px);max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;gap:56px")}>
    <div style={css("flex:1 1 380px;display:flex;flex-direction:column;justify-content:space-between;gap:40px")}>
      <h2 style={css("margin:0;font:300 clamp(40px,5vw,72px)/1.02 Manrope;letter-spacing:-.035em")}>{rich(c.contacts.title)}</h2>
      <div style={css("display:flex;flex-direction:column;gap:20px;font:400 15px/1.5 Manrope")}>
        <div style={css("display:flex;flex-direction:column;gap:4px")}><span style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted)")}>ТЕЛЕФОН</span>{c.contacts.phone}</div>
        <div style={css("display:flex;flex-direction:column;gap:4px")}><span style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted)")}>EMAIL</span>{c.contacts.email}</div>
        <div style={css("display:flex;flex-direction:column;gap:4px")}><span style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted)")}>АДРЕС</span>{c.contacts.address}</div>
      </div>
    </div>
    <div style={css("flex:1.3 1 440px;padding:clamp(24px,3vw,40px);border:1px solid var(--border);border-radius:24px;background:var(--surface)")}>
      {sent && (
        <div style={css("min-height:420px;display:flex;flex-direction:column;justify-content:center;gap:16px")}>
          <div style={css("width:52px;height:52px;border-radius:50%;border:1px solid var(--accent);display:grid;place-items:center;color:var(--accent);box-shadow:var(--glow)")}>✓</div>
          <div style={css("font:300 32px/1.15 Manrope")}>{c.contacts.successTitle}</div>
          <div style={css("font:400 14px/1.6 Manrope;color:var(--muted)")}>{c.contacts.successText}</div>
          <button onClick={reset} style={css("all:unset;cursor:pointer;color:var(--accent);font:500 13px/1 Manrope")}>Отправить ещё одну →</button>
        </div>
      )}
      {notSent && (
        <form onSubmit={submit} style={css("display:flex;flex-direction:column;gap:20px")}>
          <div style={css("display:flex;flex-wrap:wrap;gap:16px")}>
            <label style={css("flex:1 1 200px;display:flex;flex-direction:column;gap:8px;font:500 12px/1 Manrope;color:var(--muted)")}>Имя *<input name="name" required maxLength={120} style={css("padding:14px 16px;border-radius:12px;border:1px solid var(--hair);background:var(--bg);color:var(--text);font-size:15px;outline:none")} className="fld" /></label>
            <label style={css("flex:1 1 200px;display:flex;flex-direction:column;gap:8px;font:500 12px/1 Manrope;color:var(--muted)")}>Телефон или email *<input name="contact" required maxLength={160} style={css("padding:14px 16px;border-radius:12px;border:1px solid var(--hair);background:var(--bg);color:var(--text);font-size:15px;outline:none")} className="fld" /></label>
          </div>
          <label style={css("display:flex;flex-direction:column;gap:8px;font:500 12px/1 Manrope;color:var(--muted)")}>Организация<input name="org" maxLength={200} style={css("padding:14px 16px;border-radius:12px;border:1px solid var(--hair);background:var(--bg);color:var(--text);font-size:15px;outline:none")} className="fld" /></label>
          <div style={css("display:flex;flex-direction:column;gap:10px;font:500 12px/1 Manrope;color:var(--muted)")}>Тема
            <div style={css("display:flex;flex-wrap:wrap;gap:8px")}>
              {topics.map((tp, i) => (
                <button key={i} type="button" onClick={tp.pick} style={css(`all:unset;cursor:pointer;padding:10px 16px;border-radius:999px;border:1px solid ${tp.bd};background:${tp.bg};color:${tp.fg};font:500 13px/1 Manrope`)}>{tp.label}</button>
              ))}
            </div>
          </div>
          <label style={css("display:flex;flex-direction:column;gap:8px;font:500 12px/1 Manrope;color:var(--muted)")}>Сообщение *<textarea name="message" required rows={4} maxLength={4000} style={css("padding:14px 16px;border-radius:12px;border:1px solid var(--hair);background:var(--bg);color:var(--text);font-size:15px;outline:none;resize:vertical")} className="fld"></textarea></label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={css("position:absolute;left:-9999px;opacity:0;height:0;width:0")} />
          <label style={css("display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;border:1px dashed var(--border);cursor:pointer;font:400 13px/1.4 Manrope;color:var(--muted)")}><span style={css("color:var(--accent)")}>+</span>Прикрепить файл — PDF, DWG, DOCX, XLSX, ZIP до 20 МБ<input type="file" style={css("display:none")} /></label>
          <div style={css("display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px")}>
            <label style={css("display:flex;align-items:center;gap:10px;font:400 13px/1.4 Manrope;color:var(--muted);cursor:pointer;flex:1 1 220px")}><input type="checkbox" required style={css("accent-color:var(--accent);width:16px;height:16px")} />Согласен на обработку персональных данных</label>
            <button type="submit" disabled={sending} style={css("all:unset;cursor:pointer;padding:16px 28px;border-radius:999px;background:var(--btn-bg);color:var(--btn-fg);font:600 13px/1 Manrope;box-shadow:var(--glow)")}>{sending ? 'Отправляем…' : 'Оставить заявку →'}</button>
          </div>
          {formError && <div role="alert" style={css("font:400 13px/1.4 Manrope;color:#d4574a")}>{formError}</div>}
        </form>
      )}
    </div>
  </section>

  <footer data-screen-label="08 Подвал" style={css("border-top:1px solid var(--hair);padding:56px clamp(20px,5vw,80px) 32px")}>
    <div style={css("max-width:1280px;margin:0 auto;display:flex;flex-direction:column;gap:48px")}>
      <div style={css("display:flex;flex-wrap:wrap;gap:40px;justify-content:space-between")}>
        <div style={css("flex:1 1 220px;display:flex;flex-direction:column;gap:16px")}>
          <div style={css("display:flex;align-items:center;gap:12px")}><div style={css("width:14px;height:14px;border:1.5px solid var(--accent);transform:rotate(45deg)")}></div><div style={css("font:500 15px/1 Manrope;letter-spacing:.32em")}>CULMANN</div></div>
          <div style={css("font:400 13px/1.6 Manrope;color:var(--muted);max-width:260px")}>{c.footer.requisites}</div>
        </div>
        <div style={css("flex:0 1 150px;display:flex;flex-direction:column;gap:10px;font:400 13px/1.4 Manrope")}><div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted);margin-bottom:6px")}>КОМПАНИЯ</div><a href="#about" style={css("color:var(--text)")}>О компании</a><a href="#about" style={css("color:var(--text)")}>Команда</a><a href="#about" style={css("color:var(--text)")}>Технологии</a></div>
        <div style={css("flex:0 1 150px;display:flex;flex-direction:column;gap:10px;font:400 13px/1.4 Manrope")}><div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted);margin-bottom:6px")}>РАБОТЫ</div><a href="#services" style={css("color:var(--text)")}>Услуги</a><a href="#projects" style={css("color:var(--text)")}>Проекты</a><a href="#docs" style={css("color:var(--text)")}>Тендеры</a></div>
        <div style={css("flex:0 1 150px;display:flex;flex-direction:column;gap:10px;font:400 13px/1.4 Manrope")}><div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted);margin-bottom:6px")}>ДОКУМЕНТЫ</div><a href="#docs" style={css("color:var(--text)")}>Лицензии</a><a href="#docs" style={css("color:var(--text)")}>Реквизиты</a><a href="#contacts" style={css("color:var(--text)")}>Политика конфиденциальности</a></div>
        <div style={css("flex:0 1 150px;display:flex;flex-direction:column;gap:10px;font:400 13px/1.4 Manrope")}><div style={css("font:500 11px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted);margin-bottom:6px")}>СВЯЗЬ</div><a href="#contacts" style={css("color:var(--text)")}>Контакты</a><a href="#contacts" style={css("color:var(--text)")}>WhatsApp</a><a href="#contacts" style={css("color:var(--text)")}>Telegram</a></div>
      </div>
      <div style={css("display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding-top:24px;border-top:1px solid var(--hair);font:400 12px/1.4 Manrope;color:var(--muted)")}><span>{c.footer.copyright}</span><span>{c.footer.location}</span></div>
    </div>
  </footer>
</main>
      <button id="themeFab" type="button" onClick={toggleTheme} aria-label="Переключить тему" title="Переключить тему">
        <svg className="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        <svg className="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 13.2A9 9 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2z" /></svg>
      </button>
    </>
  );
}
