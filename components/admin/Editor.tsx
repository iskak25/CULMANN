'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Content } from '@/lib/content';
import { SECTIONS, type Field, type ListDef } from '@/lib/schema';
import type { Lead } from '@/lib/store';

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function ImageInput({ f, value, onChange }: { f: Field; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setErr('');
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok && j.url) onChange(j.url); else setErr(j.error || 'Не удалось загрузить файл');
    setBusy(false);
  };
  return (
    <div className="adm-f adm-img">{f.label}
      <div className="adm-img-row">
        <div className="adm-thumb">{value ? <img src={value} alt="" /> : <span>нет фото</span>}</div>
        <div className="adm-img-btns">
          <label className="adm-btn">{busy ? 'Загружаем…' : value ? 'Заменить фото' : 'Загрузить фото'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {value && <button type="button" className="adm-btn adm-danger" onClick={() => onChange('')}>Убрать</button>}
        </div>
      </div>
      {err && <span className="adm-err">{err}</span>}
      {f.hint && <small>{f.hint}</small>}
    </div>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: string | boolean) => void }) {
  if (f.kind === 'image') return <ImageInput f={f} value={String(value ?? '')} onChange={onChange} />;
  if (f.kind === 'bool') {
    return (
      <label className="adm-check"><input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>
    );
  }
  return (
    <label className="adm-f">{f.label}
      {f.kind === 'area' ? (
        <textarea rows={3} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      ) : f.kind === 'select' ? (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : (
        <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )}
      {f.hint && <small>{f.hint}</small>}
    </label>
  );
}

function ListEditor({ def, items, onChange }: { def: ListDef; items: Obj[]; onChange: (v: Obj[]) => void }) {
  const set = (i: number, k: string, v: string | boolean) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const c = items.slice(); [c[i], c[j]] = [c[j], c[i]]; onChange(c);
  };
  const canAdd = !def.fixed && items.length < (def.max ?? 20);
  return (
    <div className="adm-list">
      <h3>{def.label}</h3>
      {items.map((it, i) => (
        <div className="adm-item" key={i}>
          <div className="adm-item-head">
            <b>{def.itemLabel} {i + 1}</b>
            <span>
              <button type="button" className="adm-mini" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">↑</button>
              <button type="button" className="adm-mini" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Ниже">↓</button>
              {!def.fixed && (
                <button type="button" className="adm-mini adm-danger" aria-label="Удалить"
                  onClick={() => { if (confirm(`Удалить: ${def.itemLabel} ${i + 1}?`)) onChange(items.filter((_, j) => j !== i)); }}>✕</button>
              )}
            </span>
          </div>
          <div className="adm-grid">
            {def.fields.map((f) => <FieldInput key={f.k} f={f} value={it[f.k]} onChange={(v) => set(i, f.k, v)} />)}
          </div>
        </div>
      ))}
      {canAdd && <button type="button" className="adm-btn" onClick={() => onChange([...items, { ...(def.template ?? {}) }])}>+ Добавить</button>}
    </div>
  );
}

function LeadsView({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const patch = async (id: string, body: Obj) => {
    const r = await fetch('/api/admin/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }) });
    if (r.ok) setLeads(await r.json());
  };
  if (!leads.length) return <p className="adm-muted">Заявок пока нет. Они появятся здесь после отправки формы на сайте.</p>;
  return (
    <div className="adm-leads">
      {leads.map((l) => (
        <article key={l.id} className={'adm-lead' + (l.done ? ' done' : '')}>
          <header>
            <b>{l.name}</b> <span className="adm-muted">{new Date(l.at).toLocaleString('ru-RU')}</span>
            {l.topic && <span className="adm-tag">{l.topic}</span>}
          </header>
          <div>{l.contact}{l.org ? ` · ${l.org}` : ''}</div>
          <p>{l.message}</p>
          <footer>
            <button type="button" className="adm-btn" onClick={() => patch(l.id, { done: !l.done })}>{l.done ? 'Вернуть в работу' : 'Отметить обработанной'}</button>
            <button type="button" className="adm-btn adm-danger" onClick={() => { if (confirm('Удалить заявку безвозвратно?')) patch(l.id, { remove: true }); }}>Удалить</button>
          </footer>
        </article>
      ))}
    </div>
  );
}

export default function Editor({ initialContent, initialLeads }: { initialContent: Content; initialLeads: Lead[] }) {
  const [content, setContent] = useState<Obj>(initialContent);
  const [saved, setSaved] = useState<string>(JSON.stringify(initialContent));
  const [tab, setTab] = useState<string>(SECTIONS[0].key);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = useMemo(() => JSON.stringify(content) !== saved, [content, saved]);
  const openLeads = initialLeads.filter((l) => !l.done).length;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const setField = (sec: string, k: string, v: unknown) => { setContent((c) => ({ ...c, [sec]: { ...c[sec], [k]: v } })); setStatus(null); };

  const save = async () => {
    setBusy(true); setStatus(null);
    const r = await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
    if (r.ok) {
      const clean = await r.json();
      setContent(clean); setSaved(JSON.stringify(clean));
      setStatus({ ok: true, text: 'Сохранено. Изменения уже на сайте.' });
    } else if (r.status === 401) {
      setStatus({ ok: false, text: 'Сессия истекла. Обновите страницу и войдите снова (несохранённые правки останутся только до обновления — скопируйте их).' });
    } else {
      setStatus({ ok: false, text: 'Не удалось сохранить: ' + ((await r.json().catch(() => ({}))).error || r.status) });
    }
    setBusy(false);
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); location.reload(); };
  const sec = SECTIONS.find((s) => s.key === tab);

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-logo"><i /> CULMANN <small>админка</small></div>
        <nav>
          {SECTIONS.map((s) => (
            <button key={s.key} className={tab === s.key ? 'on' : ''} onClick={() => setTab(s.key)}>{s.title}</button>
          ))}
          <button className={tab === 'leads' ? 'on' : ''} onClick={() => setTab('leads')}>Заявки{openLeads > 0 && <span className="adm-badge">{openLeads}</span>}</button>
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noreferrer">Открыть сайт ↗</a>
          <button onClick={logout}>Выйти</button>
        </div>
      </aside>

      <main className="adm-main">
        {tab === 'leads' ? (
          <>
            <h1>Заявки с сайта</h1>
            <LeadsView initial={initialLeads} />
          </>
        ) : sec && (
          <>
            <div className="adm-bar">
              <h1>{sec.title}</h1>
              <div className="adm-bar-r">
                {status && <span className={status.ok ? 'adm-ok' : 'adm-err'} role="status">{status.text}</span>}
                {dirty && !status && <span className="adm-muted">Есть несохранённые изменения</span>}
                <button className="adm-btn adm-primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Сохраняем…' : 'Сохранить'}</button>
              </div>
            </div>
            {sec.hint && <p className="adm-hint">{sec.hint}</p>}
            <div className="adm-grid">
              {sec.fields.map((f) => <FieldInput key={f.k} f={f} value={content[sec.key][f.k]} onChange={(v) => setField(sec.key, f.k, v)} />)}
            </div>
            {sec.lists?.map((l) => (
              <ListEditor key={l.k} def={l} items={content[sec.key][l.k]} onChange={(v) => setField(sec.key, l.k, v)} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}
