/* Разбор ссылки на видео. Принимаются только YouTube, Vimeo и прямые файлы .mp4/.webm по https. */
export type VideoSrc = { kind: 'iframe' | 'file'; src: string };

export function parseVideo(raw: string): VideoSrc | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');

  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    return /^[\w-]{6,20}$/.test(id) ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` } : null;
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,20})/)?.[1] ?? '');
    return /^[\w-]{6,20}$/.test(id) ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` } : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.match(/(\d{5,12})/)?.[1];
    return id ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}?autoplay=1` } : null;
  }
  if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: 'file', src: u.toString() };
  return null;
}
