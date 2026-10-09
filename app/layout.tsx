import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ subsets: ['cyrillic', 'latin'], weight: ['300', '400', '500', '600'], variable: '--font-manrope', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['cyrillic', 'latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'CULMANN — инженерно-конструкторская компания',
  description: 'ОсОО «Кульман» (CULMANN): проектирование несущих конструкций зданий — железобетон, металл, фундаменты, сейсмика.',
};

/* Тема: сначала cookie (сервер отдаёт её сразу), иначе системная — скрипт ставит её до первой отрисовки, без мигания. */
const themeInit = `(function(){try{var m=document.cookie.match(/culmann-theme=(light|dark)/);var t=m?m[1]:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get('culmann-theme')?.value;
  const theme = saved === 'light' || saved === 'dark' ? saved : undefined;
  return (
    <html lang="ru" data-theme={theme} className={`${manrope.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
