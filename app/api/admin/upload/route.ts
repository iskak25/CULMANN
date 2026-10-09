import { NextResponse } from 'next/server';
import sharp from 'sharp';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { isAdmin, rateLimit } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 МБ
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

/* Загрузка фото. Файл не сохраняется «как есть»: сервер сам декодирует картинку,
   уменьшает до 2000 px, убирает метаданные (EXIF, GPS) и записывает заново как WebP.
   Подделанный или повреждённый файл просто не декодируется и отклоняется. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  if (!rateLimit('upload', 40, 10 * 60 * 1000)) return NextResponse.json({ error: 'Слишком много загрузок, подождите' }, { status: 429 });

  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_BYTES + 100_000) return NextResponse.json({ error: 'Файл больше 10 МБ' }, { status: 413 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Файл не получен' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Файл больше 10 МБ' }, { status: 413 });
  if (file.size === 0) return NextResponse.json({ error: 'Пустой файл' }, { status: 400 });

  const input = Buffer.from(await file.arrayBuffer());
  try {
    const meta = await sharp(input, { limitInputPixels: 80_000_000 }).metadata();
    if (!meta.format || !['jpeg', 'png', 'webp'].includes(meta.format)) {
      return NextResponse.json({ error: 'Подходят только JPG, PNG и WebP' }, { status: 415 });
    }
    const out = await sharp(input, { limitInputPixels: 80_000_000 })
      .rotate() // учесть ориентацию из EXIF до того, как метаданные будут удалены
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const name = crypto.randomBytes(12).toString('hex') + '.webp';
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), out);
    return NextResponse.json({ url: '/uploads/' + name });
  } catch {
    return NextResponse.json({ error: 'Не удалось прочитать картинку. Проверьте, что это JPG, PNG или WebP.' }, { status: 400 });
  }
}
