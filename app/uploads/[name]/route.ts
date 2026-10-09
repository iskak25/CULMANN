import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

/* Выдача загруженных фото из data/uploads. Имя строго ограничено — выйти из папки нельзя.
   Через маршрут, а не public/, потому что Next не видит в public файлы, добавленные после сборки. */
const DIR = path.join(process.cwd(), 'data', 'uploads');

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-f0-9]{24}\.webp$/.test(name)) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(DIR, name));
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
