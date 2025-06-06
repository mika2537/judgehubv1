import React, { useRef } from 'react';
import MatchCard from './matchCard';

// Define or import the Match type
export interface Match {
  _id: string;
  title: string;
  description: string;
  startTime: string; // Use appropriate type, e.g., Date if needed
  location: string;
}

export default function MatchList({
  matches,
  emptyHeading,
}: {
  matches: Match[];
  emptyHeading: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToMatch = (direction: 'prev' | 'next') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.8;
    containerRef.current.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const count = matches.length;
  const heading = count > 0 ? `${count} ${count > 1 ? 'Matches' : 'Match'} Available` : emptyHeading;

  return (
    <section className="my-12 h-[80vh] relative">
      <h2 className="text-4xl font-bold mb-12 text-gray-900 font-serif tracking-tight text-center">{heading}</h2>

      {matches.length > 1 && (
        <>
          <button
            onClick={() => scrollToMatch('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Previous match"
          >
            &larr;
          </button>
          <button
            onClick={() => scrollToMatch('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Next match"
          >
            &rarr;
          </button>
        </>
      )}

      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory h-full pb-8 px-4 hide-scrollbar"
        style={{
          scrollSnapType: 'x mandatory',
          scrollPadding: '0 16px',
        }}
      >
        {matches.map((match) => (
          <div key={match._id} className="snap-center">
            <MatchCard match={match} />
          </div>
        ))}
      </div>

      {matches.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {matches.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    left: index * containerRef.current.clientWidth * 0.8,
                    behavior: 'smooth',
                  });
                }
              }}
              className="w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-500 transition-all duration-200"
              aria-label={`Go to match ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}