const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');
  let candidate: string | null = null;
  if (host === 'youtu.be') {
    candidate = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'youtube.com' || host === 'music.youtube.com') {
    if (parsed.pathname === '/watch') {
      candidate = parsed.searchParams.get('v');
    } else {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' || parts[0] === 'embed') {
        candidate = parts[1] ?? null;
      }
    }
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`;
}
