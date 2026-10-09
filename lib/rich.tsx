import { Fragment, type ReactNode } from 'react';
import { css } from './css';

/* Текст с акцентом: слова в *звёздочках* красятся акцентным цветом, \n — перенос строки. */
const ACCENT = css('color:var(--accent)');

export function rich(text: string): ReactNode {
  return text.split('\n').map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {line.split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <span key={i} style={ACCENT}>{part}</span> : <Fragment key={i}>{part}</Fragment>))}
    </Fragment>
  ));
}

/* Без разметки — для aria-label и title */
export const plain = (text: string) => text.replace(/\*/g, '').replace(/\n/g, ' ');
