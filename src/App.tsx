import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

type Photo = {
  src: string;
  name: string;
};

function App() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<string, boolean>>({});

  // Auto-load every image in src/photos/ — just drop files in and they appear.
  const photos = useMemo<Photo[]>(() => {
    const modules = import.meta.glob('/src/photos/*.{jpg,jpeg,png,webp,gif,svg,JPG,JPEG,PNG,WEBP,GIF,SVG}', {
      eager: true,
      query: '?url',
      import: 'default',
    }) as Record<string, string>;

    return Object.entries(modules)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([path, src]) => ({
        src,
        name: path.split('/').pop() ?? '',
      }));
  }, []);

  const loadLikes = useCallback(() => {
    try {
      setLikes(JSON.parse(localStorage.getItem('milana-likes') ?? '{}'));
    } catch {
      setLikes({});
    }
  }, []);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  const toggleLike = useCallback(
    (name: string) => {
      setLikes((prev) => {
        const next = { ...prev, [name]: !prev[name] };
        localStorage.setItem('milana-likes', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const showPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  const likedCount = useMemo(() => Object.values(likes).filter(Boolean).length, [likes]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight">
            Альбом <span className="font-semibold">Миланы</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>{likedCount}</span>
            <span className="text-neutral-300">·</span>
            <span>{photos.length} фото</span>
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-neutral-300" />
            </div>
            <h2 className="text-lg font-medium text-neutral-700 mb-2">Здесь пока пусто</h2>
            <p className="text-sm text-neutral-400 max-w-xs">
              Добавь фотографии в папку <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-xs">src/photos</code> — и они появятся здесь автоматически.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
            {photos.map((photo, index) => {
              const liked = !!likes[photo.name];
              return (
                <div
                  key={photo.src}
                  className="relative group break-inside-avoid rounded-xl overflow-hidden bg-neutral-100 cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={photo.src}
                    alt={photo.name}
                    loading="lazy"
                    className="w-full block transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(photo.name);
                    }}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    aria-label="Нравится"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors duration-200 ${
                        liked ? 'fill-rose-500 text-rose-500' : 'text-neutral-600'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-neutral-400">
        Альбом Миланы
      </footer>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={closeLightbox}
            aria-label="Закрыть"
          >
            <X className="w-7 h-7" />
          </button>

          <button
            className="absolute left-2 sm:left-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            aria-label="Предыдущее"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={photos[lightboxIndex].src}
            alt={photos[lightboxIndex].name}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-2 sm:right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            aria-label="Следующее"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
