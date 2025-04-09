"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MatchDetails } from "@/app/types";
import MatchHeader from "@/app/components/voting/MatchHeader";
import TeamCard from "@/app/components/voting/TeamCard";
import SubmitButton from "@/app/components/voting/SubmitButton";
import Image from "next/image";

export default function VotingPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMatchData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch match details and teams in one request
      const response = await fetch(`/api/matches/${id}`);
      if (!response.ok) throw new Error("Failed to fetch match data");
      const data = await response.json();

      setMatchDetails({
        id: data.id,
        title: data.title,
        description: data.description,
        location: data.location,
        date: data.startTime, // or data.date if that's what's returned
        totalVotes: data.totalVotes,
        teams: data.teams || [],
        matchStats: {
          mostRatedTeam: data.matchStats?.mostRatedTeam || "",
          recentComments: data.matchStats?.recentComments || 0,
        },
      });

      setTeams(data.teams || []);
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError("Match ID is required");
      setLoading(false);
      return;
    }
    fetchMatchData(id);
  }, [id]);

  const handleRatingChange = (teamId: string, rating: number) => {
    if (hasVoted) return;
    setRatings((prev) => ({ ...prev, [teamId]: rating }));
  };

  const handleSubmitVote = async () => {
    if (hasVoted || isSubmitting || !matchDetails) return;
  
    setIsSubmitting(true);
  
    try {
      const response = await fetch(`/api/matches/${id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings: Object.entries(ratings)
            .filter(([teamId]) => teamId && typeof teamId === "string")
            .map(([teamId, rating]) => ({
              teamId,
              rating: Math.round(Number(rating)) // Ensure integer
            })),
          userId: "user123" // If you have user authentication
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit votes");
      }
  
      setHasVoted(true);
      await fetchMatchData(id);
    } catch (error) {
      console.error("Submission error:", error);
      setError(error instanceof Error ? error.message : "Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canVote = !hasVoted && teams.length > 0 && 
    Object.keys(ratings).length === teams.length;

  if (!id || loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!matchDetails) return <div className="text-center py-8">No match details found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/cool-background1.png"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
          priority
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MatchHeader 
          title={matchDetails.title}
          date={matchDetails.date}
          location={matchDetails.location}
          totalVotes={matchDetails.totalVotes}
          description={matchDetails.description}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              rating={ratings[team.id]}
              hasVoted={hasVoted}
              onRatingChange={(teamId: string, rating: number) => handleRatingChange(teamId, rating)}
            />
          ))}
        </div>

        {!hasVoted && (
          <SubmitButton
            canVote={canVote}
            isSubmitting={isSubmitting}
            hasVoted={hasVoted}
            onSubmit={handleSubmitVote}
            totalTeams={teams.length}
            ratedTeams={Object.keys(ratings).length}
          />
        )}

        {hasVoted && (
          <div className="text-center py-4 text-green-600 font-medium">
            Thank you for voting!
          </div>
        )}
      </div>
    </div>
  );
}