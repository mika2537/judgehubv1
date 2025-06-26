"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Slider } from "@/app/components/ui/slider";
import { Textarea } from "@/app/components/ui/textarea";
import { Star, Send, Clock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/app/components/ThemeProvider";
import { Competition } from "@/lib/types";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null | undefined;
      role?: string | null | undefined;
    };
  }
}

const Judge = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitionIndex, setSelectedCompetitionIndex] = useState(0);
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [existingScores, setExistingScores] = useState<
    Record<string, { score: number; comment: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme helpers
  const textColor = (darkColor: string, lightColor: string) =>
    theme === "dark" ? darkColor : lightColor;
  const bgColor = (darkColor: string, lightColor: string) =>
    theme === "dark" ? darkColor : lightColor;
  const borderColor = (darkColor: string, lightColor: string) =>
    theme === "dark" ? darkColor : lightColor;

  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("loginRedirect", "/pages/Judge");
      router.push("/pages/login");
    } else if (
      status === "authenticated" &&
      !["admin", "judge"].includes(session?.user?.role ?? "")
    ) {
      toast({
        title: t("accessDenied"),
        description: t("onlyJudgesOrAdmins"),
        variant: "destructive",
      });
      router.push("/pages/Dashboard");
    }
  }, [status, session, router, t, toast]);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/judge", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept-Language": navigator.language,
          },
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              t("failedFetchCompetitions", { status: res.status.toString() })
          );
        }
        const data = await res.json();
        if (!Array.isArray(data.competitions)) {
          throw new Error(t("invalidResponseFormat"));
        }
        const validCompetitions = data.competitions
          .filter(
            (comp: Competition) =>
              Array.isArray(comp.participants) &&
              comp.participants.length > 0 &&
              Array.isArray(comp.criteria) &&
              comp.criteria.length > 0
          )
          .map((comp: Competition) => ({
            ...comp,
            _id: comp._id.toString(),
            scoredParticipantIds: comp.scoredParticipantIds || [],
          }));
        setCompetitions(validCompetitions);
        if (!validCompetitions.length) {
          setError(t("noCompetitionsAvailable"));
        } else {
          setSelectedCompetitionIndex(0);
        }
      } catch (err) {
        console.error("Fetch competitions error:", err);
        setError(err instanceof Error ? err.message : t("unknownError"));
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchCompetitions();
    }
  }, [t, status]);

  useEffect(() => {
    if (!competitions.length || !session?.user) return;

    const comp = competitions[selectedCompetitionIndex];
    if (
      !Array.isArray(comp?.participants) ||
      !comp?.participants.length ||
      !Array.isArray(comp?.criteria) ||
      !comp?.criteria.length
    ) {
      setError(t("noParticipantsOrCriteria"));
      setSelectedParticipantIndex(0);
      return;
    }

    const participant = comp.participants[selectedParticipantIndex];
    if (!participant) {
      setError(t("noParticipantSelected"));
      return;
    }

    const fetchExistingScores = async () => {
      try {
        const payload = {
          competitionId: comp._id,
          participantId: participant.id,
          judgeId: session.user.id,
        };
        const res = await fetch("/api/scores", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const scoreMap: Record<string, { score: number; comment: string }> =
            data.scores.reduce(
              (
                acc: Record<string, { score: number; comment: string }>,
                s: { criterionId: string; score: number; comment?: string }
              ) => {
                acc[`${participant.id}-${s.criterionId}`] = {
                  score: s.score,
                  comment: s.comment || "",
                };
                return acc;
              },
              {} as Record<string, { score: number; comment: string }>
            );

          const comments: Record<string, string> = Object.keys(scoreMap).reduce(
            (acc, key) => {
              acc[key] = scoreMap[key]?.comment ?? "";
              return acc;
            },
            {} as Record<string, string>
          );
          setExistingScores(scoreMap);
          setScores(
            Object.keys(scoreMap).reduce(
              (acc, key) => {
                acc[key] = scoreMap[key].score;
                return acc;
              },
              {} as Record<string, number>
            )
          );
          setComments(comments);
          if (
            Object.keys(scoreMap).length > 0 &&
            (comp.scoredParticipantIds ?? []).includes(participant.id)
          ) {
            toast({
              title: t("alreadyScoredTitle"),
              description: t("alreadyScored", { name: participant.name }),
              variant: "default",
            });
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          setExistingScores({});
          setScores({});
          setComments({});
          toast({
            title: t("errorTitle"),
            description: errorData.error || t("failedFetchScores"),
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Failed to fetch existing scores:", err);
        toast({
          title: t("errorTitle"),
          description: t("failedFetchScores"),
          variant: "destructive",
        });
      }
    };

    fetchExistingScores();
  }, [
    competitions,
    selectedCompetitionIndex,
    selectedParticipantIndex,
    session,
    t,
    toast,
  ]);

  const competition = competitions[selectedCompetitionIndex];
  const participant = Array.isArray(competition?.participants)
    ? competition.participants[selectedParticipantIndex]
    : null;
  const isScored = participant
    ? (competition?.scoredParticipantIds || []).includes(participant.id)
    : false;

  const handleScoreChange = (criteriaId: string, value: number[]) => {
    if (!participant || isScored) {
      if (isScored) {
        toast({
          title: t("alreadyScoredTitle"),
          description: t("cannotRescore", { name: participant?.name || t("unknownParticipant") }),
          variant: "destructive",
        });
      }
      return;
    }
    setScores((prev) => ({
      ...prev,
      [`${participant.id}-${criteriaId}`]: value[0],
    }));
  };

  const handleCommentChange = (criteriaId: string, comment: string) => {
    if (!participant || isScored) {
      if (isScored) {
        toast({
          title: t("alreadyScoredTitle"),
          description: t("cannotRescore", { name: participant?.name || t("unknownParticipant") }),
          variant: "destructive",
        });
      }
      return;
    }
    setComments((prev) => ({
      ...prev,
      [`${participant.id}-${criteriaId}`]: comment,
    }));
  };

  const handleSubmitScores = async () => {
    try {
      if (!competition || !participant || !session?.user?.id) {
        throw new Error(t("missingRequiredData"));
      }

      const scoresData = competition.criteria?.map((criterion) => ({
        criterionId: criterion.id,
        score: scores[`${participant.id}-${criterion.id}`] || 0,
        comment: comments[`${participant.id}-${criterion.id}`] || "",
      }));

      const invalidScores =
        scoresData?.filter(
          (s) => s.score < 0 || s.score > 10 || isNaN(s.score)
        ) || [];
      if (invalidScores.length > 0) {
        throw new Error(t("invalidScores"));
      }

      const payload = {
        competitionId: competition._id,
        participantId: participant.id,
        judgeId: session.user.id,
        scores: scoresData,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("failedSubmitScores"));
      }

      toast({
        title: t("successTitle"),
        description: t("scoresSubmitted"),
        variant: "default",
      });

      const res = await fetch("/api/judge", {
        method: "GET",
        credentials: "include",
        headers: { "Accept-Language": navigator.language },
      });
      if (res.ok) {
        const data = await res.json();
        const validCompetitions = data.competitions
          .filter(
            (comp: Competition) =>
              Array.isArray(comp.participants) &&
              comp.participants.length > 0 &&
              Array.isArray(comp.criteria) &&
              comp.criteria.length > 0
          )
          .map((comp: Competition) => ({
            ...comp,
            _id: comp._id.toString(),
            scoredParticipantIds: comp.scoredParticipantIds || [],
          }));
        setCompetitions(validCompetitions);
      }
    } catch (error) {
      console.error("Failed to submit scores:", error);
      toast({
        title: t("errorTitle"),
        description:
          error instanceof Error ? error.message : t("submissionFailed"),
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error || !competitions.length) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${bgColor(
          "bg-gradient-to-br from-gray-900 to-gray-800",
          "bg-gradient-to-br from-gray-50 to-blue-50"
        )}`}
      >
        <p
          className={`text-3xl font-semibold mb-4 ${textColor(
            "text-red-400",
            "text-red-600"
          )}`}
        >
          {error || t("noCompetitionsAvailable")}
        </p>
        <Button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetch("/api/judge", {
              credentials: "include",
              headers: { "Accept-Language": navigator.language },
            })
              .then((res) => {
                if (!res.ok)
                  throw new Error(
                    t("failedFetchCompetitions", { status: res.status.toString() })
                  );
                return res.json();
              })
              .then((data) => {
                const validCompetitions = data.competitions
                  .filter(
                    (comp: Competition) =>
                      Array.isArray(comp.participants) &&
                      comp.participants.length > 0 &&
                      Array.isArray(comp.criteria) &&
                      comp.criteria.length > 0
                  )
                  .map((comp: Competition) => ({
                    ...comp,
                    _id: comp._id.toString(),
                    scoredParticipantIds: comp.scoredParticipantIds || [],
                  }));
                setCompetitions(validCompetitions);
                if (!validCompetitions.length)
                  setError(t("noCompetitionsAvailable"));
              })
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-2xl`}
        >
          {t("retry")}
        </Button>
        <Button
          onClick={() => router.push("/pages/Dashboard")}
          className={`mt-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-2xl`}
        >
          {t("back")}
        </Button>
      </div>
    );
  }

  if (
    !competition ||
    !participant ||
    !Array.isArray(competition.participants) ||
    !competition.criteria
  ) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${bgColor(
          "bg-gradient-to-br from-gray-900 to-gray-800",
          "bg-gradient-to-br from-gray-50 to-blue-50"
        )}`}
      >
        <p
          className={`text-3xl font-semibold mb-4 ${textColor(
            "text-gray-300",
            "text-gray-600"
          )}`}
        >
          {t("noCompetitionsAvailable")}
        </p>
        <Button
          onClick={() => router.push("/pages/Dashboard")}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-2xl`}
        >
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgColor(
        "bg-gradient-to-br from-gray-900 to-gray-800",
        "bg-gradient-to-br from-gray-50 to-blue-50"
      )}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <h1
                  className={`text-5xl font-semibold ${textColor(
                    "text-white",
                    "text-gray-900"
                  )}`}
                >
                  {t("judgePanel")}
                </h1>
                <p className={`text-2xl ${textColor("text-gray-300", "text-gray-600")}`}>
                  {t("welcomeJudge", {
                    name: session?.user?.name || t("unknownUser"),
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card
              className={`backdrop-blur-sm border-0 shadow-xl mb-6 hover:shadow-lg transition-all duration-300 ${bgColor(
                "bg-gray-800/90",
                "bg-white/95"
              )} ${borderColor("border-gray-700", "border-gray-200")}`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center space-x-2 text-3xl font-semibold ${textColor(
                    "text-white",
                    "text-gray-900"
                  )}`}
                >
                  <Star className="h-6 w-6 text-purple-600" />
                  <span>{t("competition")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedCompetitionIndex}
                  onChange={(e) => {
                    const newIndex = Number(e.target.value);
                    setSelectedCompetitionIndex(newIndex);
                    const nextComp = competitions[newIndex];
                    const unscored = Array.isArray(nextComp.participants)
                      ? nextComp.participants.filter(
                          (p) => !(nextComp.scoredParticipantIds || []).includes(p.id)
                        )
                      : [];
                    setSelectedParticipantIndex(
                      unscored.length > 0
                        ? Array.isArray(nextComp.participants)
                          ? nextComp.participants.findIndex(
                              (p) => p.id === unscored[0].id
                            )
                          : 0
                        : 0
                    );
                    setScores({});
                    setComments({});
                    setExistingScores({});
                  }}
                  className={`w-full p-3 border rounded-md text-2xl transition-colors duration-300 ${bgColor(
                    "bg-gray-700 text-white",
                    "bg-white text-gray-900"
                  )} ${borderColor("border-gray-600", "border-gray-200")}`}
                >
                  {competitions.map((comp, index) => (
                    <option key={comp._id} value={index}>
                      {comp.name}
                    </option>
                  ))}
                </select>
                <h3
                  className={`text-3xl font-semibold mt-4 mb-2 ${textColor(
                    "text-white",
                    "text-gray-900"
                  )}`}
                >
                  {competition.name}
                </h3>
                <Badge
                  className={`text-lg py-2 px-3 ${bgColor(
                    "bg-green-900 text-green-200",
                    "bg-green-100 text-green-800"
                  )}`}
                >
                  {t(competition.status.toLowerCase())}
                </Badge>
                <div className="mt-4 space-y-2">
                  <div
                    className={`flex items-center space-x-2 text-lg ${textColor(
                      "text-gray-300",
                      "text-gray-600"
                    )}`}
                  >
                    <User className="h-5 w-5" />
                    <span>
                      {Array.isArray(competition.participants)
                        ? competition.participants.length
                        : 0}{" "}
                      {t("participants")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 text-lg ${textColor(
                      "text-gray-300",
                      "text-gray-600"
                    )}`}
                  >
                    <Clock className="h-5 w-5" />
                    <span>{competition.endDate || t("timeTBD")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`backdrop-blur-sm border-1 shadow-xl hover:shadow-lg transition-all duration-300 ${bgColor(
                "bg-gray-800/90",
                "bg-white/95"
              )} ${borderColor("border-gray-700", "border-gray-200")}`}
            >
              <CardHeader>
                 <CardTitle
                  className={`text-3xl font-semibold ${textColor("text-white", "text-gray-900")}`}
                >
                  {t("participants")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(competition.participants) &&
                    competition.participants.map((p, index) => {
                      const isScored = (competition.scoredParticipantIds || []).includes(p.id);
                      const scoreCount = Object.keys(existingScores).filter((key) =>
                        key.startsWith(p.id)
                      ).length;
                      const totalCriteria = competition.criteria?.length ?? 0;
                      return (
                        <Button
  key={p.id}
  variant="ghost"
  className={`w-full justify-start text-left text-base md:text-lg py-3 px-4 rounded-lg border transition-all duration-200
    ${
      selectedParticipantIndex === index
        ? "border-2 border-blue-500 bg-blue-500/10 dark:bg-blue-500/20"
        : "border border-gray-400 dark:border-gray-600 hover:scale-[1.01]"
    }
    ${isScored ? "opacity-60 cursor-not-allowed" : ""}
  `}
  onClick={() => {
    setSelectedParticipantIndex(index);
    setScores({});
    setComments({});
    if (isScored) {
      toast({
        title: t("alreadyScoredTitle"),
        description: t("cannotRescore", { name: p.name }),
        variant: "destructive",
      });
    }
  }}
  title={isScored ? t("alreadyScored", { name: p.name }) : ""}
>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div
                                className={`font-medium text-xl ${textColor(
                                  "text-white",
                                  "text-gray-900"
                                )}`}
                              >
                                {p.name}
                              </div>
                              <div
                                className={`text-lg ${textColor(
                                  "text-gray-400",
                                  "text-gray-600"
                                )}`}
                              >
                              </div>
                              {isScored && (
                                <div
                                  className={`text-sm ${textColor(
                                    "text-gray-500",
                                    "text-gray-500"
                                  )}`}
                                >
                                  {t("scoresGiven", {
                                    count: scoreCount.toString(),
                                    total: totalCriteria.toString(),
                                  })}
                                </div>
                              )}
                            </div>
                            {isScored && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </Button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card
              key={`${competition._id}-${participant.id}`}
              className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 ${bgColor(
                "bg-gray-800/90",
                "bg-white/95"
              )} ${borderColor("border-gray-700", "border-gray-200")}`}
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center justify-between text-3xl font-semibold ${textColor(
                    "text-white",
                    "text-gray-900"
                  )}`}
                >
                  <span>
                    {t(isScored ? "viewingScores" : "scoring")} {participant.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isScored && (
                  <div
                    className={`mb-4 text-lg ${textColor(
                      "text-gray-300",
                      "text-gray-600"
                    )}`}
                  >
                    {t("scoreSummaryWithChecks", {
                      count: Object.keys(existingScores).length.toString(),
                      total: competition.criteria.length.toString(),
                      name: participant.name,
                    })}
                  </div>
                )}
                <div className="space-y-8">
                  {competition.criteria.map((criteria, index) => {
                    const scoreKey = `${participant.id}-${criteria.id}`;
                    const currentScore =
                      existingScores[scoreKey]?.score || scores[scoreKey] || 5;
                    const currentComment =
                      existingScores[scoreKey]?.comment || comments[scoreKey] || "";
                    const isCriterionScored = existingScores[scoreKey] !== undefined;
                    return (
                      <div
                        key={criteria.id}
                        className={`p-6 rounded-lg space-y-4 animate-fade-in ${bgColor(
                          "bg-gray-700",
                          "bg-gray-50"
                        )}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-3xl font-semibold ${textColor(
                              "text-white",
                              "text-gray-900"
                            )}`}
                          >
                            {criteria.name}
                          </h3>
                          {isCriterionScored && (
                            <Badge
                              variant="default"
                              className={`text-lg py-2 px-3 ${bgColor(
                                "bg-green-900 text-green-200",
                                "bg-green-100 text-green-800"
                              )}`}
                            >
                              <CheckCircle className="h-5 w-5 mr-1" /> {t("checked")}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-lg py-2 px-3 transition ${
                              theme === "dark"
                                ? "bg-gray-700/80 border-gray-600 text-gray-200"
                                : "bg-white border-gray-200 text-gray-700"
                            }`}
                          >
                            {t("weight", { value: criteria.weight.toString() })}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label
                                className={`text-lg font-medium ${textColor(
                                  "text-gray-300",
                                  "text-gray-700"
                                )}`}
                              >
                                {t("scoreLabel")} (1-10)
                              </label>
                              <span
                                className={`text-2xl font-bold ${getScoreColor(
                                  currentScore
                                )}`}
                              >
                                {currentScore}/10
                              </span>
                            </div>
                            <Slider
                              value={[currentScore]}
                              onValueChange={(value) =>
                                handleScoreChange(criteria.id, value)
                              }
                              max={10}
                              min={1}
                              step={0.1}
                              className="w-full"
                              disabled={isScored}
                            />
                            <div
                              className={`flex justify-between text-lg mt-1 ${textColor(
                                "text-gray-500",
                                "text-gray-500"
                              )}`}
                            >
                              <span>{t("poor")} (1)</span>
                              <span>{t("average")} (5)</span>
                              <span>{t("excellent")} (10)</span>
                            </div>
                          </div>

                          <div>
                            <label
                              className={`text-lg font-medium mb-2 block ${textColor(
                                "text-gray-300",
                                "text-gray-700"
                              )}`}
                            >
                              {t("commentsLabel")} ({t("optional")})
                            </label>
                            <Textarea
                              placeholder={t("commentPlaceholder", {
                                criteria: criteria.name.toLowerCase(),
                              })}
                              value={currentComment}
                              onChange={(e) =>
                                handleCommentChange(criteria.id, e.target.value)
                              }
                              className={`resize-none text-2xl transition-all duration-200 focus:scale-[1.01] py-3 px-4 ${bgColor(
                                "bg-gray-600 text-white",
                                "bg-white text-gray-900"
                              )} ${borderColor("border-gray-500", "border-gray-200")}`}
                              rows={2}
                              disabled={isScored}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScores({});
                      setComments({});
                    }}
                    disabled={isScored}
                    className={`text-2xl py-3 px-6 
                      ${borderColor("border-gray-600", "border-gray-200")} 
                      ${bgColor("bg-gray-700/80 hover:bg-gray-700", "bg-white hover:bg-gray-50")}
                      ${textColor("text-white", "text-gray-700")}`}
                  >
                    {t("clearScores")}
                  </Button>
                    <Button
                      onClick={handleSubmitScores}
                      className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover:shadow-lg text-2xl text-white py-3 px-6 ${
                        isScored ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={isScored}
                      title={isScored ? t("cannotRescore", { name: participant.name }) : ""}
                    >
                      <Send className="h-5 w-5 mr-2" />
                      {t("submitScores")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Judge;