"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Trophy, Medal, Star, TrendingUp, Users, RefreshCw, ArrowLeft } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { useLanguage } from "@/context/languageContext";

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Participant {
  id: string;
  name: string;
  criteria?: Criterion[];
}

interface Competition {
  _id: string;
  name: string;
  status: string;
  participants: Participant[];
  judges: number;
  endDate: string;
  criteria: Criterion[];
  judgedParticipants?: number;
}

interface ScoreboardEntry {
  _id: string;
  participantId: string;
  scores: { criterionId: string; score: number }[];
  totalScore: number;
  rank?: number;
}

const Scoreboard = () => {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch competitions
  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/events", { credentials: "include" });
      if (!response.ok) {
        throw new Error(t("failedFetchCompetitions", { status: response.status.toString() }));
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(t("invalidResponseFormat"));
      }
      const competitionsWithJudged = await Promise.all(
        data.map(async (comp: Competition) => {
          try {
            const scoreboardResponse = await fetch(`/api/scoreboard/${comp._id}`);
            const scoreboardData = await scoreboardResponse.json();
            return {
              ...comp,
              judgedParticipants: Array.isArray(scoreboardData) ? scoreboardData.length : 0,
            };
          } catch (err) {
            console.warn(`Failed to fetch scoreboard for competition ${comp._id}:`, err);
            return { ...comp, judgedParticipants: 0 };
          }
        })
      );
      setCompetitions(competitionsWithJudged);
      if (data.length > 0) {
        setSelectedCompetition(data[0]._id);
      } else {
        setError(t("noCompetitionsAvailable"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
      toast({
        title: t("errorTitle"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Fetch scoreboard with AbortController
  const fetchScoreboard = useCallback(async (competitionId: string, signal: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/scoreboard/${competitionId}`, { signal });
      if (!response.ok) {
        throw new Error(t("failedFetchScoreboard", { status: response.status.toString() }));
      }
      const data = await response.json();
      console.log(`Scoreboard data for competition ${competitionId}:`, data);
      if (!Array.isArray(data)) {
        throw new Error(t("invalidResponseFormat"));
      }
      if (data.length === 0) {
        console.warn(`No scores returned for competition ${competitionId}`);
      }
      const sortedData = data
        .sort((a: ScoreboardEntry, b: ScoreboardEntry) => b.totalScore - a.totalScore)
        .map((entry: ScoreboardEntry, index: number) => ({
          ...entry,
          rank: index + 1,
        }));
      setLeaderboard(sortedData);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : t("unknownError"));
      toast({
        title: t("errorTitle"),
        description: err instanceof Error ? err.message : t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Redirect unauthenticated users and fetch competitions
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/pages/login");
    } else if (status === "authenticated") {
      fetchCompetitions();
    }
  }, [status, router, fetchCompetitions]);

  // Fetch scoreboard when selectedCompetition changes
  useEffect(() => {
    if (!selectedCompetition) return;
    const controller = new AbortController();
    fetchScoreboard(selectedCompetition, controller.signal);
    return () => controller.abort();
  }, [selectedCompetition, fetchScoreboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-500">
            #{rank}
          </span>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600";
      default:
        return "bg-gradient-to-r from-blue-500 to-purple-600";
    }
  };

  const getChangeIcon = () => {
    return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
  };

  const isCompetitionLive = (comp: Competition) => {
    return comp.status.toLowerCase() === "ongoing" || new Date(comp.endDate) > new Date();
  };

  const selectedComp = competitions.find((comp) => comp._id === selectedCompetition) ?? null;
  const judgedParticipants = leaderboard.filter((entry) => entry.totalScore > 0).length;
  const totalParticipants = Array.isArray(selectedComp?.participants)
    ? selectedComp.participants.length
    : 0;

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error || !competitions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 text-lg font-semibold mb-4">
          {error || t("noCompetitionsAvailable")}
        </p>
        <Button
          onClick={() => {
            fetchCompetitions();
            if (selectedCompetition) fetchScoreboard(selectedCompetition, new AbortController().signal);
          }}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {t("retry")}
        </Button>
        <Button
          onClick={() => router.push("/pages/Dashboard")}
          className="mt-4 bg-gray-600 text-white hover:bg-gray-700"
        >
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-8 animate-fade">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("back")}
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t("leaderboard")}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t("realTimeCompetitionResults")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedComp && isCompetitionLive(selectedComp) && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                    {t("live")}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedCompetition && fetchScoreboard(selectedCompetition, new AbortController().signal)}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </div>

        {/* Competition Selector */}
        <div className="mb-8">
          <Card className="bg-white/90 dark:bg-gray-800/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t("selectEvent")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedCompetition || ""}
                onValueChange={setSelectedCompetition}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder={t("selectCompetition", { defaultValue: "Select a competition" })} />
                </SelectTrigger>
                <SelectContent className="bg-black text-white">
  {competitions.map((comp) => (
    <SelectItem
      key={comp._id}
      value={comp._id}
      className="bg-black text-white hover:bg-gray-800"
    >
      <div className="flex items-center justify-between w-full">
        <span>{comp.name}</span>
        <Badge variant="outline" className="ml-2">
          {t(comp.status.toLowerCase())}
        </Badge>
      </div>
    </SelectItem>
  ))}
</SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Competition Stats */}
        {selectedComp && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/90 dark:bg-gray-800/90 shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("totalTeams")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalParticipants}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-gray-800/90 shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("judged")}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {judgedParticipants}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-gray-800/90 shadow-xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("progress")}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalParticipants > 0
                      ? Math.round((judgedParticipants / totalParticipants) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboard */}
        {selectedComp && (
          <Card className="bg-white/90 dark:bg-gray-800/90 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <span>{t(`${selectedComp.name.toLowerCase().replace(/\s/g, '')}Rankings`, { defaultValue: `${selectedComp.name} Rankings` })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    {t("noScoresAvailable")}
                  </p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry._id}
                      className={`p-6 rounded-lg border transition-all duration-300 hover:shadow-md ${
                        entry.rank! <= 3
                          ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-800"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(entry.rank!)}
                            {getChangeIcon()}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {(() => {
                                const participantName = selectedComp.participants.find(
                                  (p) => p.id === entry.participantId
                                )?.name;
                                if (!participantName) {
                                  console.warn(
                                    `Participant ${entry.participantId} not found in competition ${selectedComp._id}`
                                  );
                                }
                                return participantName || t("unknown");
                              })()}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("performance")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {entry.totalScore.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t("totalScore")}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedComp.criteria.map((criterion) => {
                          const scoreEntry = entry.scores.find(
                            (s) => s.criterionId === criterion.id
                          );
                          if (!scoreEntry) {
                            console.warn(
                              `Missing score for criterion ${criterion.id} for participant ${entry.participantId}`
                            );
                          }
                          return (
                            <div key={criterion.id} className="text-center">
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {criterion.name}
                              </div>
                              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {scoreEntry ? scoreEntry.score.toFixed(1) : "N/A"}
                              </div>
                              <div className="text-xs text-gray-400">
                                ({criterion.weight}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {leaderboard.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                      {t("realTimeRankings", { defaultValue: "Real-time rankings: Updates as judges submit scores." })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;