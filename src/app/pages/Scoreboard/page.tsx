"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
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
import { Trophy, Star, TrendingUp, Users, RefreshCw, ArrowLeft, Medal, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/app/components/ThemeProvider";

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Participant {
  id: string;
  name: string;
}

interface ScoreboardEntry {
  _id: string;
  competitionId: string;
  participantId: string;
  scores: { criterionId: string; score: number; comment?: string }[];
  totalScore: number;
  rank?: number;
  judgeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Competition {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  judgeIds: string[];
  participantIds: string[];
  criterionIds: string[];
  judges: { id: string; name: string; email: string }[];
  participants: Participant[];
  criteria: Criterion[];
  scoredParticipantIds?: string[];
  scoreboards?: ScoreboardEntry[];
  totalScores?: number;
  participantCount?: number;
}

function ScoreboardContent() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreboardEntry[]>([]);
  const [previousRanks, setPreviousRanks] = useState<{ [participantId: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/competitions");
      if (!response.ok) {
        throw new Error(t("failedFetchCompetitions", { status: response.status.toString() }));
      }
      const data: Competition[] = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(t("invalidResponseFormat"));
      }
      setCompetitions(data);
      if (data.length > 0 && !selectedCompetition) {
        setSelectedCompetition(data[0]._id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("unknownError");
      setError(errorMessage);
      toast({
        title: t("errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast, selectedCompetition]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      sessionStorage.setItem("loginRedirect", "/pages/Scoreboard");
      router.push("/pages/login");
    } else if (authStatus === "authenticated") {
      fetchCompetitions();
    }
  }, [authStatus, router, fetchCompetitions]);

  // Update leaderboard and track rank changes
  useEffect(() => {
    if (!selectedCompetition) {
      setLeaderboard([]);
      setPreviousRanks({});
      return;
    }
    const selectedComp = competitions.find((comp) => comp._id === selectedCompetition);
    if (selectedComp?.scoreboards) {
      const sortedData = [...selectedComp.scoreboards]
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      const newRanks = sortedData.reduce((acc, entry) => {
        acc[entry.participantId] = entry.rank!;
        return acc;
      }, {} as { [participantId: string]: number });

      setPreviousRanks((prev) => ({
        ...prev,
        ...newRanks,
      }));
      setLeaderboard(sortedData);
    } else {
      setLeaderboard([]);
      console.warn(`No scoreboard data for competition ${selectedCompetition}`);
    }
  }, [selectedCompetition, competitions]);

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
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-purple-600 text-white";
    }
  };

  const getChangeIcon = (participantId: string, currentRank: number) => {
    const previousRank = previousRanks[participantId];
    if (previousRank === undefined || previousRank === currentRank) {
      return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    } else if (previousRank > currentRank) {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    } else {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    }
  };

  const getParticipantName = (participantId: string) => {
    const selectedComp = competitions.find((comp) => comp._id === selectedCompetition);
    const participant = selectedComp?.participants?.find(p => p.id === participantId);
    return participant?.name ?? t("unknown");
  };

  const getCriterionName = (criterionId: string) => {
    const selectedComp = competitions.find((comp) => comp._id === selectedCompetition);
    const criterion = selectedComp?.criteria?.find(c => c.id === criterionId);
    return criterion?.name ?? t("unknown");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case t('live').toLowerCase():
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case t('scoring').toLowerCase():
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case t('upcoming').toLowerCase():
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case t('completed').toLowerCase():
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isCompetitionLive = (comp: Competition) => {
    return comp.status.toLowerCase() === "ongoing" || new Date(comp.endDate) > new Date();
  };

  const selectedComp = competitions.find((comp) => comp._id === selectedCompetition) ?? null;
  const judgedParticipants = selectedComp?.scoredParticipantIds?.length ?? 0;
  const totalParticipants = selectedComp?.participants?.length ?? 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error || !competitions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-confusion-500 text-lg font-semibold mb-4">{error || t("noCompetitionsAvailable")}</p>
        <Button
          onClick={() => fetchCompetitions()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {t("retry")}
        </Button>
        <Button
          onClick={() => router.push("/pages/Dashboard")}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-gray-50 to-blue-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/pages/Dashboard")}
                className={`hover:shadow-lg transition flex items-center ${
                  theme === "dark"
                    ? "bg-gray-700/80 border-gray-600 hover:bg-gray-700 text-gray-200"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("back")}
              </Button>
              <div>
                <h1 className={`text-3xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-2`}>
                  {t("leaderboard")}
                </h1>
                <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>{t("realTimeCompetitionResults")}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedComp && isCompetitionLive(selectedComp) && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className={`text-sm font-semibold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                    {t("live")}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCompetitions()}
                className={`flex-1 ${
                  theme === "dark"
                    ? "bg-gray-700/20 border-gray-600 hover:bg-gray-700 text-gray-300"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                }`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </div>

        {/* Competition Selector */}
        <div className="mb-8">
          <Card
            className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 ${
              theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
            }`}
          >
            <CardHeader>
              <CardTitle className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {t("selectEvent")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCompetition ?? ""} onValueChange={(value) => setSelectedCompetition(value || null)}>
                <SelectTrigger
                  className={`w-full max-w-md ${
                    theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
                  }`}
                >
                  <SelectValue placeholder={t("selectCompetition", { defaultValue: "Select a competition" })} />
                </SelectTrigger>
                <SelectContent className={theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {competitions.map((comp) => (
                    <SelectItem
                      key={comp._id}
                      value={comp._id}
                      className={`${
                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      } focus:bg-gray-100 dark:focus:bg-gray-700`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{comp.name}</span>
                        <Badge
                          variant="outline"
                          className={`ml-2 ${getStatusColor(t(comp.status.toLowerCase()))}`}
                        >
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
            <Card
              className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
              }`}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {t("totalTeams")}
                  </p>
                  <p className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {totalParticipants}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-700/80" : "bg-gray-100"
                  } text-blue-600 dark:text-blue-400`}
                >
                  <Users className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
              }`}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {t("judged")}
                  </p>
                  <p className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {judgedParticipants}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-700/80" : "bg-gray-100"
                  } text-yellow-600 dark:text-yellow-400`}
                >
                  <Star className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
              }`}
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {t("progress")}
                  </p>
                  <p className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    {totalParticipants > 0 ? Math.round((judgedParticipants / totalParticipants) * 100) : 0}%
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-700/80" : "bg-gray-100"
                  } text-green-600 dark:text-green-400`}
                >
                  <TrendingUp className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboard */}
        {selectedComp && (
          <Card
            className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 ${
              theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
            }`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center space-x-2 text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                <Trophy className="h-5 w-5 text-blue-500" />
                <span>
                  {t(`${selectedComp.name.toLowerCase().replace(/\s/g, '')} Rankings`, {
                    defaultValue: `${selectedComp.name}  Rankings`,
                  })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <p className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {t("noScoresAvailable")}
                  </p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry._id}
                      className={`p-6 rounded-lg border transition-all duration-300 hover:shadow-md hover:scale-105 ${getRankColor(
                        entry.rank!
                      )}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getRankIcon(entry.rank!)}
                            {getChangeIcon(entry.participantId, entry.rank!)}
                          </div>
                          <div>
                            <h3 className="text-3xl font-semibold text-white">{getParticipantName(entry.participantId)}</h3>
                            <p className="text-xl text-gray-200">{t("performance")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-7xl font-bold text-white">{entry.totalScore.toFixed(1)}</div>
                          <div className="text-3xl text-gray-200">{t("totalScore")}</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {entry.scores.map((score) => (
                          <div key={score.criterionId} className="text-center">
                            <div className="text-xl text-gray-200">{getCriterionName(score.criterionId)}</div>
                            <div className="text-4xl font-semibold text-white">{score.score.toFixed(1)}</div>
                            <div className="text-xl text-gray-300">
                              {selectedComp.criteria.find((c) => c.id === score.criterionId)?.weight ?? 0}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {leaderboard.length > 0 && (
                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    theme === "dark"
                      ? "bg-yellow-900/20 border-yellow-800"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-600 rounded-full" />
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-yellow-300" : "text-yellow-700"
                      }`}
                    >
                      {t("realTimeRankings", {
                        defaultValue: "Real-time rankings: Updates as judges submit scores.",
                      })}
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
}

export default function ScoreboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScoreboardContent />
    </Suspense>
  );
}