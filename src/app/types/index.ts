
export interface Match {

  id: string;

  teamA: string;

  teamB: string;

  scoreA: number;

  scoreB: number;

  date: string;

}
  

  export interface Team {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    totalPoints: number;
    averageRating: number;
    ratingsCount: number;
    color: string;
    players: string[];
    stats: {
      wins: number;
      losses: number;
      draws: number;
      goalsFor: number;
      goalsAgainst: number;
    };
  }
  
// app/types.ts
export interface RatingCategory {
  id: string;
  name: string;
  description: string;
}

export interface TeamRating {
  categoryId: string;
  rating: number;
}

export interface MatchDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  totalVotes: number;
  teams: any[];
  matchStats: {
    mostRatedTeam: string;
    recentComments: number;
  };
}
  export interface MatchHeaderProps {
    title: string;
    date: string;
    location: string;
    totalVotes: number;
    description: string;
  }
  export interface TeamCardProps {
    team: any;
    categories: RatingCategory[];
    ratings: Record<string, number>;
    hasVoted: boolean;
    onRatingChange: (teamId: string, categoryId: string, rating: number) => void;
  }
  
export interface Event {
    title: string;
    startTime: string;
    endTime: string;
    eventType: string;
    status: string;
    sportType?: string;
    teams?: string;
    totalVotes?: number;
    recentComments?: number;
    coverImage?: string;
  }

  export interface EventCardProps {
    event: Event;
    onClick: () => void;
  }

  export interface SubmitButtonProps {
    canVote: boolean;
    isSubmitting: boolean;
    hasVoted: boolean;
    onSubmit: () => void;
    totalTeams: number;
    ratedTeams: number;
  }