import { NextResponse } from 'next/server';
import { COOKIE, checkPassword, configured, makeToken, rateLimit } from '@/lib/auth';

export async function POST(req: Request) {
  if (!configured()) return NextResponse.json({ error: 'Админка не настроена: задайте ADMIN_PASSWORD и ADMIN_SECRET в .env.local' }, { status: 500 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit('login:' + ip, 8, 10 * 60 * 1000)) return NextResponse.json({ error: 'Слишком много попыток. Подождите 10 минут.' }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.password !== 'string' || !checkPassword(body.password)) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' && req.url.startsWith('https'), path: '/', maxAge: 12 * 60 * 60 });
  return res;
}
