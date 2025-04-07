"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";


function MatchList({ matches, emptyHeading }: { matches: any[]; emptyHeading: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to next/previous match
  const scrollToMatch = (direction: 'prev' | 'next') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // 80% of viewport width
    
    container.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  function MatchCard({ match }: { match: any }) {
    return (
      <div 
        className="relative flex-shrink-0 w-[80vw] h-[80vh] mx-4 rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300"
        onClick={() => router.push(`/voting/${match._id}`)}
      >
        {/* Background image */}
        <div className="absolute inset-0 bg-gray-300">
          <Image
            src={match.coverImage}
            alt={match.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent z-10"></div>
        
        {/* Match info */}
        <div className="absolute bottom-0 left-0 z-20 p-8 w-full">
          <h3 className="text-3xl font-bold text-white mb-2">{match.title}</h3>
          <p className="text-gray-200 text-lg mb-4 line-clamp-2">{match.description}</p>
          <div className="flex items-center mb-4">
            <span className="text-gray-300 text-base mr-4">
              {new Date(match.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="text-gray-300 text-base">
              {match.location}
            </span>
          </div>
          {match.totalVotes && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-base font-medium">
              {match.totalVotes} votes
            </div>
          )}
        </div>
        
        {/* Vote button overlay */}
        <div className="absolute bottom-8 right-8 z-20">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg text-lg transition-all shadow-lg transform group-hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/voting/${match._id}`);
            }}
          >
            Vote Now →
          </button>
          console.log({match._id});
        </div>
      </div>
    );
  }

  const count = matches.length;
  let heading = emptyHeading;
  if (count > 0) {
    const noun = count > 1 ? 'Matches' : 'Match';
    heading = `${count} ${noun} Available`;
  }

  return (
    <section className="my-12 h-[80vh] relative">
      <h2 className="text-4xl font-bold mb-12 text-gray-900 font-serif tracking-tight text-center">{heading}</h2>
      
      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button 
            onClick={() => scrollToMatch('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all"
          >
            &larr;
          </button>
          <button 
            onClick={() => scrollToMatch('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all"
          >
            &rarr;
          </button>
        </>
      )}
      
      {/* Scrollable container */}
      <div 
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory h-full pb-8 px-4 hide-scrollbar"
        style={{
          scrollSnapType: 'x mandatory',
          scrollPadding: '0 16px'
        }}
      >
        {matches.map((match, index) => (
          <div key={match._id.toString()} className="snap-center">
            <MatchCard match={match} />
          </div>
        ))}
      </div>
      
      {/* Custom scrollbar indicator */}
      {matches.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {matches.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    left: index * containerRef.current.clientWidth * 0.8,
                    behavior: 'smooth'
                  });
                }
              }}
              className="w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-500 transition"
              aria-label={`Go to match ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchMatches();
    }
  }, [status, router]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 text-lg font-semibold mb-4">{error}</p>
        <button
          onClick={() => fetchMatches()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <MatchList matches={matches} emptyHeading="No matches available" />
      </main>
    </div>
  );
}

// Keep your existing LoadingSpinner and ErrorDisplay components