'use client';

import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import s from './ArchitectureHome.module.css';

/** All effects are scoped and reverted on unmount or a motion preference change. */
export function useArchitectureMotion(root: RefObject<HTMLDivElement | null>, slide: number) {
  useLayoutEffect(() => {
    const site = root.current;
    if (!site) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px) and (pointer: fine)' }, context => {
      if (!context.conditions?.motion) return;
      const desktop = context.conditions.desktop;
      const select = (name: string) => Array.from(site.querySelectorAll<HTMLElement>(name));
      const cls = (name: string) => `.${s[name]}`;
      const reveal = (element: HTMLElement, delay = 0) => {
        // Content already above the viewport stays visible after anchor navigation.
        if (element.getBoundingClientRect().top < window.innerHeight * .94) return;
        const tween = gsap.from(element, {
          y: desktop ? 36 : 18, opacity: 0, duration: .85, delay,
          ease: 'power3.out', clearProps: 'transform,opacity',
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        });
        return tween;
      };
      select([`${cls('sectionHeading')}`, `${cls('missionText')}`, `${cls('projectCaption')}`, `${cls('contact')} > div`, cls('footerBrand')].join(',')).forEach(el => reveal(el));
      ['gateway', 'stats', 'approach', 'docs'].forEach(group => {
        select(`${cls(group)} > *`).forEach((el, i) => reveal(el, (i % (desktop ? 3 : 1)) * .09));
      });
      select(cls('projectVisual')).forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * .94) return;
        gsap.from(el, { clipPath: 'inset(12% 0% 12% 0%)', duration: 1.15, ease: 'power3.out', clearProps: 'clipPath', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
      });
      select(cls('sectionLabel')).forEach(el => {
        gsap.fromTo(el, { '--rule-progress': 0 }, { '--rule-progress': 1, duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 94%', once: true } });
      });
      site.querySelectorAll<SVGPathElement>(`${cls('blueprint')} path:not([stroke-dasharray])`).forEach(path => {
        const length = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, {
          strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset',
          scrollTrigger: { trigger: path.closest(cls('projectVisual')), start: 'top 82%', once: true },
        });
      });
      if (desktop) {
        gsap.fromTo(select(cls('heroImage')), { yPercent: 0, scale: 1.12 }, { yPercent: 12, scale: 1.12, ease: 'none', scrollTrigger: { trigger: site.querySelector(cls('hero')), start: 'top top', end: 'bottom top', scrub: .7 } });
        select(`${cls('missionImage')} img`).forEach(image => {
          gsap.fromTo(image, { yPercent: -5, scale: 1.15 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 } });
        });
      }
      // Keyboard users never have to wait for a hidden focus target.
      const onFocus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        for (let el: HTMLElement | null = target; el && el !== site; el = el.parentElement) {
          gsap.getTweensOf(el).forEach(tween => { if (!tween.scrollTrigger?.vars.scrub) tween.progress(1); });
        }
      };
      site.addEventListener('focusin', onFocus);
      let alive = true;
      document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
      const details = select('details');
      const refresh = () => ScrollTrigger.refresh();
      details.forEach(el => {
        el.addEventListener('toggle', refresh);
        el.addEventListener('transitionend', refresh);
      });
      return () => {
        alive = false;
        site.removeEventListener('focusin', onFocus);
        details.forEach(el => {
          el.removeEventListener('toggle', refresh);
          el.removeEventListener('transitionend', refresh);
        });
      };
    }, site);
    return () => media.revert();
  }, [root, slide]);
}
