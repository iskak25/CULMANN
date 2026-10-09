import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

/* Вход в админку: пароль из ADMIN_PASSWORD (файл .env.local), сессия — подписанная cookie (HMAC), 12 часов. */
export const COOKIE = 'culmann-admin';
const TTL = 12 * 60 * 60 * 1000;

const secret = () => process.env.ADMIN_SECRET || '';
const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('hex');

export function configured() {
  return !!process.env.ADMIN_PASSWORD && secret().length >= 16;
}

export function checkPassword(p: string): boolean {
  const real = process.env.ADMIN_PASSWORD || '';
  const a = crypto.createHash('sha256').update(p).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return real.length > 0 && crypto.timingSafeEqual(a, b);
}

export function makeToken(): string {
  const exp = String(Date.now() + TTL);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(t: string | undefined): boolean {
  if (!t || !configured()) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

export async function isAdmin(): Promise<boolean> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

/* Простейшее ограничение частоты запросов (в памяти процесса) */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return false; }
  list.push(now); hits.set(key, list);
  return true;
}
