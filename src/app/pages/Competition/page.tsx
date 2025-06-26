"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import {
  PlusCircle,
  Trash2,
  ArrowLeft,
  Calendar,
  List,
  Percent,
  Award,
  User,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { Textarea } from "@/app/components/ui/textarea";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/app/components/ThemeProvider";
import { TFunction } from "i18next";
import { Suspense } from "react";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      role?: string | null;
    };
  }
}

interface Participant {
  id: string;
  name: string;
}

interface Judge {
  id: string;
  name: string;
  email: string;
}

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Competition {
  _id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Ongoing" | "Completed";
  participants: Participant[];
  judges: Judge[];
  criteria: Criterion[];
}

const StatusBadge = ({
  status,
  t,
}: {
  status: Competition["status"];
  t: TFunction;
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case t("live").toLowerCase():
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case t("scoring").toLowerCase():
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case t("upcoming").toLowerCase():
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case t("completed").toLowerCase():
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Badge
      variant="secondary"
      className={`flex items-center text-xl ${getStatusColor(t(status.toLowerCase()))}`}
    >
      {status === "Upcoming" && <Clock className="h-4 w-4 mr-1" />}
      {status === "Ongoing" && <Award className="h-4 w-4 mr-1" />}
      {status === "Completed" && <CheckCircle className="h-4 w-4 mr-1" />}
      {t(status.toLowerCase())}
    </Badge>
  );
};

function CompetitionContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Judge search functionality
  const [judgeSearch, setJudgeSearch] = useState("");
  const [debouncedJudgeSearch] = useDebounce(judgeSearch, 500);
  const [availableJudges, setAvailableJudges] = useState<Judge[]>([]);
  const [isSearchingJudges, setIsSearchingJudges] = useState(false);

  const [newCompetition, setNewCompetition] = useState<Omit<Competition, "_id">>({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "Upcoming",
    participants: [],
    judges: [],
    criteria: [{ id: crypto.randomUUID(), name: "", weight: 0 }],
  });

  const [newParticipant, setNewParticipant] = useState({ name: "" });

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/competitions", { credentials: "include" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("failedFetchCompetitions"));
      }

      const data = await res.json();
      const formattedData: Competition[] = data.map((item: Competition) => ({
        _id: item._id?.toString(),
        name: item.name || t("unnamedCompetition"),
        description: item.description || "",
        startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "",
        endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "",
        status: item.status || "Upcoming",
        participants: item.participants || [],
        judges: item.judges || [],
        criteria: item.criteria || [],
      }));

      setCompetitions(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("unknownError");
      setError(errorMessage);
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      sessionStorage.setItem("loginRedirect", "/pages/Competition");
      router.push("/pages/login");
    } else if (authStatus === "authenticated" && session?.user?.role !== "admin") {
      toast({
        title: t("accessDenied"),
        description: t("onlyAdmins"),
        variant: "destructive",
      });
      router.push("/pages/Dashboard");
    } else if (authStatus === "authenticated") {
      fetchCompetitions();
    }
  }, [authStatus, session, router, toast, t, fetchCompetitions]);

  const fetchAvailableJudges = useCallback(async (searchTerm: string) => {
    setIsSearchingJudges(true);
    try {
      const res = await fetch(`/api/competitions?role=judge&search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error(t("failedToFetchJudges"));
      const data = await res.json();
      setAvailableJudges(data);
    } catch {
      toast({
        title: t("error"),
        description: t("failedToFetchJudges"),
        variant: "destructive",
      });
    } finally {
      setIsSearchingJudges(false);
    }
  }, [t, toast]);

  useEffect(() => {
    if (debouncedJudgeSearch.trim()) {
      fetchAvailableJudges(debouncedJudgeSearch);
    } else {
      setAvailableJudges([]);
    }
  }, [debouncedJudgeSearch, fetchAvailableJudges]);

  const handleCreateCompetition = useCallback(async () => {
    if (!newCompetition.name.trim()) {
      toast({
        title: t("invalidInput"),
        description: t("competitionNameRequired"),
        variant: "destructive",
      });
      return;
    }

    const hasEmptyCriteria = newCompetition.criteria.some(
      (criterion) => !criterion.name.trim() || Number(criterion.weight) <= 0
    );
    if (hasEmptyCriteria) {
      toast({
        title: t("invalidCriteria"),
        description: t("criteriaNameWeightRequired"),
        variant: "destructive",
      });
      return;
    }

    const totalWeight = newCompetition.criteria.reduce(
      (sum, c) => sum + Number(c.weight),
      0
    );
    if (totalWeight !== 100) {
      toast({
        title: t("invalidCriteria"),
        description: t("totalWeightMustBe100"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompetition),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("couldNotCreateCompetition"));
      }

      const createdCompetition = await res.json();
      setCompetitions([...competitions, { ...newCompetition, _id: createdCompetition.id }]);
      setActiveTab("list");

      toast({
        title: t("success"),
        description: t("competitionCreated"),
      });

      setNewCompetition({
        name: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Upcoming",
        participants: [],
        judges: [],
        criteria: [{ id: crypto.randomUUID(), name: "", weight: 0 }],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("couldNotCreateCompetition");
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [newCompetition, competitions, toast, t]);

  const handleDeleteCompetition = useCallback(
    async (id: string) => {
      if (!confirm(t("confirmDelete"))) return;

      try {
        const res = await fetch(`/api/competitions?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || t("couldNotDeleteCompetition"));
        }

        setCompetitions(competitions.filter((comp) => comp._id !== id));
        toast({
          title: t("success"),
          description: t("competitionDeleted"),
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("couldNotDeleteCompetition");
        toast({
          title: t("error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [competitions, toast, t]
  );

  const addJudge = useCallback(
    (judge: Judge) => {
      if (newCompetition.judges.some((j) => j.id === judge.id)) {
        toast({
          title: t("warning"),
          description: t("judgeAlreadyAdded"),
          variant: "default",
        });
        return;
      }

      setNewCompetition((prev) => ({
        ...prev,
        judges: [...prev.judges, judge],
      }));
      setJudgeSearch("");
      setAvailableJudges([]);
    },
    [newCompetition.judges, toast, t]
  );

  const removeJudge = useCallback((id: string) => {
    setNewCompetition((prev) => ({
      ...prev,
      judges: prev.judges.filter((j) => j.id !== id),
    }));
  }, []);

  const addParticipant = useCallback(() => {
    if (!newParticipant.name.trim()) {
      toast({
        title: t("invalidInput"),
        description: t("participantNameRequired"),
        variant: "destructive",
      });
      return;
    }
    setNewCompetition((prev) => ({
      ...prev,
      participants: [...prev.participants, { id: crypto.randomUUID(), name: newParticipant.name.trim() }],
    }));
    setNewParticipant({ name: "" });
  }, [newParticipant.name, toast, t]);

  const removeParticipant = useCallback((id: string) => {
    setNewCompetition((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
    }));
  }, []);

  const handleCriteriaChange = useCallback(
    (id: string, field: keyof Criterion, value: string | number) => {
      setNewCompetition((prev) => ({
        ...prev,
        criteria: prev.criteria.map((criterion) =>
          criterion.id === id
            ? { ...criterion, [field]: field === "weight" ? Number(value) : String(value) }
            : criterion
        ),
      }));
    },
    []
  );

  const addCriteriaField = useCallback(() => {
    setNewCompetition((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { id: crypto.randomUUID(), name: "", weight: 0 }],
    }));
  }, []);

  const removeCriteriaField = useCallback(
    (id: string) => {
      if (newCompetition.criteria.length <= 1) {
        toast({
          title: t("cannotRemove"),
          description: t("atLeastOneCriterion"),
          variant: "destructive",
        });
        return;
      }
      setNewCompetition((prev) => ({
        ...prev,
        criteria: prev.criteria.filter((criterion) => criterion.id !== id),
      }));
    },
    [newCompetition.criteria.length, toast, t]
  );

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className={`text-3xl font-semibold text-red-500 mb-4`}>{error}</p>
        <Button
          onClick={fetchCompetitions}
          className={`px-4 py-2 text-xl bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition`}
        >
          {t("retry")}
        </Button>
        <Button
          onClick={() => router.push("/pages/Dashboard")}
          className={`mt-4 px-4 py-2 text-xl bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition`}
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
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1
              className={`text-5xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("competitionManagement")}
            </h1>
            <p className={`text-2xl ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-2`}>
              {activeTab === "list" ? t("manageExistingCompetitions") : t("createNewCompetition")}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {activeTab === "create" && (
              <Button
                variant="outline"
                onClick={() => setActiveTab("list")}
                className={`text-xl hover:shadow-lg transition ${
                  theme === "dark" ? "bg-gray-700/80 border-gray-600 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backToList")}
              </Button>
            )}
          </div>
        </div>

        {activeTab === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2
                className={`text-4xl font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {t("allCompetitions")}
              </h2>
              <Button
                onClick={() => setActiveTab("create")}
                className={`text-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700`}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("createCompetition")}
              </Button>
            </div>

            {competitions.length === 0 ? (
              <Card
                className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 ${
                  theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
                }`}
              >
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex flex-col items-center justify-center">
                    <List
                      className={`h-12 w-12 mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    />
                    <h3
                      className={`text-3xl font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("noCompetitionsYet")}
                    </h3>
                    <p className={`text-2xl ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-2`}>
                      {t("getStartedCreateCompetition")}
                    </p>
                    <Button
                      className={`mt-6 text-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700`}
                      onClick={() => setActiveTab("create")}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("createCompetition")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map((competition) => (
                  <Card
                    key={competition._id || crypto.randomUUID()}
                    className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                      theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className={`text-3xl ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {competition.name}
                        </CardTitle>
                        <StatusBadge status={competition.status} t={t as TFunction} />
                      </div>
                      <CardDescription
                        className={`text-xl line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {competition.description || t("noDescription")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div
                          className={`flex items-center text-xl ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(competition.startDate).toLocaleDateString()} -{" "}
                            {new Date(competition.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex space-x-4 text-xl">
                          <div
                            className={`flex items-center ${
                              theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <User className="h-4 w-4 mr-2" />
                            <span>
                              {competition.participants.length} {t("participants")}
                            </span>
                          </div>
                          <div
                            className={`flex items-center ${
                              theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            <span>
                              {competition.judges.length} {t("judges")}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 flex space-x-2">
                          <Button
                            variant="outline"
                            className={`flex-1 text-xl ${
                              theme === "dark"
                                ? "bg-gray-700/20 border-gray-600 hover:bg-gray-700 text-gray-300"
                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                            }`}
                            onClick={() => router.push(`/pages/Competition/${competition._id}`)}
                          >
                            {t("viewDetails")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteCompetition(competition._id!)}
                            disabled={!competition._id}
                          >
                            <Trash2
                              className={`h-4 w-4 ${
                                theme === "dark" ? "border-white text-white" : "border-black text-black"
                              }`}
                            />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2
              className={`text-4xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("createNewCompetition")}
            </h2>
            <Card
              className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 ${
                theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
              }`}
            >
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      className={`text-xl font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("competitionName")}
                    </label>
                    <Input
                      placeholder={t("enterCompetitionName")}
                      value={newCompetition.name}
                      onChange={(e) =>
                        setNewCompetition({ ...newCompetition, name: e.target.value })
                      }
                      required
                      disabled={submitting}
                      className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xl font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("status")}
                    </label>
                    <select
                      value={newCompetition.status}
                      onChange={(e) =>
                        setNewCompetition({
                          ...newCompetition,
                          status: e.target.value as Competition["status"],
                        })
                      }
                      className={`text-xl flex h-10 w-full rounded-md border px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"
                      }`}
                      required
                      disabled={submitting}
                    >
                      <option value="Upcoming">{t("upcoming")}</option>
                      <option value="Ongoing">{t("live")}</option>
                      <option value="Completed">{t("completed")}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className={`text-xl font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {t("description")}
                  </label>
                  <Textarea
                    placeholder={t("enterDescription")}
                    value={newCompetition.description}
                    onChange={(e) =>
                      setNewCompetition({
                        ...newCompetition,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    disabled={submitting}
                    className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      className={`text-xl font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("startDate")}
                    </label>
                    <Input
                      type="date"
                      value={newCompetition.startDate}
                      onChange={(e) =>
                        setNewCompetition({
                          ...newCompetition,
                          startDate: e.target.value,
                        })
                      }
                      required
                      disabled={submitting}
                      className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-xl font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {t("endDate")}
                    </label>
                    <Input
                      type="date"
                      value={newCompetition.endDate}
                      onChange={(e) =>
                        setNewCompetition({
                          ...newCompetition,
                          endDate: e.target.value,
                        })
                      }
                      required
                      disabled={submitting}
                      className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-3xl font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("participants")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addParticipant}
                      disabled={submitting}
                      className={`text-xl ${theme === "dark" ? "bg-gray-700/80 border-gray-600 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("addParticipant")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder={t("enterParticipantName")}
                      value={newParticipant.name}
                      onChange={(e) => setNewParticipant({ name: e.target.value })}
                      disabled={submitting}
                      className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                    />
                    {newCompetition.participants.length > 0 && (
                      <div className="space-y-2">
                        {newCompetition.participants.map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              theme === "dark" ? "bg-gray-700/80" : "bg-gray-100"
                            }`}
                          >
                            <span className={`text-xl ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                              {p.name}
                            </span>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeParticipant(p.id)}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-3xl font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("judges")}
                    </h3>
                  </div>
                  <div className="relative">
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <Search className={`h-4 w-4 mx-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                      <Input
                        placeholder={t("searchJudges")}
                        value={judgeSearch}
                        onChange={(e) => setJudgeSearch(e.target.value)}
                        disabled={submitting}
                        className={`text-xl border-0 focus-visible:ring-0 ${
                          theme === "dark" ? "bg-gray-700/80 text-white" : "bg-white text-gray-900"
                        }`}
                      />
                    </div>

                    {isSearchingJudges && (
                      <div
                        className={`absolute z-10 w-full mt-1 shadow-lg rounded-md p-2 ${
                          theme === "dark" ? "bg-gray-800" : "bg-white"
                        }`}
                      >
                        <div className="text-center py-2 text-xl">{t("searching")}...</div>
                      </div>
                    )}

                    {availableJudges.length > 0 && !isSearchingJudges && (
                      <div
                        className={`absolute z-10 w-full mt-1 shadow-lg rounded-md max-h-60 overflow-auto ${
                          theme === "dark" ? "bg-gray-800" : "bg-white"
                        }`}
                      >
                        {availableJudges.map((judge) => (
                          <div
                            key={judge.id}
                            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center`}
                            onClick={() => addJudge(judge)}
                          >
                            <div>
                              <p
                                className={`text-xl font-medium ${
                                  theme === "dark" ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {judge.name}
                              </p>
                              <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{judge.email}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`text-xl ${theme === "dark" ? "bg-gray-700/80 border-gray-600 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                            >
                              {t("add")}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {newCompetition.judges.length > 0 && (
                    <div className="space-y-2">
                      {newCompetition.judges.map((judge) => (
                        <div
                          key={judge.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            theme === "dark" ? "bg-gray-700/80" : "bg-gray-100"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-xl font-medium ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {judge.name}
                            </p>
                            <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{judge.email}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeJudge(judge.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-3xl font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("judgingCriteria")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCriteriaField}
                      disabled={submitting}
                      className={`text-xl ${theme === "dark" ? "bg-gray-700/80 border-gray-600 hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("addCriteria")}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {newCompetition.criteria.map((criterion) => (
                      <div key={criterion.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 space-y-2">
                          <label
                            className={`text-xl font-medium ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {t("criterionName")}
                          </label>
                          <Input
                            placeholder={t("enterCriterionName")}
                            value={criterion.name}
                            onChange={(e) => handleCriteriaChange(criterion.id, "name", e.target.value)}
                            required
                            disabled={submitting}
                            className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                          />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                          <label
                            className={`text-xl font-medium ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {t("weight")}
                          </label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="0-100"
                              value={criterion.weight}
                              onChange={(e) => handleCriteriaChange(criterion.id, "weight", e.target.value)}
                              required
                              disabled={submitting}
                              className={`text-xl ${theme === "dark" ? "bg-gray-700/80 text-white border-gray-600" : "bg-white text-gray-900 border-gray-200"}`}
                            />
                            <Percent className={`h-4 w-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeCriteriaField(criterion.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xl ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {t("totalWeight", {
                          value: newCompetition.criteria.reduce((sum, c) => sum + Number(c.weight), 0).toString(),
                        })}
                      </span>
                      {newCompetition.criteria.reduce((sum, c) => sum + Number(c.weight), 0) !== 100 && (
                        <span className="text-xl text-red-600">{t("totalMustBe100")}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleCreateCompetition}
                    disabled={
                      submitting ||
                      !newCompetition.name.trim() ||
                      !newCompetition.startDate ||
                      !newCompetition.endDate ||
                      newCompetition.criteria.some((c) => !c.name.trim() || c.weight <= 0) ||
                      newCompetition.criteria.reduce((sum, c) => sum + Number(c.weight), 0) !== 100
                    }
                    className={`text-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700`}
                  >
                    {submitting ? t("creating") : t("createCompetition")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompetitionPage() {
  return (
    <Suspense fallback={<div className="text-2xl">Loading...</div>}>
      <CompetitionContent />
    </Suspense>
  );
}