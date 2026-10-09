import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/auth';
import { addLead } from '@/lib/store';

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!rateLimit('lead:' + ip, 5, 10 * 60 * 1000)) return NextResponse.json({ error: 'Слишком много заявок, попробуйте позже' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // honeypot: боты заполняют скрытое поле
  const name = clip(b.name, 120), contact = clip(b.contact, 160), message = clip(b.message, 4000);
  if (!name || !contact || !message) return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
  await addLead({ name, contact, org: clip(b.org, 200), topic: clip(b.topic, 60), message });
  return NextResponse.json({ ok: true });
}
