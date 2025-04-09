// components/voting/TeamCard.tsx
import Image from "next/image";
import { TeamCardProps } from "@/app/types"


export default function TeamCard({
  team,
  rating = 0,
  hasVoted,
  onRatingChange,
}: TeamCardProps) {
  const renderStars = (currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !hasVoted && onRatingChange(team.id, star)}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
              currentRating >= star
                ? `${team.color} text-white`
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            } ${hasVoted && "cursor-default"}`}
            disabled={hasVoted}
            aria-label={`Rate ${star} star`}
          >
            {star}
          </button>
        ))}
      </div>
    );
  };

  const calculateAverageRating = () => {
    if (team.totalPoints && team.ratingsCount) {
      return (team.totalPoints / team.ratingsCount).toFixed(1);
    }
    return "0.0";
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
        hasVoted ? "border-gray-200" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Team header */}
        <div
          className={`${team.color} p-5 flex items-center justify-between`}
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg flex-shrink-0">
              <Image
                src={team.logo|| "/logos/galacticos.png"}
                alt={team.name}
                width={56}
                height={56}
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
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 ${
                        star <= Math.round(parseFloat(calculateAverageRating()))
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white/80 text-xs ml-2">
                  ({team.ratingsCount || 0} ratings)
                </span>
              </div>
            </div>
          </div>
          {!hasVoted && (
            <div className="text-white/80 text-sm">Tap to rate</div>
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
                    {team.stats?.wins || 0}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Goals For:</span>
                  <span className="font-medium">
                    {team.stats?.goalsFor || 0}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Rank:</span>
                  <span className="font-medium">
                    {/* Rank would need to be passed as prop or calculated */}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                Key Players:
              </h4>
              <ul className="space-y-1 text-sm">
                {team.players?.slice(0, 3).map((player, index) => (
                  <li key={index} className="flex items-center gap-2 truncate">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></span>
                    <div>
                    <p className="font-medium">{player.name}</p>
                    {player.position && (
                      <p className="text-xs text-gray-500">{player.position}</p>
                    )}
                  </div>
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
              {renderStars(rating)}
              {rating > 0 && !hasVoted && (
                <span className="text-sm text-gray-500">
                  Selected: {rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}