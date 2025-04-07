"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function VotingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMatchDetails();
    }
  }, [id]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/matches/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      // Additional validation
      if (!data || !data.teams) {
        throw new Error("Invalid data structure received from API");
      }

      setMatchDetails(data);
    } catch (err) {
      console.error("Fetch error details:", {
        error: err,
        id: id,
        time: new Date(),
      });
      setError(err.message || "Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component code remains the same ...x

  const canVote =
    !hasVoted &&
    matchDetails?.teams &&
    Object.keys(ratings).length === matchDetails.teams.length;

  const handleRatingChange = (teamId, rating) => {
    if (hasVoted) return;
    setRatings((prev) => ({ ...prev, [teamId]: rating }));
  };

  const handleSubmitVote = async () => {
    if (hasVoted || isSubmitting || !canVote || !matchDetails) return;

    setIsSubmitting(true);

    try {
      // Send ratings to your API
      const response = await fetch(`/api/matches/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ratings }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      // Refresh the match details to get updated ratings
      await fetchMatchDetails();
      setHasVoted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      setError(error.message || "Failed to submit vote");
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
        <span className="ml-1 text-gray-600 text-sm">
          {rating?.toFixed(1) || "0.0"}
        </span>
      </div>
    );
  };

  if (!id || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>

          <div className="bg-gray-100 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Event ID: {id}</p>
            <p>Time: {new Date().toLocaleString()}</p>
          </div>

          <button
            onClick={fetchMatchDetails}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No match details found
      </div>
    );
  }

  // Rest of your component remains the same, just replace hardcoded matchDetails
  // with the data from your MongoDB collection

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

      {/* Rest of your existing JSX */}
      {/* Just make sure to replace any references to the hardcoded matchDetails */}
      {/* with the data from your state (matchDetails) */}

      {/* For example: */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          {matchDetails.title}
        </h1>
        {/* ... */}
      </div>
    </div>
  );
}
