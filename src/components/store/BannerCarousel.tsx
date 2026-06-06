"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
}

interface Props {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length]);
  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, banners.length]);

  if (!banners.length) return null;

  return (
    <section
      className="relative overflow-hidden bg-gray-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="relative h-[220px] sm:h-[360px] md:h-[460px]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            {b.link ? (
              <Link href={b.link} className="block w-full h-full">
                <img src={b.imageUrl} alt={b.title || `Banner ${i + 1}`} className="w-full h-full object-cover" />
              </Link>
            ) : (
              <img src={b.imageUrl} alt={b.title || `Banner ${i + 1}`} className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/55 text-white p-2 rounded-full transition-colors"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/55 text-white p-2 rounded-full transition-colors"
            aria-label="Ảnh tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${i === current ? "w-6 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/55 hover:bg-white/80"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
