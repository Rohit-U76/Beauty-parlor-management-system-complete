import React, { useState } from 'react';
import { Sparkles, Calendar, Eye, X, ChevronRight, Video, Play, Film, Camera } from 'lucide-react';
import { useSalon } from '../context/SalonContext';
import { GalleryItem, GalleryCategory } from '../types';

export const CustomerGallery: React.FC = () => {
  const { gallery, openBookingModal } = useSalon();
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('All');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryItem | null>(null);

  const categories: GalleryCategory[] = [
    'All',
    'Bridal',
    'Hair Care',
    'Skin Care',
    'Salon Interior',
    'Nail Art',
    'Spa',
    'Men Grooming'
  ];

  const filteredGallery = gallery.filter(item => {
    const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
    if (mediaFilter === 'photo' && isVideo) return false;
    if (mediaFilter === 'video' && !isVideo) return false;

    if (activeCategory === 'All') return true;
    if (activeCategory === 'Bridal') return item.category === 'Bridal' || item.tag.includes('Bridal');
    if (activeCategory === 'Hair Care') return item.category === 'Hair Care' || item.category === 'Men Grooming' || item.tag.includes('Hair') || item.tag.includes('Men');
    if (activeCategory === 'Skin Care') return item.category === 'Skin Care' || item.tag.includes('Skin');
    if (activeCategory === 'Salon Interior') return item.category === 'Salon Interior';
    if (activeCategory === 'Nail Art') return item.category === 'Nail Art';
    if (activeCategory === 'Spa') return item.category === 'Spa';
    if (activeCategory === 'Men Grooming') return item.category === 'Men Grooming' || item.tag.includes('Men');
    return true;
  });

  const videoCount = gallery.filter(i => i.mediaType === 'video' || Boolean(i.videoUrl)).length;
  const photoCount = gallery.filter(i => i.mediaType !== 'video' && !i.videoUrl).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-12 space-y-8 text-left">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Salon Portfolio &amp; Style Reels</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Our Work, Styles &amp; Video Reels
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Watch real client transformations, haircuts, glowing bridal styling, and explore our modern salon in Mohol.
          </p>
        </div>

        <button
          onClick={() => openBookingModal()}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Media Type Filters & Category Pills */}
      <div className="space-y-3">
        {/* Photos vs Videos Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMediaFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              mediaFilter === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-amber-500/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Showcase ({gallery.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaFilter('photo')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              mediaFilter === 'photo'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-amber-500/50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos Only ({photoCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMediaFilter('video')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              mediaFilter === 'video'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-amber-500/50'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-500" />
            <span>Videos &amp; Reels ({videoCount})</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-purple-600 text-white dark:bg-zinc-200 dark:text-zinc-950 font-bold'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredGallery.map(item => {
          const isVideo = item.mediaType === 'video' || Boolean(item.videoUrl);
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group hover:border-amber-500/40"
            >
              {/* Media Thumbnail Container */}
              <div
                className="relative h-64 overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-800"
                onClick={() => setActiveLightboxItem(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Video Play Overlay */}
                {isVideo ? (
                  <>
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-amber-500/90 text-zinc-950 flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                      <Video className="w-3.5 h-3.5" />
                      <span>REEL {item.duration ? `• ${item.duration}` : ''}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2.5 rounded-full bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white shadow-lg">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                )}

                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-amber-300">
                  {item.tag}
                </div>
              </div>

              {/* Info & Action */}
              <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                    {isVideo && <Film className="w-3.5 h-3.5" />}
                    <span>{item.category}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveLightboxItem(item)}
                    className="text-xs font-bold text-purple-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isVideo ? 'Watch Reel' : 'View Full Photo'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openBookingModal()}
                    className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-zinc-950 font-bold text-xs transition cursor-pointer"
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal (Photo View or Video Player) */}
      {activeLightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in">
            <button
              onClick={() => setActiveLightboxItem(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* If video: render YouTube/Vimeo iframe or HTML5 video player */}
            {activeLightboxItem.mediaType === 'video' || activeLightboxItem.videoUrl ? (
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                {(() => {
                  const url = (activeLightboxItem.videoUrl || '').trim();
                  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                  if (ytMatch) {
                    return (
                      <iframe
                        key={activeLightboxItem.id}
                        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`}
                        title={activeLightboxItem.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  if (vimeoMatch) {
                    return (
                      <iframe
                        key={activeLightboxItem.id}
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
                        title={activeLightboxItem.title}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <video
                      key={`${activeLightboxItem.id}-${url}`}
                      src={url}
                      poster={activeLightboxItem.imageUrl}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support playing this video format.
                    </video>
                  );
                })()}
              </div>
            ) : (
              <img
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.title}
                className="w-full h-80 sm:h-96 object-cover"
              />
            )}

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1.5">
                  {activeLightboxItem.mediaType === 'video' && <Video className="w-3.5 h-3.5 text-rose-500" />}
                  <span>{activeLightboxItem.category} • {activeLightboxItem.tag}</span>
                </span>
                <button
                  onClick={() => {
                    setActiveLightboxItem(null);
                    openBookingModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book This Style</span>
                </button>
              </div>

              <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeLightboxItem.title}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {activeLightboxItem.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
