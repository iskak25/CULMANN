'use client';

import { useState } from 'react';

export default function Login() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) { location.reload(); return; }
    setErr((await r.json().catch(() => ({}))).error || 'Ошибка входа');
    setBusy(false);
  };

  return (
    <main className="adm-center">
      <form className="adm-card" onSubmit={submit}>
        <div className="adm-logo"><i /> CULMANN</div>
        <h1>Вход в админку</h1>
        <label className="adm-f">Пароль
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" required />
        </label>
        {err && <div className="adm-err" role="alert">{err}</div>}
        <button className="adm-btn adm-primary" type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
      </form>
    </main>
  );
}
