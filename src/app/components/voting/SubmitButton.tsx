// components/voting/SubmitButton.tsx
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  canVote: boolean;
  isSubmitting: boolean;
  hasVoted: boolean;
  onSubmit: () => void;
  totalTeams: number;
  ratedTeams: number;
}

export default function SubmitButton({
  canVote,
  isSubmitting,
  hasVoted,
  onSubmit,
  totalTeams,
  ratedTeams,
}: SubmitButtonProps) {
  return (
    <div className="text-center mb-10">
      <button
        onClick={onSubmit}
        disabled={!canVote || isSubmitting || hasVoted}
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
            <Loader2 className="animate-spin h-5 w-5" />
            Submitting...
          </>
        ) : hasVoted ? (
          "Thank you for voting!"
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
      {!canVote && !hasVoted && (
        <p className="text-sm text-gray-500 mt-2">
          Please rate all {totalTeams} teams before submitting ({ratedTeams}/{totalTeams} rated)
        </p>
      )}
    </div>
  );
}