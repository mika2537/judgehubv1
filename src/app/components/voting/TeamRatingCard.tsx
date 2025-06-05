"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RatingCategory } from "@/app/types";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

interface Props {
  team: any;
  expanded: boolean;
  onToggle: () => void;
  onRatingChange: (teamId: string, categoryId: string, rating: number) => void;
  ratings: Record<string, number>;
  hasVoted: boolean;
  categories: RatingCategory[];
}

export default function TeamRatingCard({
  team,
  expanded,
  onToggle,
  onRatingChange,
  ratings,
  hasVoted,
  categories
}: Props) {

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <img 
            src={team.logo} 
            alt={team.name} 
            className="h-12 w-12 rounded-full object-cover mr-4"
          />
          <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
      </button>

      {expanded && (
        <div className="p-6 pt-0 border-t border-gray-200">
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
                      onClick={() => onRatingChange(team.id, category.id, star)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center
                        ${ratings?.[category.id] >= star 
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
      )}
    </div>
  );
}