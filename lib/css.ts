import type { CSSProperties } from 'react';

/* Разбирает CSS-строку из макета в объект style для React.
   Имена шрифтов макета заменяются на переменные next/font (см. app/layout.tsx). */
const cache = new Map<string, CSSProperties>();

const fixFonts = (v: string) =>
  v.replace(/'IBM Plex Mono',\s*monospace/g, 'var(--font-mono), monospace').replace(/\bManrope\b/g, 'var(--font-manrope)');

export function css(s: string): CSSProperties {
  const hit = cache.get(s);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const v = fixFonts(decl.slice(i + 1).trim());
    if (!k) continue;
    out[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  cache.set(s, out as CSSProperties);
  return out as CSSProperties;
}
