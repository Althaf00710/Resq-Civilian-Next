'use client';

import React, { useState } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';
import Hero from '@/components-page/snakes/Hero';
import { GET_ALL_SNAKES, PREDICT_SNAKE } from '@/graphql/Queries/snakeQueries';
import { Snake, SnakePrediction } from '@/graphql/types/snake';
import SnakeCard from '@/components-page/snakes/SnakeCard';
import PredictedSnake from '@/components-page/snakes/PredictedSnake';
import SnakePredictModal from '@/components-page/snakes/SnakePredictModal';
import KnowVenomSection from '@/components-page/snakes/KnowVenomSection';
import SnakeVenom from '@/components-page/snakes/SnakeVenom';

function Page() {
  const { data, loading, error } = useQuery<{ snakes: Snake[] }>(GET_ALL_SNAKES);
  const apollo = useApolloClient();

  const [open, setOpen] = useState(false);
  const [prediction, setPrediction] = useState<SnakePrediction | null>(null);

  const handlePredict = async (file: File) => {
    const { data } = await apollo.query<{
      snakeClassifier: { snake: Snake; prob: number }
    }>({
      query: PREDICT_SNAKE,
      variables: { file },          
      fetchPolicy: 'no-cache',
    });

    const result = data?.snakeClassifier;
    if (result) setPrediction({ snake: result.snake, prob: result.prob });

    setOpen(false); // close modal after success (optional)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-500 dark:text-gray-300">Loading snakes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-red-500">Failed to load snakes: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero only triggers opening the modal */}
      <Hero onTry={() => setOpen(true)} />

      {/* Snake Card Section */}
      <div className="relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('images/sn-bg.jpg')" }}
        />
        {/* Color Overlay */}
        <div className="absolute inset-0 pointer-events-none backdrop-blur-md backdrop-saturate-100 bg-white/10 dark:bg-black/30" />

        {/* Content */}
        <div className="relative container mx-auto px-6 py-8 space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data?.snakes.map((snake) => (
              <SnakeCard key={snake.id} snake={snake} />
            ))}
          </div>
        </div>

        <KnowVenomSection />
        <div className="bg-gray-400">
          <SnakeVenom />
        </div>
      </div>
      
      <PredictedSnake
        isOpen={!!prediction}
        onClose={() => setPrediction(null)}
        prediction={prediction!}
      />

      <SnakePredictModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onPredict={handlePredict}
      />
    </div>
  );
}

export default Page;
