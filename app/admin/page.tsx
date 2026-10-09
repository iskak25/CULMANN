import type { Metadata } from 'next';
import { configured, isAdmin } from '@/lib/auth';
import { readContent, readLeads } from '@/lib/store';
import Login from '@/components/admin/Login';
import Editor from '@/components/admin/Editor';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Админка — CULMANN', robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!configured()) {
    return (
      <main className="adm-center"><div className="adm-card">
        <h1>Админка не настроена</h1>
        <p>Создайте файл <code>.env.local</code> рядом с <code>package.json</code> и задайте две строки:</p>
        <pre>{'ADMIN_PASSWORD=ваш-пароль\nADMIN_SECRET=длинная-случайная-строка-32-символа-и-больше'}</pre>
        <p>Затем перезапустите сайт.</p>
      </div></main>
    );
  }
  if (!(await isAdmin())) return <Login />;
  const [content, leads] = await Promise.all([readContent(), readLeads()]);
  return <Editor initialContent={content} initialLeads={leads} />;
}
