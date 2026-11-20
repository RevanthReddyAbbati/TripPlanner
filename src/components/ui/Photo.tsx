// Destination cover photo: a calm placeholder drawn from the destination's colour, then the
// photograph fades in once decoded. Falls back to the placeholder when there is no photo.
import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { fetchPhoto, photoSources, photoTitle, type Photo } from '../../services/photos';

export function usePhoto(dest: { id?: string; name: string } | undefined): Photo | null | undefined {
  const title = dest ? photoTitle(dest) : '';
  const [photo, setPhoto] = useState<Photo | null | undefined>(undefined);
  useEffect(() => {
    if (!title) return;
    let alive = true;
    setPhoto(undefined);
    fetchPhoto(title).then((p) => alive && setPhoto(p));
    return () => {
      alive = false;
    };
  }, [title]);
  return photo;
}

export function DestinationPhoto({
  dest,
  className,
  sizes = '(min-width: 1024px) 33vw, 100vw',
  color = '#2557d6',
  priority,
  credit = true,
  children,
  zoomOnHover,
}: {
  dest: { id?: string; name: string } | undefined;
  className?: string;
  sizes?: string;
  color?: string;
  priority?: boolean;
  credit?: boolean;
  children?: ReactNode;
  /** Slow, small zoom when a parent with the `group` class is hovered. */
  zoomOnHover?: boolean;
}) {
  const photo = usePhoto(dest);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [photo]);
  const src = photo ? photoSources(photo) : undefined;

  return (
    <div className={clsx('relative isolate overflow-hidden bg-sunken', className)}>
      {/* Placeholder: a quiet tone of the destination colour with a route line, so a card never looks broken */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${color}33, ${color}14 55%, transparent), rgb(var(--sunken))` }}
      >
        <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 60">
          <path d="M-5 48 C 20 40, 30 18, 55 24 S 90 8, 105 12" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="0.4 2.2" strokeLinecap="round" />
        </svg>
        {photo === undefined && <div className="skeleton absolute inset-0" />}
      </div>
      {photo && src && (
        <img
          src={src.src}
          srcSet={src.srcSet}
          sizes={sizes}
          alt={photo.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // React 18 only passes the lowercase attribute through to the DOM
          {...{ fetchpriority: priority ? 'high' : 'auto' }}
          onLoad={() => setLoaded(true)}
          className={clsx(
            'photo-in absolute inset-0 h-full w-full object-cover',
            loaded ? 'opacity-100' : 'opacity-0',
            zoomOnHover && 'transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]',
          )}
        />
      )}
      {children}
      {photo && credit && (
        <a
          href={photo.credit}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1.5 right-2 z-10 rounded bg-black/35 px-1.5 py-0.5 text-[10.5px] text-white/85 opacity-0 transition-opacity hover:text-white focus:opacity-100 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          Photo · Wikimedia Commons
        </a>
      )}
    </div>
  );
}
