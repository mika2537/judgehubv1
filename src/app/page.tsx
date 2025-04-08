"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MatchList from "@/app/components/matchList";
import { Match } from "/types/Match";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      // Check if there's a redirect parameter in the URL
      const redirectTo = searchParams?.get('redirect');
      if (redirectTo) {
        // Store the redirect path in session storage
        sessionStorage.setItem('loginRedirect', redirectTo);
      }
      router.push("/login");
    } else if (status === "authenticated") {
      fetchMatches();
    }
  }, [status, router, searchParams]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/matches");
      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 text-lg font-semibold mb-4">{error}</p>
        <button
          onClick={fetchMatches}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto p-4">
        {matches.length > 0 ? (
          <MatchList matches={matches} emptyHeading="No matches available" />
        ) : (
          !loading && <p className="text-gray-600 text-center">No matches found.</p>
        )}
      </main>
    </div>
  );
}