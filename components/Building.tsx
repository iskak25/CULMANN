import { createElement as h, memo, type CSSProperties, type ReactElement } from 'react';

/* Procedural glass tower, stepped crowns and architectural lighting. No raster images. */

const FH = 32; // высота этажа
const c = 7; // сечение колонны

type Opts = { base?: number; lobby?: boolean; crown?: boolean; seed?: number; bands?: number[]; vline?: number };

function makeBuilding(): ReactElement {
  const out: ReactElement[] = [];
  const f = (key: string, w: number, ht: number, tr: string, st: CSSProperties) =>
    out.push(h('div', { key, style: { position: 'absolute', left: 0, top: 0, width: w, height: ht, transform: tr, ...st } }));

  const glass = (seed: number): CSSProperties => {
    const lights: string[] = [];
    const positions: string[] = [];
    const sizes: string[] = [];
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 8; col++) {
        const n = ((row * 73 + col * 37 + seed * 19) ^ (row * col * 13)) % 101;
        if (n > 47) continue;
        lights.push('linear-gradient(180deg,rgba(255,217,151,.2),rgba(255,184,74,' + (.28 + n / 110) + ') 72%,rgba(235,141,43,.28))');
        positions.push((col * 18 + 2) + 'px ' + (row * 36 + 7) + 'px');
        sizes.push('9px 8px');
      }
    }
    lights.push('repeating-linear-gradient(90deg,transparent 0 11px,var(--mull) 11px 12px)', 'repeating-linear-gradient(180deg,transparent 0 16px,var(--mull) 16px 18px)', 'linear-gradient(115deg,transparent 12%,var(--refl) 35%,transparent 39%,transparent 65%,var(--refl) 95%)', 'var(--glass-base)');
    return { backgroundImage: lights.join(','), backgroundPosition: positions.concat(['0 0','0 0','0 0','0 0']).join(','), backgroundSize: sizes.concat(['auto','auto','100% 100%','100% 100%']).join(','), backgroundRepeat: sizes.map(() => 'no-repeat').concat(['repeat','repeat','no-repeat','no-repeat']).join(','), border: '1px solid var(--mull)', boxSizing: 'border-box', opacity: 'var(--fac,1)' };
  };
  const lobby: CSSProperties = {
    background: 'repeating-linear-gradient(90deg,var(--mull) 0 5px,transparent 5px 29px,var(--mull) 29px 31px),linear-gradient(180deg,rgba(8,17,27,.9),rgba(255,177,69,.72) 55%,rgba(32,26,19,.8)),var(--glass-base)',
    borderTop: '3px solid var(--edge)',
    boxSizing: 'border-box',
    boxShadow: '0 0 26px var(--edge-glow)',
    opacity: 'var(--fac)',
  };
  const band: CSSProperties = { background: 'var(--edge)', boxShadow: '0 0 5px var(--edge-glow),0 0 16px var(--edge-glow)', opacity: 'var(--fac)' };
  const slabSt: CSSProperties = { background: 'var(--slab)', border: '1px solid var(--frame)', boxShadow: 'var(--frame-glow)', opacity: 'var(--frm)' };
  const colSt: CSSProperties = { background: 'var(--col)', boxShadow: 'var(--frame-glow)', opacity: 'var(--frm)' };

  const box = (id: string, x0: number, x1: number, z0: number, z1: number, hgt: number, o: Opts = {}) => {
    const w = x1 - x0, d = z1 - z0, cz = (z0 + z1) / 2, base = o.base || 0, top = base + hgt;
    for (let y = base; y <= top + 0.1; y += FH) f(id + 's' + y, w + 6, d + 6, `translate3d(${x0 - 3}px,${-y - (d + 6) / 2}px,${cz}px) rotateX(90deg)`, slabSt);
    const xs = [x0 + 5, (x0 + x1) / 2, x1 - 5], zs = [z0 + 5, z1 - 5];
    xs.forEach((x, a) => zs.forEach((z, b) => {
      const k = id + 'c' + a + b;
      f(k + 'f', c, hgt, `translate3d(${x - c / 2}px,${-top}px,${z + c / 2}px)`, colSt);
      f(k + 'b', c, hgt, `translate3d(${x - c / 2}px,${-top}px,${z - c / 2}px)`, colSt);
      f(k + 'r', c, hgt, `translate3d(${x}px,${-top}px,${z}px) rotateY(90deg)`, { ...colSt, filter: 'brightness(.7)' });
      f(k + 'l', c, hgt, `translate3d(${x - c}px,${-top}px,${z}px) rotateY(90deg)`, { ...colSt, filter: 'brightness(.7)' });
    }));
    const crown: CSSProperties = { background: 'repeating-linear-gradient(90deg,transparent 0 11px,var(--mull) 11px 12px),var(--glass-base)', border: '1px solid var(--mull)', opacity: 'var(--fac)' };
    const g = o.crown ? crown : o.lobby ? lobby : glass(o.seed || 0);
    const gs: CSSProperties = o.crown ? { ...crown, filter: 'brightness(.75)' } : o.lobby ? { ...lobby, filter: 'brightness(.6)' } : { ...glass((o.seed || 0) + 7), filter: 'brightness(.78)' };
    f(id + 'wf', w, hgt, `translate3d(${x0}px,${-top}px,${z1}px)`, g);
    f(id + 'wb', w, hgt, `translate3d(${x0}px,${-top}px,${z0}px) rotateY(180deg)`, g);
    f(id + 'wr', d, hgt, `translate3d(${x1 - d / 2}px,${-top}px,${cz}px) rotateY(90deg)`, gs);
    f(id + 'wl', d, hgt, `translate3d(${x0 - d / 2}px,${-top}px,${cz}px) rotateY(-90deg)`, gs);
    f(id + 'rf', w, d, `translate3d(${x0}px,${-top - d / 2}px,${cz}px) rotateX(90deg)`, { background: 'var(--glass-base)', border: '1px solid var(--mull)', boxSizing: 'border-box', boxShadow: 'none', opacity: 'var(--fac)' });
    (o.bands || []).forEach((by, i) => {
      const y = base + by;
      f(id + 'bf' + i, w + 2, 3, `translate3d(${x0 - 1}px,${-y}px,${z1 + 1}px)`, band);
      f(id + 'br' + i, d + 2, 3, `translate3d(${x1 + 1 - (d + 2) / 2}px,${-y}px,${cz}px) rotateY(90deg)`, band);
    });
    if (o.vline != null) f(id + 'vl', 3, hgt, `translate3d(${x0 + o.vline}px,${-top}px,${z1 + 1}px)`, band);
  };

  f('g', 1100, 760, 'translate3d(-550px,-380px,0) rotateX(90deg)', { background: 'var(--pool)', borderRadius: '50%' });
  f('g2', 1400, 1000, 'translate3d(-700px,-500px,0) rotateX(90deg)', { background: 'var(--ground)', borderRadius: '50%' });
  const PH = 2 * FH;
  box('p', -195, 190, -115, 130, PH, { lobby: true, bands: [PH - 3] });
  box('core', -44, 30, -106, 20, 14.4 * FH, { base: PH, seed: 21 });
  box('a', -120, -20, -80, 45, 16 * FH, { base: PH, seed: 3, bands: [11 * FH, 15 * FH], vline: 4 });
  box('ac', -125, -15, -85, 50, FH, { base: PH + 15 * FH, crown: true, seed: 92, bands: [0] });
  box('c', -179, -115, -32, 70, 9.7 * FH, { base: PH, seed: 11, bands: [4.6 * FH, 8.8 * FH], vline: 4 });
  box('cc', -184, -110, -37, 75, .9 * FH, { base: PH + 8.8 * FH, crown: true, seed: 83, bands: [0] });
  box('b', 0, 145, -70, 64, 13.4 * FH, { base: PH, seed: 5, bands: [12.4 * FH], vline: 4 });
  box('bc', -5, 150, -75, 69, FH, { base: PH + 12.4 * FH, crown: true, seed: 75, bands: [0] });
  box('front', 48, 150, 64, 108, 8.8 * FH, { base: PH, seed: 17, bands: [0, 8.8 * FH], vline: 4 });
  box('entry', -60, 36, 130, 153, 40, { lobby: true, bands: [40] });
  for (let i = 0; i < 5; i++) {
    f('step' + i, 142 + i * 14, 12, 'translate3d(' + (-83 - i * 7) + 'px,' + (-3 + i * 3) + 'px,' + (156 + i * 11) + 'px) rotateX(90deg)', { background: 'var(--stone)', border: '1px solid var(--mull)', opacity: 'var(--fac)' });
  }
  f('water', 450, 100, 'translate3d(-220px,-40px,255px) rotateX(90deg)', { background: 'repeating-linear-gradient(90deg,transparent 0 28px,rgba(255,185,71,.32) 31px,transparent 36px),linear-gradient(180deg,var(--water),rgba(7,17,26,.2))', border: '1px solid var(--mull)', opacity: 'var(--fac)' });
  return h(
    'div',
    { 'data-a': 'anchor', style: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d' } },
    h('div', { 'data-a': 'bld', style: { position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', willChange: 'transform' } }, out),
  );
}

/* Геометрия для расчёта сцен: высота здания и узел «колонна — плита» (угол башни B, 6-й этаж). */
const PH = 2 * FH;
export const GEO = { H: PH + 16 * FH, jx: 150 - 5, jy: -(PH + 6 * FH), jz: 85 - 5 };

const NODE = makeBuilding();

const Building = memo(function Building() {
  return NODE;
});
export default Building;
