/* Модель контента сайта и значения по умолчанию.
   Файл безопасен для клиента (без fs). Хранение — lib/store.ts.
   В текстах слова в *звёздочках* выделяются акцентным цветом. */

export type Fact = { head: string; text: string };
export type Stat = { value: string; label: string };
export type WhyItem = { title: string; text: string };
export type ServiceItem = { code: string; title: string; text: string; style: 'inv' | 'grad' | 'surface'; wide: boolean };
export type ProjectItem = { title: string; text: string; image: string };
export type DocItem = { title: string; number: string; status: string; state: 'ok' | 'soon' | 'muted' };
export type LinkItem = { label: string; href: string };

export type Content = {
  hero: { label: string; line1: string; line2: string; line3: string; lead: string; cta: string; facts: Fact[] };
  scene3: { line1: string; line2: string; line3: string; p1: string; p2: string; button: string };
  about: { label: string; statement: string; stats: Stat[] };
  why: { label: string; text: string; items: WhyItem[] };
  services: { title: string; note: string; items: ServiceItem[] };
  projects: { label: string; title: string; button: string; items: ProjectItem[]; video: string; videoUrl: string; captionTitle: string; captionText: string };
  docs: { title: string; items: DocItem[]; tenderTitle: string; links: LinkItem[]; download: string };
  contacts: { title: string; phone: string; email: string; address: string; successTitle: string; successText: string };
  footer: { requisites: string; copyright: string; location: string };
};

export const DEFAULT_CONTENT: Content = {
  hero: {
    label: 'ИНЖЕНЕРНО-КОНСТРУКТОРСКАЯ КОМПАНИЯ · КР',
    line1: 'Проектируем',
    line2: 'то, на чём',
    line3: 'держится *город.*',
    lead: 'Рассчитываем и проектируем несущие конструкции зданий: железобетон, металл, фундаменты, сейсмика.',
    cta: 'НАШИ ПРОЕКТЫ',
    facts: [
      { head: '*15* лет', text: 'проектируем конструкции для жилых, общественных и промышленных объектов' },
      { head: '*120+* объектов', text: 'от частных домов до школ и производственных корпусов' },
      { head: '*9* баллов', text: 'сейсмичность площадок, на которые мы выполняем расчёты' },
    ],
  },
  scene3: {
    line1: 'Расчёт', line2: 'каждого', line3: 'узла.',
    p1: 'Каждое сопряжение колонн, плит и балок проверяем расчётом в двух программных комплексах.',
    p2: 'Результат — рабочая документация КЖ и КМ, понятная подрядчику и экспертизе.',
    button: 'УСЛУГИ →',
  },
  about: {
    label: 'КТО МЫ И ПОЧЕМУ НАМ ДОВЕРЯЮТ',
    statement: 'CULMANN — инженерно-конструкторская компания. Мы рассчитываем *несущие конструкции* зданий и отвечаем за них *от фундамента до кровли*.',
    stats: [
      { value: '15+', label: 'лет на рынке проектирования' },
      { value: '120+', label: 'объектов в портфолио' },
      { value: '350 тыс.', label: 'м² спроектированных площадей' },
      { value: '24', label: 'инженера-конструктора в штате' },
    ],
  },
  why: {
    label: 'ПОЧЕМУ МЫ',
    text: 'Берём на себя конструктивный раздел целиком и сопровождаем его до ввода объекта.',
    items: [
      { title: 'Расчёты на сейсмику', text: 'Проектируем с учётом сейсмичности площадки и грунтовых условий.' },
      { title: 'Один исполнитель всего раздела', text: 'КЖ, КМ и фундаменты ведёт одна команда — без стыков между подрядчиками.' },
      { title: 'Сопровождение экспертизы', text: 'Отвечаем на замечания и доводим проект до положительного заключения.' },
      { title: 'Авторский надзор', text: 'Инженер выезжает на объект и контролирует соответствие проекту.' },
      { title: 'Документы для тендеров', text: 'Лицензии, опыт и специалисты собраны в одном месте.' },
    ],
  },
  services: {
    title: 'Мы не продаём набор услуг. Мы подбираем *конструктивное решение под ваш объект.*',
    note: 'Не нужно заказывать всё сразу — только те разделы, которые нужны вашему проекту.',
    items: [
      { code: 'КЖ', title: 'Железобетонные конструкции', text: 'Монолитные и сборные каркасы, плиты, стены, лестницы. Рабочая документация и спецификации.', style: 'inv', wide: false },
      { code: 'КМ · КМД', title: 'Металлические конструкции', text: 'Каркасы, фермы, покрытия большепролётных зданий и деталировка для завода.', style: 'grad', wide: false },
      { code: 'ОФ', title: 'Основания и фундаменты', text: 'Плитные, свайные и ленточные фундаменты по данным инженерно-геологических изысканий.', style: 'grad', wide: false },
      { code: 'СЕЙСМИКА', title: 'Расчёты на сейсмические воздействия', text: 'Пространственные модели, спектральный и динамический анализ с учётом сейсмичности площадки.', style: 'surface', wide: true },
      { code: 'ОБСЛЕДОВАНИЕ', title: 'Обследование и усиление', text: 'Техническое заключение о состоянии конструкций и проект усиления.', style: 'surface', wide: false },
      { code: 'НАДЗОР', title: 'Авторский надзор и экспертиза', text: 'Выезды на объект и сопровождение до положительного заключения.', style: 'surface', wide: false },
    ],
  },
  projects: {
    label: 'ИЗБРАННЫЕ ПРОЕКТЫ',
    title: 'Каждый объект — это *расчёт*, который выдерживает нагрузку',
    button: 'Все проекты',
    items: [
      { title: 'Жилой дом, 9 этажей + подвал', text: 'Монолитный каркас · Бишкек · КЖ, ОФ', image: '' },
      { title: 'Общеобразовательная школа', text: 'Сейсмичность 9 баллов · КЖ, сейсмика', image: '' },
      { title: 'Производственный корпус', text: 'Металлокаркас, пролёт 24 м · КМ, КМД', image: '' },
    ],
    video: 'видео / 3D-облёт объекта · 21:9',
    videoUrl: '',
    captionTitle: '*Надёжность*, заложенная в *расчёт*',
    captionText: 'Модели объектов собираем в расчётных комплексах и BIM-среде — те же данные лежат в основе чертежей.',
  },
  docs: {
    title: 'ЛИЦЕНЗИИ И ДОПУСКИ',
    items: [
      { title: 'Лицензия на проектную деятельность', number: '№ ______ · категория __', status: 'Действует до __.__.____', state: 'ok' },
      { title: 'Свидетельство о регистрации', number: 'ОсОО «Кульман» · ИНН ______', status: 'Бессрочно', state: 'ok' },
      { title: 'Аттестаты специалистов', number: 'ГИП, инженеры-конструкторы', status: 'Истекает через 30 дней', state: 'soon' },
      { title: 'Отзывы и благодарственные письма', number: 'От заказчиков', status: 'Публикуются с разрешения', state: 'muted' },
    ],
    tenderTitle: 'ДЛЯ ТЕНДЕРНЫХ КОМИССИЙ',
    links: [
      { label: 'Реквизиты компании', href: '#about' },
      { label: 'Лицензии и документы', href: '#docs' },
      { label: 'Опыт аналогичных объектов', href: '#projects' },
      { label: 'Специалисты', href: '#about' },
    ],
    download: 'Скачать карточку компании',
  },
  contacts: {
    title: 'Обсудим\nваш *объект*',
    phone: '+996 (___) __-__-__',
    email: 'info@culmann.kg',
    address: 'г. Бишкек · пн–пт, 9:00–18:00',
    successTitle: 'Заявка отправлена',
    successText: 'Инженер свяжется с вами в течение рабочего дня.',
  },
  footer: {
    requisites: 'ОсОО «Кульман» · ИНН ________ · юр. адрес ________',
    copyright: '© 2026 ОсОО «Кульман»',
    location: 'Бишкек, Кыргызская Республика',
  },
};

import { parseVideo } from './video';

/* ---------- Нормализация: что бы ни прислали — на выходе корректный Content ---------- */
const str = (v: unknown, d: string, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : d);
const arr = <T,>(v: unknown, d: T[], make: (x: Record<string, unknown>, tpl: T) => T, maxLen = 30): T[] => {
  if (!Array.isArray(v)) return d;
  return v.slice(0, maxLen).filter((x) => x && typeof x === 'object').map((x) => make(x as Record<string, unknown>, d[0]));
};
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

export function normalizeContent(input: unknown): Content {
  const D = DEFAULT_CONTENT, i = obj(input);
  const hero = obj(i.hero), s3 = obj(i.scene3), about = obj(i.about), why = obj(i.why), sv = obj(i.services);
  const pr = obj(i.projects), docs = obj(i.docs), ct = obj(i.contacts), ft = obj(i.footer);
  const state = (v: unknown): DocItem['state'] => (v === 'ok' || v === 'soon' || v === 'muted' ? v : 'muted');
  const style = (v: unknown): ServiceItem['style'] => (v === 'inv' || v === 'grad' || v === 'surface' ? v : 'surface');
  return {
    hero: {
      label: str(hero.label, D.hero.label), line1: str(hero.line1, D.hero.line1), line2: str(hero.line2, D.hero.line2),
      line3: str(hero.line3, D.hero.line3), lead: str(hero.lead, D.hero.lead), cta: str(hero.cta, D.hero.cta),
      // сцена 2 рассчитана ровно на 3 факта
      facts: [0, 1, 2].map((k) => {
        const f = obj(Array.isArray(hero.facts) ? hero.facts[k] : null);
        return { head: str(f.head, D.hero.facts[k].head, 200), text: str(f.text, D.hero.facts[k].text, 400) };
      }),
    },
    scene3: {
      line1: str(s3.line1, D.scene3.line1, 100), line2: str(s3.line2, D.scene3.line2, 100), line3: str(s3.line3, D.scene3.line3, 100),
      p1: str(s3.p1, D.scene3.p1), p2: str(s3.p2, D.scene3.p2), button: str(s3.button, D.scene3.button, 100),
    },
    about: {
      label: str(about.label, D.about.label), statement: str(about.statement, D.about.statement),
      stats: arr(about.stats, D.about.stats, (x) => ({ value: str(x.value, '', 40), label: str(x.label, '', 200) }), 8),
    },
    why: {
      label: str(why.label, D.why.label), text: str(why.text, D.why.text),
      items: arr(why.items, D.why.items, (x) => ({ title: str(x.title, '', 200), text: str(x.text, '', 600) }), 12),
    },
    services: {
      title: str(sv.title, D.services.title), note: str(sv.note, D.services.note),
      items: arr(sv.items, D.services.items, (x) => ({ code: str(x.code, '', 60), title: str(x.title, '', 200), text: str(x.text, '', 600), style: style(x.style), wide: x.wide === true }), 16),
    },
    projects: {
      label: str(pr.label, D.projects.label), title: str(pr.title, D.projects.title), button: str(pr.button, D.projects.button, 100),
      items: arr(pr.items, D.projects.items, (x) => ({ title: str(x.title, '', 200), text: str(x.text, '', 300), image: safeImage(str(x.image, '', 100)) }), 3),
      video: str(pr.video, D.projects.video, 200), videoUrl: parseVideo(str(pr.videoUrl, '', 300)) ? str(pr.videoUrl, '', 300).trim() : '', captionTitle: str(pr.captionTitle, D.projects.captionTitle), captionText: str(pr.captionText, D.projects.captionText),
    },
    docs: {
      title: str(docs.title, D.docs.title, 200),
      items: arr(docs.items, D.docs.items, (x) => ({ title: str(x.title, '', 200), number: str(x.number, '', 200), status: str(x.status, '', 200), state: state(x.state) }), 12),
      tenderTitle: str(docs.tenderTitle, D.docs.tenderTitle, 200),
      links: arr(docs.links, D.docs.links, (x) => ({ label: str(x.label, '', 200), href: safeHref(str(x.href, '#', 300)) }), 10),
      download: str(docs.download, D.docs.download, 200),
    },
    contacts: {
      title: str(ct.title, D.contacts.title, 300), phone: str(ct.phone, D.contacts.phone, 100), email: str(ct.email, D.contacts.email, 200),
      address: str(ct.address, D.contacts.address, 300), successTitle: str(ct.successTitle, D.contacts.successTitle, 200), successText: str(ct.successText, D.contacts.successText),
    },
    footer: { requisites: str(ft.requisites, D.footer.requisites), copyright: str(ft.copyright, D.footer.copyright, 200), location: str(ft.location, D.footer.location, 200) },
  };
}

/* Картинка — только загруженная через админку */
export const safeImage = (v: string) => (/^\/uploads\/[a-f0-9]{24}\.webp$/.test(v) ? v : '');

/* Ссылки только на якоря, относительные пути и http(s) — без javascript: */
export function safeHref(h: string): string {
  const v = h.trim();
  return /^(#|\/|https?:\/\/|mailto:|tel:)/i.test(v) ? v : '#';
}
