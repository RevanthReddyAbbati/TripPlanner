// Destination photos from Wikipedia's page summary API: free, no key, and the lead images are
// openly licensed on Wikimedia Commons. Every photo carries a link to its file page for credit.
//
// Catalog destinations map to hand-picked article titles whose lead image is a photograph
// (district articles often lead with a map). Any other town falls back to its own name.

export interface Photo {
  /** Thumbnail URL template; `{w}` is replaced with a standard Wikimedia width. */
  template: string;
  /** Used when the image is too small to have thumbnails. */
  original: string;
  width: number;
  height: number;
  /** File description page, for attribution and licence. */
  credit: string;
  alt: string;
}

const TITLES: Record<string, string> = {
  'north-goa': 'Calangute',
  'south-goa': 'Palolem',
  gokarna: 'Gokarna, Karnataka',
  hampi: 'Hampi',
  coorg: 'Kodagu district',
  mysuru: 'Mysore Palace',
  pondicherry: 'Promenade Beach',
  munnar: 'Munnar',
  alleppey: 'Alappuzha',
  ooty: 'Ooty',
  udaipur: 'Udaipur',
  jaipur: 'Hawa Mahal',
  manali: 'Manali, Himachal Pradesh',
  rishikesh: 'Laxman Jhula',
};

/** Widths Wikimedia serves without on-demand rendering. */
export const PHOTO_WIDTHS = [330, 500, 960, 1280, 1920] as const;

const CACHE_KEY = 'itinera-photos-v1';
const MISS = null;
type CacheEntry = Photo | typeof MISS;

let memory: Record<string, CacheEntry> | undefined;
const inflight = new Map<string, Promise<Photo | null>>();

function cache(): Record<string, CacheEntry> {
  if (memory) return memory;
  try {
    memory = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, CacheEntry>;
  } catch {
    memory = {};
  }
  return memory;
}

function persist() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(memory ?? {}));
  } catch {
    /* storage full or blocked: memory cache still works */
  }
}

export function photoTitle(dest: { id?: string; name: string; state?: string }): string {
  return (dest.id && TITLES[dest.id]) || dest.name.replace(/\s*\(.*\)\s*/g, ' ').trim();
}

interface Summary {
  type?: string;
  title?: string;
  description?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
}

function toPhoto(s: Summary, title: string): Photo | null {
  if (s.type !== 'standard' || !s.originalimage || !s.thumbnail) return null;
  const { source: original, width, height } = s.originalimage;
  // Skip maps, flags, seals and portrait-only montages: they don't work as a cover.
  if (/map|flag|seal|emblem|logo|locator|montage|collage/i.test(original) || width < height * 1.05 || width < 640) return null;
  const thumb = s.thumbnail.source.split('?')[0];
  const template = /\/\d+px-/.test(thumb) ? thumb.replace(/\/\d+px-/, '/{w}px-') : '';
  const file = decodeURIComponent(original.split('?')[0].split('/').pop() ?? '').replace(/^\d+px-/, '');
  return {
    template,
    original: original.split('?')[0],
    width,
    height,
    credit: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`,
    alt: s.description ? `${s.title}, ${s.description}` : (s.title ?? title),
  };
}

/** Looks up a cover photo. Resolves to null when there is no suitable photograph. */
export function fetchPhoto(title: string): Promise<Photo | null> {
  const c = cache();
  if (title in c) return Promise.resolve(c[title]);
  const existing = inflight.get(title);
  if (existing) return existing;
  const p = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, {
    headers: { Accept: 'application/json' },
  })
    .then((r) => (r.ok ? (r.json() as Promise<Summary>) : ({} as Summary)))
    .then((s) => {
      const photo = toPhoto(s, title);
      cache()[title] = photo;
      persist();
      return photo;
    })
    .catch(() => null) // offline: don't cache, try again next time
    .finally(() => inflight.delete(title));
  inflight.set(title, p);
  return p;
}

/** src and srcSet for an <img>, capped at the original size. */
export function photoSources(p: Photo, maxWidth = 1920): { src: string; srcSet?: string } {
  if (!p.template) return { src: p.original };
  const widths = PHOTO_WIDTHS.filter((w) => w < p.width && w <= maxWidth);
  if (!widths.length) return { src: p.original };
  return {
    src: p.template.replace('{w}', String(widths[Math.min(widths.length - 1, 2)])),
    srcSet: widths.map((w) => `${p.template.replace('{w}', String(w))} ${w}w`).join(', '),
  };
}
