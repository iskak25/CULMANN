import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_CONTENT, normalizeContent, type Content } from './content';

/* Хранилище: JSON-файлы в папке data/ (создаётся автоматически).
   Для переезда на базу данных достаточно заменить эти четыре функции. */
const DIR = path.join(process.cwd(), 'data');
const CONTENT = path.join(DIR, 'content.json');
const LEADS = path.join(DIR, 'leads.json');

async function readJson<T>(file: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) as T; } catch { return null; }
}
async function writeJson(file: string, data: unknown) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, file); // атомарная замена — файл не окажется записанным наполовину
}

export async function readContent(): Promise<Content> {
  const raw = await readJson<unknown>(CONTENT);
  return raw ? normalizeContent(raw) : DEFAULT_CONTENT;
}
export async function writeContent(c: Content) { await writeJson(CONTENT, c); }

export type Lead = { id: string; at: string; name: string; contact: string; org: string; topic: string; message: string; done: boolean };

export async function readLeads(): Promise<Lead[]> {
  return (await readJson<Lead[]>(LEADS)) ?? [];
}
export async function addLead(l: Omit<Lead, 'id' | 'at' | 'done'>): Promise<Lead> {
  const leads = await readLeads();
  const lead: Lead = { ...l, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: new Date().toISOString(), done: false };
  leads.unshift(lead);
  await writeJson(LEADS, leads.slice(0, 2000));
  return lead;
}
export async function updateLead(id: string, patch: { done?: boolean; remove?: boolean }) {
  let leads = await readLeads();
  if (patch.remove) leads = leads.filter((l) => l.id !== id);
  else leads = leads.map((l) => (l.id === id ? { ...l, done: patch.done ?? l.done } : l));
  await writeJson(LEADS, leads);
}
