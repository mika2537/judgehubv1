"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MatchDetails, RatingCategory } from "@/app/types";
import MatchHeader from "@/app/components/voting/MatchHeader";
import SubmitButton from "@/app/components/voting/SubmitButton";
import RatingCategories from "@/app/components/voting/RatingCategories";
import TeamRatingCard from "@/app/components/voting/TeamRatingCard";
import Image from "next/image";

export default function VotingPage() {
  const params = useParams();
  const id = params?.id as string;

  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<RatingCategory[]>([]);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || categories.length === 0 || teams.length === 0) return;

    const stored = localStorage.getItem(`ratings-${id}`);
    if (stored) {
      setRatings(JSON.parse(stored));
    } else {
      const initialRatings: Record<string, Record<string, number>> = {};
      teams.forEach((team: any) => {
        initialRatings[team.id] = {};
        categories.forEach(cat => {
          initialRatings[team.id][cat.id] = 0;
        });
      });
      setRatings(initialRatings);
    }
  }, [id, teams, categories]);

  const fetchMatchAndCategories = async () => {
    try {
      const [matchRes, catRes] = await Promise.all([
        fetch(`/api/matches/${id}`),
        fetch(`/api/rating-categories`)
      ]);

      if (!matchRes.ok || !catRes.ok) throw new Error("Failed to load data");

      const matchData = await matchRes.json();
      const categoryData = await catRes.json();

      setCategories(categoryData);
      setMatchDetails(matchData);
      setTeams(matchData.teams);

      const initialRatings: Record<string, Record<string, number>> = {};
      matchData.teams.forEach((team: any) => {
        initialRatings[team.id] = {};
        categoryData.forEach((cat: RatingCategory) => {
          initialRatings[team.id][cat.id] = 0;
        });
      });
      setRatings(initialRatings);
    } catch (err) {
      console.error(err);
      setError("Error loading data");
    }
  };

  useEffect(() => {
    if (id) fetchMatchAndCategories();
  }, [id]);

  const handleRatingChange = (teamId: string, categoryId: string, rating: number) => {
    if (hasVoted) return;
    setRatings(prev => {
      const updated = {
        ...prev,
        [teamId]: { ...prev[teamId], [categoryId]: rating }
      };
      localStorage.setItem(`ratings-${id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const canVote = !hasVoted && teams.every(team => 
    categories.every(cat => ratings[team.id]?.[cat.id] > 0)
  );

  const handleSubmitVote = async () => {
    if (hasVoted || isSubmitting || !matchDetails) return;
    setIsSubmitting(true);

    try {
      const ratingsData = Object.entries(ratings).map(([teamId, values]) => ({
        teamId,
        categories: Object.entries(values).map(([categoryId, rating]) => ({
          categoryId,
          rating
        }))
      }));

      const res = await fetch(`/api/matches/${id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings: ratingsData, userId: "user123" })
      });

      if (!res.ok) throw new Error("Failed to submit vote");

      setHasVoted(true);
      localStorage.removeItem(`ratings-${id}`);
    } catch (err) {
      console.error(err);
      setError("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <div className="max-w-3xl mx-auto px-4 py-8">
        {matchDetails && (
          <MatchHeader {...matchDetails} />
        )}

        <RatingCategories categories={categories} />

        <div className="space-y-4 mb-10">
          {teams.map(team => (
            <TeamRatingCard
              key={team.id}
              team={team}
              expanded={expandedTeam === team.id}
              onToggle={() => setExpandedTeam(prev => prev === team.id ? null : team.id)}
              onRatingChange={handleRatingChange}
              ratings={ratings[team.id] || {}}
              hasVoted={hasVoted}
              categories={categories}
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
            ratedTeams={Object.keys(ratings).filter(teamId =>
              categories.every(cat => ratings[teamId]?.[cat.id] > 0)
            ).length}
          />
        )}

        {hasVoted && (
          <div className="text-center py-4 text-green-600 font-medium">
            Thank you for voting!
          </div>
        )}

        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
      </div>
    </div>
  );
}