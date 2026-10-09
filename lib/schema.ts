/* Описание форм админки: какие поля и списки есть у каждого блока сайта. */
export type Field = { k: string; label: string; kind?: 'text' | 'area' | 'select' | 'bool' | 'image'; options?: [string, string][]; hint?: string };
export type ListDef = { k: string; label: string; itemLabel: string; fields: Field[]; fixed?: boolean; max?: number; template?: Record<string, string | boolean> };
export type Section = { key: string; title: string; hint?: string; fields: Field[]; lists?: ListDef[] };

const ACCENT = 'Слова в *звёздочках* выделяются акцентным цветом.';

export const SECTIONS: Section[] = [
  {
    key: 'hero', title: 'Первый экран', hint: 'Сцена 1 («здание») и сцена 2 («каркас», три факта). ' + ACCENT,
    fields: [
      { k: 'label', label: 'Метка над заголовком' },
      { k: 'line1', label: 'Заголовок, строка 1' },
      { k: 'line2', label: 'Заголовок, строка 2' },
      { k: 'line3', label: 'Заголовок, строка 3', hint: 'Пример: держится *город.*' },
      { k: 'lead', label: 'Абзац под заголовком', kind: 'area' },
      { k: 'cta', label: 'Текст круглой кнопки' },
    ],
    lists: [{ k: 'facts', label: 'Факты (сцена 2)', itemLabel: 'Факт', fixed: true, fields: [
      { k: 'head', label: 'Заголовок', hint: 'Пример: *15* лет' }, { k: 'text', label: 'Пояснение', kind: 'area' },
    ] }],
  },
  {
    key: 'scene3', title: 'Сцена 3 («узел»)', fields: [
      { k: 'line1', label: 'Заголовок, строка 1' }, { k: 'line2', label: 'Заголовок, строка 2' },
      { k: 'line3', label: 'Заголовок, строка 3 (акцентная)' },
      { k: 'p1', label: 'Абзац 1', kind: 'area' }, { k: 'p2', label: 'Абзац 2', kind: 'area' },
      { k: 'button', label: 'Текст кнопки' },
    ],
  },
  {
    key: 'about', title: 'О компании', hint: ACCENT, fields: [
      { k: 'label', label: 'Метка' }, { k: 'statement', label: 'Крупное утверждение', kind: 'area' },
    ],
    lists: [{ k: 'stats', label: 'Показатели', itemLabel: 'Показатель', max: 8, template: { value: '', label: '' }, fields: [
      { k: 'value', label: 'Значение', hint: 'Например: 15+' }, { k: 'label', label: 'Подпись' },
    ] }],
  },
  {
    key: 'why', title: 'Почему мы', fields: [{ k: 'label', label: 'Метка' }, { k: 'text', label: 'Текст слева', kind: 'area' }],
    lists: [{ k: 'items', label: 'Карточки (нумеруются автоматически)', itemLabel: 'Карточка', max: 12, template: { title: '', text: '' }, fields: [
      { k: 'title', label: 'Заголовок' }, { k: 'text', label: 'Описание', kind: 'area' },
    ] }],
  },
  {
    key: 'services', title: 'Услуги', hint: ACCENT, fields: [
      { k: 'title', label: 'Заголовок', kind: 'area' },
      { k: 'note', label: 'Текст в пустой ячейке между карточками', kind: 'area' },
    ],
    lists: [{ k: 'items', label: 'Карточки услуг', itemLabel: 'Услуга', max: 16, template: { code: '', title: '', text: '', style: 'surface', wide: false }, fields: [
      { k: 'code', label: 'Код / рубрика', hint: 'Например: КЖ' }, { k: 'title', label: 'Название' }, { k: 'text', label: 'Описание', kind: 'area' },
      { k: 'style', label: 'Оформление', kind: 'select', options: [['inv', 'Светлая (инвертированная)'], ['grad', 'Градиентная'], ['surface', 'Обычная']] },
      { k: 'wide', label: 'Широкая карточка со стрелкой ↗', kind: 'bool' },
    ] }],
  },
  {
    key: 'projects', title: 'Проекты', hint: ACCENT + ' Фото и видео пока заглушки.', fields: [
      { k: 'label', label: 'Метка' }, { k: 'title', label: 'Заголовок', kind: 'area' }, { k: 'button', label: 'Текст кнопки' },
      { k: 'video', label: 'Подпись на видео-блоке (пока видео нет)' },
      { k: 'videoUrl', label: 'Ссылка на видео', hint: 'YouTube, Vimeo или прямая ссылка на .mp4/.webm (https). Оставьте пустым, чтобы показать заглушку.' }, { k: 'captionTitle', label: 'Подпись под видео', kind: 'area' }, { k: 'captionText', label: 'Текст справа от подписи', kind: 'area' },
    ],
    lists: [{ k: 'items', label: 'Карточки проектов (три)', itemLabel: 'Проект', fixed: true, fields: [
      { k: 'image', label: 'Фото объекта', kind: 'image', hint: 'JPG, PNG или WebP до 10 МБ. Лучше горизонтальное, 4:3.' },
      { k: 'title', label: 'Название' }, { k: 'text', label: 'Описание' },
    ] }],
  },
  {
    key: 'docs', title: 'Лицензии и тендеры', fields: [
      { k: 'title', label: 'Заголовок блока' }, { k: 'tenderTitle', label: 'Заголовок панели для тендерных комиссий' }, { k: 'download', label: 'Текст кнопки скачивания' },
    ],
    lists: [
      { k: 'items', label: 'Документы', itemLabel: 'Документ', max: 12, template: { title: '', number: '', status: '', state: 'muted' }, fields: [
        { k: 'title', label: 'Название' }, { k: 'number', label: 'Номер / пояснение' }, { k: 'status', label: 'Статус (текст)' },
        { k: 'state', label: 'Цвет точки статуса', kind: 'select', options: [['ok', 'Зелёный — действует'], ['soon', 'Золотой — истекает'], ['muted', 'Серый — прочее']] },
      ] },
      { k: 'links', label: 'Ссылки для тендерных комиссий', itemLabel: 'Ссылка', max: 10, template: { label: '', href: '#' }, fields: [
        { k: 'label', label: 'Текст' }, { k: 'href', label: 'Адрес', hint: '#about, #docs, /файл.pdf или https://…' },
      ] },
    ],
  },
  {
    key: 'contacts', title: 'Контакты и заявка', hint: 'В заголовке перенос строки — Enter. ' + ACCENT, fields: [
      { k: 'title', label: 'Заголовок', kind: 'area' }, { k: 'phone', label: 'Телефон' }, { k: 'email', label: 'Email' }, { k: 'address', label: 'Адрес и график' },
      { k: 'successTitle', label: 'После отправки: заголовок' }, { k: 'successText', label: 'После отправки: текст', kind: 'area' },
    ],
  },
  {
    key: 'footer', title: 'Подвал', fields: [
      { k: 'requisites', label: 'Реквизиты', kind: 'area' }, { k: 'copyright', label: 'Копирайт' }, { k: 'location', label: 'Место' },
    ],
  },
];
