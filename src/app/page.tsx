"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Trophy, Users, Star, BarChart3, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import DashboardRedirect from "@/app/DashboardRedirect";
import { useRouter } from 'next/navigation';

// Extend Session type to include role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      role?: string | null;
    };
  }
}

// API item type to replace `any`
interface CompetitionApiItem {
  _id?: string;
  name?: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  status?: string;
  participants?: unknown[];
  judges?: unknown[];
  endDate?: string;
}

// Competition type
type Competition = {
  id: string;
  name: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  status: string;
  participants: number;
  judges: number;
  endDate: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJudges, setTotalJudges] = useState<number>(0);
  const [submissionsToday] = useState<number>(0);

  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/pages/login');
    }
  }, [status, router]);

  // Load data when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchCompetitions();
      fetchJudgeCount();
    }
  }, [status]);
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/competitions");
      if (!response.ok) {
        throw new Error(`Failed to fetch competitions: ${response.status}`);
      }
      const data = await response.json();
      const formattedData: Competition[] = data
        .map((item: CompetitionApiItem) => ({
          id: item._id?.toString() || Math.random().toString(36).substring(2, 9),
          name:
            item.name ||
            (item.teamA && item.teamB
              ? `${item.teamA} vs ${item.teamB}`
              : "Unnamed Competition"),
          teamA: item.teamA,
          teamB: item.teamB,
          scoreA: item.scoreA ?? null,
          scoreB: item.scoreB ?? null,
          status: item.status || "Upcoming",
          participants: Array.isArray(item.participants)
            ? item.participants.length
            : 0,
          judges: Array.isArray(item.judges) ? item.judges.length : 0,
          endDate: item.endDate
            ? new Date(item.endDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A",
        }))
        .filter((comp: Competition) => comp.participants >= 3 && comp.judges >= 3);
      setCompetitions(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchJudgeCount = async () => {
    try {
      const response = await fetch("/api/stats/judges");
      if (!response.ok) throw new Error("Failed to fetch judge count");
      const data = await response.json();
      setTotalJudges(data.totalJudges || 0);
    } catch (err) {
      console.error("Failed to fetch judge count:", err);
    }
  };

  const stats = [
    {
      title: "Active Competitions",
      value: competitions.length.toString(),
      icon: Trophy,
      color: "text-blue-600",
    },
    {
      title: "Total Judges",
      value: totalJudges.toString(),
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Submissions Today",
      value: submissionsToday.toString(),
      icon: Star,
      color: "text-purple-600",
    },
    {
      title: "Average Score",
      value: competitions.length
        ? (
            competitions
              .filter((c) => c.scoreA != null && c.scoreB != null)
              .reduce((sum, c) => sum + (c.scoreA! + c.scoreB!), 0) /
            (competitions.filter((c) => c.scoreA != null && c.scoreB != null)
              .length *
              2 || 1)
          ).toFixed(1)
        : "0.0",
      icon: BarChart3,
      color: "text-orange-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Scoring":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 text-lg font-semibold mb-4">{error}</p>
        <Button
          onClick={fetchCompetitions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Suspense fallback={null}>
        <DashboardRedirect status={status} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-semibold">
            Welcome back, {session?.user?.name || "User"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s what&apos;s happening with your competitions today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700 ${stat.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Competitions */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Active Competitions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competitions.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    No competitions available.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {competitions.map((competition) => (
                      <Link
                        href={`/pages/Scoreboard`}
                        key={competition.id}
                        className="block p-4 border rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {competition.name}
                          </h3>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                              competition.status
                            )}`}
                          >
                            {competition.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          Participants: {competition.participants} | Judges:{" "}
                          {competition.judges} | Ends: {competition.endDate}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for extra info or future cards */}
          <div>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl p-6 flex flex-col items-center justify-center">
              <Clock className="w-12 h-12 text-gray-500 dark:text-gray-400 mb-4 animate-pulse" />
              <p className="text-gray-700 dark:text-gray-300">
                More dashboard features coming soon!
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}