
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
  
  export interface MatchDetails {
    id: string;
    title: string;
    date: string;
    location: string;
    teams: Team[];
    description: string;
    matchStats: {
      totalVotes: number;
      mostRatedTeam: string;
      recentComments: number;
    };
  }