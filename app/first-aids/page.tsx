'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

import GooLoader from '@/components/ui/Loader/GooLoader';
import FirstAidCard from '@/components-page/firstAids/FirstAidCard';

import { GET_ALL_FIRST_AID_DETAILS } from '@/graphql/Queries/firstAidDetailQueries';
import { FirstAidDetail } from '@/graphql/types/firstAidDetail';
import Hero from '@/components-page/firstAids/Hero';

// Resolve relative image URLs from API
const BASE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');
const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  if (!BASE_URL) return url;
  return url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
};

function GroupStackCard({
  items,
  onOpen,
}: {
  items: FirstAidDetail[];
  onOpen: () => void;
}) {
  const top = items[0];
  const previews = items.slice(0, 3);

  return (
    <button
      onClick={onOpen}
      className="relative w-full text-left"
      aria-label={`Open ${top.emergencySubCategory?.name || ''} steps`}
    >
      {/* stacked previews */}
      <div className="pointer-events-none">
        {previews.map((d, i) => {
          if (i === previews.length - 1) return null;
          const depth = previews.length - i - 1;
          const translate = depth * 10;
          const rotate = depth * -2;
          return (
            <div
              key={`back-${d.id}`}
              className="absolute inset-0 rounded-2xl border border-gray-200 bg-white shadow-md"
              style={{
                transform: `translate(${translate}px, ${translate}px) rotate(${rotate}deg)`,
                zIndex: i,
                overflow: 'hidden',
              }}
            >
              <div className="relative w-full pt-[56%] bg-gray-100">
                <img
                  src={resolveImageUrl(d.imageUrl)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* top card */}
      <div className="relative" style={{ zIndex: previews.length }}>
        <FirstAidCard detail={top} />
      </div>

      {items.length > 1 && (
        <span className="absolute -bottom-2 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow">
          {items.length} steps
        </span>
      )}
    </button>
  );
}

function FirstAidGalleryModal({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: FirstAidDetail[];
}) {
  if (!open) return null;

  const title = items[0]?.emergencySubCategory?.name || 'First Aid';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      <div className="relative mx-auto w-full max-w-6xl grow overflow-y-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="rounded-2xl bg-white/90 p-4 shadow-xl dark:bg-neutral-900"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {title}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({items.length} steps)
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white p-2 text-gray-700 shadow hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-200 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 xxl:grid-cols-5">
            {items.map((it) => (
              <motion.div
                key={it.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <FirstAidCard detail={it} variant="grid" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

export default function Page() {
  const { data, loading, error } = useQuery(GET_ALL_FIRST_AID_DETAILS);

  const details: FirstAidDetail[] = data?.firstAidDetails || [];

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; description: string; items: FirstAidDetail[] }>();
    details.forEach((d) => {
      const key = String(d.emergencySubCategoryId);
      const name = d.emergencySubCategory?.name || '';
      const description = d.emergencySubCategory?.description || '';
      if (!map.has(key)) map.set(key, { name, description, items: [] });
      map.get(key)!.items.push(d);
    });
    return Array.from(map, ([id, g]) => ({
      id,
      name: g.name,
      description: g.description,
      items: g.items.sort((a, b) => a.displayOrder - b.displayOrder),
    }));
  }, [details]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<FirstAidDetail[]>([]);

  const openGallery = (items: FirstAidDetail[]) => {
    setGalleryItems(items);
    setGalleryOpen(true);
  };

  return (
    <div className="space-y-6 bg-blue-50/50">
      <Hero/>

      {loading && <GooLoader />}
      {error && <p className="text-red-500">Unable to load first-aid steps.</p>}

      {!loading && !error && groups.length === 0 && (
        <p className="text-gray-500">No first-aid instructions available.</p>
      )}
      <div className='container mx-auto px-8 py-2 mb-6'>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 xxl:grid-cols-5">
            {groups.map((g) => (
            <div key={g.id} className="relative">
                <div className="mb-0 text-lg font-semibold text-gray-700">{g.name}</div>
                <div className="mb-2 text-sm font-light text-orange-400">{g.description}</div>
                {g.items.length > 1 ? (
                <GroupStackCard items={g.items} onOpen={() => openGallery(g.items)} />
                ) : (
                <button className="w-full text-left" onClick={() => openGallery(g.items)}>
                    <FirstAidCard detail={g.items[0]} />
                </button>
                )}
            </div>
            ))}
        </div>
      </div>
      <FirstAidGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        items={galleryItems}
      />
    </div>
  );
}
