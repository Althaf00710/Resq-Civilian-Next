'use client';

import React from 'react';
import Image from 'next/image';
import { Snake } from '@/graphql/types/snake';

interface SnakeCardProps {
  snake: Snake;
}

const venomColorMap: Record<string, string> = {
  neurotoxic: 'bg-blue-600 dark:bg-blue-500',
  hemotoxic: 'bg-red-600 dark:bg-red-500',
  cytotoxic: 'bg-yellow-500 dark:bg-yellow-400 text-black',
  'non-venomous': 'bg-green-600 dark:bg-green-500',
};

const SnakeCard: React.FC<SnakeCardProps> = ({ snake }) => {
  const venomClass =
    venomColorMap[snake.venomType.toLowerCase()] || 'bg-gray-600 dark:bg-gray-500';

  const BASE = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');
  const path = snake.imageUrl?.startsWith('/') ? snake.imageUrl : `/${snake.imageUrl}`;
  const src = `${BASE}${path}`;

  return (
    <div className="bg-gray-200 dark:bg-neutral-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
        <Image
          src={src}
          alt={snake.name}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
          priority={false}
        />
        <span
          className={`absolute top-2 right-2 text-white text-xs font-semibold px-2 py-1 rounded-full ${venomClass}`}
        >
          {snake.venomType}
        </span>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-0">
          {snake.name}
        </h2>
        <h3 className="text-sm text-orange-400 dark:text-gray-400 mt-0 italic">
          {snake.scientificName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {snake.description}
        </p>
      </div>
    </div>
  );
};

export default SnakeCard;
