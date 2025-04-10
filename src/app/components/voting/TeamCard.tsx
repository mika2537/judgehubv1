// components/voting/TeamCard.tsx
"use client";

import { RatingCategory } from "@/app/types";
import { TeamCardProps } from "@/app/types";

export default function TeamCard({
  team,
  categories,
  ratings,
  hasVoted,
  onRatingChange,
}: TeamCardProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <img 
            src={team.logo} 
            alt={team.name} 
            className="h-12 w-12 rounded-full object-cover mr-4"
          />
          <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
        </div>
        
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {category.name}
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !hasVoted && onRatingChange(team.id, category.id, star)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center
                      ${ratings[category.id] >= star 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                      ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-blue-400'}
                    `}
                    disabled={hasVoted}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}