import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { normalizeContent } from '@/lib/content';
import { readContent, writeContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  return NextResponse.json(await readContent());
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
  const clean = normalizeContent(body); // отбрасывает лишние поля, ограничивает длины и типы
  await writeContent(clean);
  return NextResponse.json(clean);
}
