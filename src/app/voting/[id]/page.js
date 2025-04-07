"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function VotingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [ratings, setRatings] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const matchDetails = {
    id: id,
    title: "International Championship 2023",
    date: "June 15, 2023",
    location: "Olympic Stadium, Barcelona",
    teams: [
      {
        id: "teamA",
        name: "Galacticos",
        shortName: "GAL",
        logo: "/logos/galacticos.png",
        totalPoints: 5421,
        averageRating: 4.2,
        ratingsCount: 1290,
        color: "bg-blue-600",
        players: [
          "M. Rodriguez (C)",
          "J. Smith",
          "A. Chen",
          "L. Martinez",
          "P. Nguyen",
        ],
        stats: {
          wins: 12,
          losses: 2,
          draws: 1,
          goalsFor: 38,
          goalsAgainst: 12,
        },
      },
      {
        id: "teamB",
        name: "Thunderbolts",
        shortName: "TBL",
        logo: "/logos/thunderbolts.png",
        totalPoints: 4876,
        averageRating: 3.9,
        ratingsCount: 1250,
        color: "bg-yellow-500",
        players: [
          "T. Johnson (C)",
          "R. Williams",
          "K. Tanaka",
          "D. Brown",
          "S. Kim",
        ],
        stats: {
          wins: 10,
          losses: 3,
          draws: 2,
          goalsFor: 32,
          goalsAgainst: 18,
        },
      },
      {
        id: "teamC",
        name: "Dragons",
        shortName: "DRG",
        logo: "/logos/dragons.png",
        totalPoints: 4203,
        averageRating: 3.6,
        ratingsCount: 1167,
        color: "bg-red-600",
        players: [
          "L. Zhang (C)",
          "P. Martinez",
          "S. Kim",
          "A. Silva",
          "J. Wilson",
        ],
        stats: {
          wins: 9,
          losses: 4,
          draws: 2,
          goalsFor: 28,
          goalsAgainst: 20,
        },
      },
      {
        id: "teamD",
        name: "Phoenix",
        shortName: "PHX",
        logo: "/logos/phoenix.png",
        totalPoints: 4012,
        averageRating: 3.5,
        ratingsCount: 1146,
        color: "bg-orange-500",
        players: [
          "D. Wilson (C)",
          "E. Garcia",
          "H. Sato",
          "M. Ali",
          "C. Müller",
        ],
        stats: {
          wins: 8,
          losses: 5,
          draws: 2,
          goalsFor: 25,
          goalsAgainst: 22,
        },
      },
    ],
    description:
      "The championship finals between four international teams. Rate each team's performance from 1 to 5 stars!",
    matchStats: {
      totalVotes: 4853,
      mostRatedTeam: "Galacticos",
      recentComments: 42,
    },
  };

  const canVote =
    !hasVoted && Object.keys(ratings).length === matchDetails.teams.length;

  const handleRatingChange = (teamId, rating) => {
    if (hasVoted) return;
    setRatings((prev) => ({ ...prev, [teamId]: rating }));
  };

  const handleSubmitVote = async () => {
    if (hasVoted || isSubmitting || !canVote) return;

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => {
        setTimeout(() => {
          matchDetails.teams.forEach((team) => {
            if (ratings[team.id]) {
              team.totalPoints += ratings[team.id];
              team.ratingsCount += 1;
              team.averageRating = parseFloat(
                (team.totalPoints / team.ratingsCount).toFixed(1)
              );
            }
          });
          matchDetails.matchStats.totalVotes += 1;
          resolve();
        }, 1500);
      });

      setHasVoted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, size = "md") => {
    const sizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizes[size]} ${
              star <= Math.round(rating) ? "text-yellow-500" : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-gray-600 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Background image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/cool-background1.png"
          alt="Background"
          fill
          className="object-cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to matches
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* Match header */}
          <div className="relative h-72 bg-gray-800 overflow-hidden">
            <Image
              src="/Teams-Background-3.webp"
              alt={matchDetails.title}
              fill
              className="object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
            <div className="relative z-10 p-8 h-full flex flex-col justify-end">
              <div className="max-w-4xl">
                <div className="inline-flex flex-wrap gap-2 mb-3">
                  <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                    {matchDetails.date}
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                    {matchDetails.location}
                  </span>
                  <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm border border-white/20">
                    {matchDetails.matchStats.totalVotes} votes
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  {matchDetails.title}
                </h1>
                <p className="text-white/90 max-w-3xl">
                  {matchDetails.description}
                </p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
              {/* Success message */}
              <div
                className={`text-center mb-8 transition-all duration-500 ${
                  hasVoted ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                }`}
              >
                <div className="inline-flex items-center justify-center bg-green-50 text-green-800 px-6 py-3 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">
                    Thank you for your ratings!
                  </span>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-center mb-6 text-gray-900">
                {hasVoted ? "Tournament Ratings" : "Rate Each Team (1-5 Stars)"}
              </h2>

              {/* Teams grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {matchDetails.teams.map((team) => (
                  <div
                    key={team.id}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${"border-gray-200 hover:border-gray-300"} ${
                      hasVoted && "opacity-90"
                    }`}
                  >
                    <div className="h-full flex flex-col">
                      {/* Team header */}
                      <div
                        className={`${team.color} p-5 flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0">
                            <img
                              src={team.logo}
                              alt={team.name}
                              className="h-14 w-14 object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {team.name}
                              <span className="text-white/70 ml-2 font-normal">
                                {team.shortName}
                              </span>
                            </h3>
                            <div className="flex items-center mt-1">
                              {renderStars(team.averageRating, "sm")}
                              <span className="text-white/80 text-xs ml-2">
                                ({team.ratingsCount} ratings)
                              </span>
                            </div>
                          </div>
                        </div>
                        {!hasVoted && (
                          <div className="text-white/80 text-sm">
                            Tap to rate
                          </div>
                        )}
                      </div>

                      {/* Team details */}
                      <div className="bg-white p-5 flex-grow">
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                              Team Stats:
                            </h4>
                            <ul className="space-y-1 text-sm">
                              <li className="flex justify-between">
                                <span className="text-gray-600">Wins:</span>
                                <span className="font-medium">
                                  {team.stats.wins}
                                </span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-gray-600">
                                  Goals For:
                                </span>
                                <span className="font-medium">
                                  {team.stats.goalsFor}
                                </span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-gray-600">Rank:</span>
                                <span className="font-medium">
                                  {matchDetails.teams
                                    .sort(
                                      (a, b) =>
                                        b.averageRating - a.averageRating
                                    )
                                    .findIndex((t) => t.id === team.id) + 1}
                                </span>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                              Key Players:
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {team.players.slice(0, 3).map((player) => (
                                <li
                                  key={player}
                                  className="flex items-center gap-2 truncate"
                                >
                                  <span className="inline-block w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                                  {player}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Rating interface */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                            {hasVoted ? "Your Rating" : "Your Rating (1-5)"}
                          </h4>
                          <div className="flex justify-between items-center">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() =>
                                    handleRatingChange(team.id, star)
                                  }
                                  disabled={hasVoted}
                                  className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                                    ratings[team.id] >= star
                                      ? `${team.color} text-white`
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                  } ${hasVoted && "cursor-default"}`}
                                >
                                  {star}
                                </button>
                              ))}
                            </div>
                            {ratings[team.id] && !hasVoted && (
                              <span className="text-sm text-gray-500">
                                Selected: {ratings[team.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit button */}
              {!hasVoted && (
                <div className="text-center mb-10">
                  <button
                    onClick={handleSubmitVote}
                    disabled={!canVote || isSubmitting}
                    className={`px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 mx-auto transition-all ${
                      !canVote
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isSubmitting
                        ? "bg-blue-400 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Submit All Ratings
                      </>
                    )}
                  </button>
                  {!canVote && (
                    <p className="text-sm text-gray-500 mt-2">
                      Please rate all {matchDetails.teams.length} teams before
                      submitting
                    </p>
                  )}
                </div>
              )}

              {/* Leaderboard */}
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-gray-900">
                    Tournament Leaderboard
                  </h3>
                  <div className="text-sm text-gray-500">
                    Total Votes: {matchDetails.matchStats.totalVotes}
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...matchDetails.teams]
                        .sort((a, b) => b.averageRating - a.averageRating)
                        .map((team, index) => (
                          <tr key={team.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-medium w-6">
                                  {index + 1}
                                </span>
                                {index === 0 && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 ml-1 text-yellow-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 object-contain"
                                    src={team.logo}
                                    alt={team.name}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {team.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {team.stats.wins}W - {team.stats.losses}L -{" "}
                                    {team.stats.draws}D
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {renderStars(team.averageRating)}
                                <span className="text-gray-500 text-sm ml-2">
                                  ({team.ratingsCount})
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${team.color}`}
                                  style={{
                                    width: `${(team.averageRating / 5) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comments section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Fan Discussions
                  </h3>
                  <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View all {matchDetails.matchStats.recentComments} comments
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {i === 0 ? "JD" : "MS"}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {i === 0 ? "John D." : "Maria S."}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {i === 0 ? "2 hours ago" : "1 hour ago"}
                              </span>
                            </div>
                            <div className="flex items-center text-yellow-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="ml-1 text-xs font-medium">
                                {i === 0 ? "4.5" : "3.5"}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mt-1">
                            {i === 0
                              ? "Galacticos showed incredible teamwork tonight. Their defense was impenetrable and Rodriguez's leadership was outstanding!"
                              : "Thunderbolts had some great moments but need to work on their consistency. Johnson's performance was the highlight for me."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment form */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-700 mb-3">
                    Add your comment
                  </h4>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    rows="3"
                    placeholder="Share your thoughts about the match..."
                  ></textarea>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">
                        Your rating:
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className="w-6 h-6 rounded-sm bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-400 flex items-center justify-center text-sm"
                          >
                            {star}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
