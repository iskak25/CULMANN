import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { readLeads, updateLead } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  return NextResponse.json(await readLeads());
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (typeof b.id !== 'string') return NextResponse.json({ error: 'Нужен id' }, { status: 400 });
  await updateLead(b.id, { done: typeof b.done === 'boolean' ? b.done : undefined, remove: b.remove === true });
  return NextResponse.json(await readLeads());
}
