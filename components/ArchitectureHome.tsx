'use client';

import { useState } from 'react';
import type { Content } from '@/lib/content';
import { plain } from '@/lib/rich';
import { parseVideo } from '@/lib/video';
import s from './ArchitectureHome.module.css';

const topics = ['Проектирование', 'Обследование', 'Тендер', 'Вакансия', 'Другое'];
const nav = [['#company', 'О компании'], ['#work', 'Проекты'], ['#expertise', 'Услуги'], ['#inquiry', 'Контакты']];
const number = (i: number) => String(i + 1).padStart(2, '0');

export default function ArchitectureHome({ content: c }: { content: Content }) {
  const [menu, setMenu] = useState(false);
  const [slide, setSlide] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const video = parseVideo(c.projects.videoUrl);
  const slides = [
    { title: `${plain(c.hero.line1)} ${plain(c.hero.line2)} ${plain(c.hero.line3)}`, text: c.hero.lead, image: '/architecture.jpg', label: c.hero.label },
    ...c.projects.items.filter(p => p.image).map(p => ({ ...p, label: 'ИЗБРАННЫЕ ПРОЕКТЫ' })),
  ];
  const current = slides[Math.min(slide, slides.length - 1)];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setSending(true); setError('');
    try {
      const response = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Не удалось отправить заявку. Попробуйте ещё раз.');
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка отправки'); }
    finally { setSending(false); }
  }
  return <div className={s.site}>
    <header className={s.header}>
      <a className={s.brand} href="#home" aria-label="CULMANN — на главную">CULMANN<span>ENGINEERING & STRUCTURES</span></a>
      <nav className={s.desktopNav} aria-label="Главная навигация">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
      <a className={s.headerCta} href="#inquiry">Обсудить проект <span>↗</span></a>
      <button className={s.menuButton} aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} aria-controls="mobile-nav" onClick={() => setMenu(!menu)}>{menu ? '✕' : '☰'}</button>
    </header>
    {menu && <nav id="mobile-nav" className={s.mobileNav} aria-label="Мобильная навигация">{nav.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}<span>↗</span></a>)}</nav>}
    <main className={s.main}>
      <div id="home" className={s.hero}>
        <img key={current.image} className={s.heroImage} src={current.image} alt="Архитектурный образ современного здания" fetchPriority="high" />
        <div className={s.heroShade} />
        <div className={s.heroTop}><span>БИШКЕК, КЫРГЫЗСТАН</span><span>АРХИТЕКТУРА ТОЧНЫХ РЕШЕНИЙ</span></div>
        <div className={s.heroCopy} aria-live="polite"><p className={s.eyebrow}>{current.label}</p><h1>{current.title}</h1><div className={s.heroBottom}><p>{current.text}</p><a className={s.circleLink} href="#work" aria-label="Смотреть проекты">↗</a></div></div>
        <div className={s.heroFoot}><a href="#company">ЛИСТАЙТЕ ВНИЗ <span>↓</span></a>{slides.length > 1 ? <div className={s.dots}>{slides.map((_, i) => <button key={i} onClick={() => setSlide(i)} aria-label={`Слайд ${i + 1}`} aria-pressed={slide === i} className={slide === i ? s.selectedDot : ''} />)}</div> : <span>КОНСТРУКЦИИ. ПРОСТРАНСТВО. БУДУЩЕЕ.</span>}<span>{number(slide)} / {String(slides.length).padStart(2, '0')}</span></div>
      </div>
      <div className={s.content}>
        <div className={s.gateway}>{[['#company', 'О компании', 'Инженерия, которой доверяют'], ['#work', 'Проекты', 'От идеи до реализации'], ['#expertise', 'Услуги', 'Точность в каждой детали']].map(([href, title, text], i) => <a href={href} key={href}><span className={s.gatewayNumber}>{number(i)}</span><div><h2>{title}</h2><p>{text}</p></div><span className={s.arrow}>↗</span></a>)}</div>
        <section id="company" className={s.about}>
          <div className={s.sectionLabel}><span>01 / О КОМПАНИИ</span><span>CULMANN</span></div>
          <div className={s.mission}><div className={s.missionImage}><img src="/architecture.jpg" alt="Архитектурная визуализация фасада" loading="lazy" /><span>ФОРМА НАЧИНАЕТСЯ С РАСЧЁТА</span></div><div className={s.missionText}><p className={s.eyebrow}>НАША МИССИЯ</p><h2>{plain(c.about.statement)}</h2><p>{c.why.text}</p><a className={s.textLink} href="#expertise">Наши компетенции <span>↗</span></a></div></div>
          <div className={s.stats}>{c.about.stats.map((stat, i) => <div key={i}><strong>{stat.value}</strong><p>{stat.label}</p></div>)}</div>
        </section>
        <section id="work" className={s.section}>
          <div className={s.sectionLabel}><span>02 / {c.projects.label}</span><span>ОТ ИДЕИ К ОБЪЕКТУ</span></div>
          <div className={s.sectionHeading}><h2>{plain(c.projects.title)}</h2><a className={s.textLink} href="#inquiry">Обсудить ваш объект <span>↗</span></a></div>
          <div className={s.projects}>{c.projects.items.map((project, i) => <article key={i} className={s.project}><div className={s.projectVisual}>{project.image ? <img src={project.image} alt={project.title} loading="lazy" /> : <div className={`${s.blueprint} ${s['blueprint' + i]}`}><svg viewBox="0 0 500 350" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1"><path d="M70 275 270 325 430 220 230 172Z M70 275V100L230 30 430 95V220 M230 30V172 M70 100 270 158 430 95 M270 158V325" />{[0,1,2,3,4,5].map(j => <path key={j} d={`M70 ${125+j*25} 270 ${183+j*25} 430 ${120+j*20} M${95+j*27} ${108+j*8}V${281+j*7}`} />)}<path d="M30 295 273 355M450 85V240M230 10 450 85" strokeDasharray="4 6" /></g></svg><span>СХЕМА / ВИЗУАЛИЗАЦИЯ ГОТОВИТСЯ</span></div>}<span className={s.projectIndex}>{number(i)}</span></div><div className={s.projectCaption}><div><h3>{project.title}</h3><p>{project.text}</p></div><a href="#inquiry" aria-label={`Обсудить похожий проект: ${project.title}`}>↗</a></div></article>)}</div>
          {video && <div className={s.video}>{video.kind === 'file' ? <video controls preload="none" src={video.src} /> : <iframe src={video.src.replace('autoplay=1', 'autoplay=0')} title={plain(c.projects.captionTitle)} allow="fullscreen; picture-in-picture" allowFullScreen loading="lazy" />}<p>{plain(c.projects.captionText)}</p></div>}
        </section>
        <section id="expertise" className={s.section}>
          <div className={s.sectionLabel}><span>03 / УСЛУГИ</span><span>ИНЖЕНЕРНЫЙ ПОДХОД</span></div>
          <div className={s.sectionHeading}><h2>{plain(c.services.title)}</h2><p>{c.services.note}</p></div>
          <div className={s.services}>{c.services.items.map((item, i) => <details key={i}><summary><span>{number(i)} / {item.code}</span><h3>{item.title}</h3><b>+</b></summary><div className={s.serviceBody}><p>{item.text}</p><a className={s.textLink} href="#inquiry">Обсудить задачу ↗</a></div></details>)}</div>
        </section>
        <section className={s.section} aria-labelledby="approach-title"><div className={s.sectionLabel}><span>04 / НАШ ПОДХОД</span><span>ВНИМАНИЕ К ДЕТАЛЯМ</span></div><div className={s.sectionHeading}><h2 id="approach-title">{c.why.label}</h2><p>{c.why.text}</p></div><div className={s.approach}>{c.why.items.map((item, i) => <article key={i}><span>{number(i)}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
        <section id="documents" className={s.section}><div className={s.sectionLabel}><span>05 / ДОКУМЕНТЫ</span><span>ОТКРЫТОСТЬ И ОТВЕТСТВЕННОСТЬ</span></div><div className={s.sectionHeading}><h2>{c.docs.title}</h2><a className={s.textLink} href="#inquiry">Запросить документы ↗</a></div><div className={s.docs}>{c.docs.items.map((doc, i) => <div key={i}><span>{number(i)}</span><h3>{doc.title}</h3><p>{doc.number}<br />{doc.status}</p></div>)}</div></section>
        <section id="inquiry" className={`${s.section} ${s.contact}`}><div><p className={s.eyebrow}>06 / НАЧНЁМ ДИАЛОГ</p><h2>{plain(c.contacts.title)}<span>↗</span></h2><p>Расскажите о вашей задаче.<br />Найдём конструктивное решение.</p><a href={`mailto:${c.contacts.email}`}>{c.contacts.email}</a><p>{c.contacts.phone}<br />{c.contacts.address}</p></div><div className={s.formWrap}>{sent ? <div className={s.success} role="status"><span>✓</span><h3>{c.contacts.successTitle}</h3><p>{c.contacts.successText}</p><button onClick={() => setSent(false)}>Отправить ещё одну ↗</button></div> : <form onSubmit={submit}><label>Ваше имя *<input name="name" autoComplete="name" required maxLength={120} placeholder="Как к вам обращаться" /></label><label>Телефон или email *<input name="contact" required maxLength={160} placeholder="Для обратной связи" /></label><label>Организация<input name="org" autoComplete="organization" maxLength={200} placeholder="Название компании" /></label><label>Тема обращения<select name="topic">{topics.map(t => <option key={t}>{t}</option>)}</select></label><label>О вашем проекте *<textarea name="message" required rows={3} maxLength={4000} placeholder="Тип объекта, площадь, задача" /></label><input className={s.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /><label className={s.consent}><input type="checkbox" required />Согласен на обработку персональных данных для ответа на заявку</label><button className={s.submit} disabled={sending}>{sending ? 'Отправляем…' : 'Оставить заявку'}<span>↗</span></button>{error && <p role="alert" className={s.error}>{error}</p>}</form>}</div></section>
      </div>
    </main>
    <footer className={s.footer}><a className={s.footerBrand} href="#home">CULMANN</a><div className={s.footerRow}><p>{c.footer.copyright}<br />{c.footer.location}</p><nav aria-label="Навигация в подвале">{nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav><a href="#home">Наверх ↑</a></div><p className={s.requisites}>{c.footer.requisites}</p></footer>
  </div>;
}
