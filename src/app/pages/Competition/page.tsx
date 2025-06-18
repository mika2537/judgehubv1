"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { Textarea } from "@/app/components/ui/textarea";
import { useLanguage } from "@/context/languageContext";
import { TFunction } from 'i18next';

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

// Named component for status badge


const StatusBadge = ({
  status,
  t,
}: {
  status: Competition['status'];
  t: TFunction;
}) => {
  switch (status) {
    case 'Upcoming':
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          {t('upcoming')}
        </Badge>
      );
    case 'Ongoing':
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <Award className="h-3 w-3 mr-1" />
          {t('live')}
        </Badge>
      );
    case 'Completed':
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('completed')}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const CompetitionPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

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
  const [newJudge, setNewJudge] = useState({ name: "", email: "" });

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/competitions", { credentials: "include" });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            t("failedFetchCompetitions", { status: res.status.toString() })
        );
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(t("invalidResponseFormat"));
      }

      const formattedData: Competition[] = data.map((item: Partial<Competition>) => ({
        _id: item._id?.toString(),
        name: item.name || t("unnamedCompetition"),
        description: item.description || "",
        startDate: item.startDate
          ? new Date(item.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        endDate: item.endDate
          ? new Date(item.endDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        status: item.status || "Upcoming",
        participants: Array.isArray(item.participants)
          ? item.participants.map((p: Partial<Participant>) => ({
              id: p.id || crypto.randomUUID(),
              name: p.name || t("unnamedParticipant"),
            }))
          : [],
        judges: Array.isArray(item.judges)
          ? item.judges.map((j: Partial<Judge>) => ({
              id: j.id || crypto.randomUUID(),
              name: j.name || t("unnamedJudge"),
              email: j.email || "",
            }))
          : [],
        criteria: Array.isArray(item.criteria)
          ? item.criteria.map((c: Partial<Criterion>) => ({
              id: c.id || crypto.randomUUID(),
              name: c.name || "",
              weight: Number(c.weight) || 0,
            }))
          : [],
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
    if (status === "unauthenticated") {
      router.push("/login?redirect=/competition");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      toast({
        title: t("accessDenied"),
        description: t("onlyAdmins"),
        variant: "destructive",
      });
      router.push("/dashboard");
    } else if (status === "authenticated") {
      fetchCompetitions();
    }
  }, [status, session, router, toast, t, fetchCompetitions]);

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

    const startDate = new Date(newCompetition.startDate);
    const endDate = new Date(newCompetition.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast({
        title: t("invalidDates"),
        description: t("validDatesRequired"),
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: t("invalidDates"),
        description: t("startDateBeforeEndDate"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCompetition,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("couldNotCreateCompetition"));
      }

      const createdCompetition = await res.json();
      setCompetitions([
        ...competitions,
        {
          ...createdCompetition,
          _id: createdCompetition._id?.toString(),
          startDate: new Date(createdCompetition.startDate).toISOString().split("T")[0],
          endDate: new Date(createdCompetition.endDate).toISOString().split("T")[0],
        },
      ]);
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
      setNewParticipant({ name: "" });
      setNewJudge({ name: "", email: "" });
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

  const removeCriteriaField = useCallback((id: string) => {
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
  }, [newCompetition.criteria.length, toast, t]);

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
      participants: [
        ...prev.participants,
        { id: crypto.randomUUID(), name: newParticipant.name.trim() },
      ],
    }));
    setNewParticipant({ name: "" });
  }, [newParticipant.name, toast, t]);

  const removeParticipant = useCallback((id: string) => {
    setNewCompetition((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
    }));
  }, []);

  const addJudge = useCallback(() => {
    if (!newJudge.name.trim() || !newJudge.email.trim()) {
      toast({
        title: t("invalidInput"),
        description: t("judgeNameEmailRequired"),
        variant: "destructive",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newJudge.email.trim())) {
      toast({
        title: t("invalidInput"),
        description: t("invalidEmail"),
        variant: "destructive",
      });
      return;
    }
    setNewCompetition((prev) => ({
      ...prev,
      judges: [
        ...prev.judges,
        {
          id: crypto.randomUUID(),
          name: newJudge.name.trim(),
          email: newJudge.email.trim(),
        },
      ],
    }));
    setNewJudge({ name: "", email: "" });
  }, [newJudge, toast, t]);

  const removeJudge = useCallback((id: string) => {
    setNewCompetition((prev) => ({
      ...prev,
      judges: prev.judges.filter((j) => j.id !== id),
    }));
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
        <div className="flex space-x-4">
          <Button
            onClick={fetchCompetitions}
            className="bg-blue-600 hover:bg-blue-700"
            aria-label={t("retry")}
          >
            {t("retry")}
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            aria-label={t("backToDashboard")}
          >
            {t("backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("competitionManagement")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {activeTab === "list"
                ? t("manageExistingCompetitions")
                : t("createNewCompetition")}
            </p>
          </div>
          {activeTab === "create" && (
            <Button
              variant="outline"
              onClick={() => setActiveTab("list")}
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={t("backToList")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToList")}
            </Button>
          )}
        </div>

        {activeTab === "list" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("allCompetitions")}
              </h2>
              <Button
                onClick={() => setActiveTab("create")}
                aria-label={t("createCompetition")}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("createCompetition")}
              </Button>
            </div>

            {competitions.length === 0 ? (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto flex flex-col items-center justify-center">
                    <List className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("noCompetitionsYet")}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {t("getStartedCreateCompetition")}
                    </p>
                    <Button
                      className="mt-6"
                      onClick={() => setActiveTab("create")}
                      aria-label={t("createCompetition")}
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
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {t(competition.name.toLowerCase().replace(/\s/g, ""), {
                            defaultValue: competition.name,
                          })}
                        </CardTitle>
                        <StatusBadge status={competition.status} t={t as TFunction} />
                      </div>
                      <CardDescription className="line-clamp-2">
                        {t(competition.description.toLowerCase().replace(/\s/g, ""), {
                          defaultValue: competition.description || t("noDescription"),
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(competition.startDate).toLocaleDateString()} -{" "}
                            {new Date(competition.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>
                              {competition.participants.length} {t("participants")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            <span>
                              {competition.judges.length} {t("judges")}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 flex space-x-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              router.push(`/pages/Competition/${competition._id}`)
                            }
                            aria-label={t("viewDetails")}
                          >
                            {t("viewDetails")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteCompetition(competition._id!)}
                            title={t("deleteCompetition")}
                            disabled={!competition._id}
                            aria-label={t("deleteCompetition")}
                          >
                            <Trash2 className="h-4 w-4" />
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("createNewCompetition")}
            </h2>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="competition-name"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("competitionName")}
                    </label>
                    <Input
                      id="competition-name"
                      placeholder={t("enterCompetitionName")}
                      value={newCompetition.name}
                      onChange={(e) =>
                        setNewCompetition({ ...newCompetition, name: e.target.value })
                      }
                      required
                      disabled={submitting}
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="competition-status"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("status")}
                    </label>
                    <select
                      id="competition-status"
                      value={newCompetition.status}
                      onChange={(e) =>
                        setNewCompetition({
                          ...newCompetition,
                          status: e.target.value as Competition["status"],
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={submitting}
                      aria-required="true"
                    >
                      <option value="Upcoming">{t("upcoming")}</option>
                      <option value="Ongoing">{t("live")}</option>
                      <option value="Completed">{t("completed")}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="competition-description"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("description")}
                  </label>
                  <Textarea
                    id="competition-description"
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
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="start-date"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("startDate")}
                    </label>
                    <Input
                      id="start-date"
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
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="end-date"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("endDate")}
                    </label>
                    <Input
                      id="end-date"
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
                      aria-required="true"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("participants")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addParticipant}
                      disabled={submitting}
                      aria-label={t("addParticipant")}
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
                    />
                    {newCompetition.participants.length > 0 && (
                      <div className="space-y-2">
                        {newCompetition.participants.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded"
                          >
                            <span className="text-sm">{p.name}</span>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeParticipant(p.id)}
                              disabled={submitting}
                              aria-label={t("removeParticipant", { name: p.name })}
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
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("judges")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addJudge}
                      disabled={submitting}
                      aria-label={t("addJudge")}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("addJudge")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("enterJudgeName")}
                      value={newJudge.name}
                      onChange={(e) => setNewJudge({ ...newJudge, name: e.target.value })}
                      disabled={submitting}
                    />
                    <Input
                      placeholder={t("enterJudgeEmail")}
                      value={newJudge.email}
                      onChange={(e) => setNewJudge({ ...newJudge, email: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  {newCompetition.judges.length > 0 && (
                    <div className="space-y-2">
                      {newCompetition.judges.map((j) => (
                        <div
                          key={j.id}
                          className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded"
                        >
                          <span className="text-sm">
                            {j.name} ({j.email})
                          </span>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeJudge(j.id)}
                            disabled={submitting}
                            aria-label={t("removeJudge", { name: j.name })}
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
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("judgingCriteria")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCriteriaField}
                      disabled={submitting}
                      aria-label={t("addCriteria")}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t("addCriteria")}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {newCompetition.criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                      >
                        <div className="md:col-span-5 space-y-2">
                          <label
                            htmlFor={`criterion-name-${criterion.id}`}
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {t("criterionName")}
                          </label>
                          <Input
                            id={`criterion-name-${criterion.id}`}
                            placeholder={t("enterCriterionName")}
                            value={criterion.name}
                            onChange={(e) =>
                              handleCriteriaChange(criterion.id, "name", e.target.value)
                            }
                            required
                            disabled={submitting}
                            aria-required="true"
                          />
                        </div>
                        <div className="md:col-span-5 space-y-2">
                          <label
                            htmlFor={`criterion-weight-${criterion.id}`}
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {t("weight")}
                          </label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id={`criterion-weight-${criterion.id}`}
                              type="number"
                              min="1"
                              max="100"
                              placeholder="0-100"
                              value={criterion.weight}
                              onChange={(e) =>
                                handleCriteriaChange(criterion.id, "weight", e.target.value)
                              }
                              required
                              disabled={submitting}
                              aria-required="true"
                            />
                            <Percent className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeCriteriaField(criterion.id)}
                            disabled={submitting}
                            aria-label={t("removeCriterion", { name: criterion.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t("totalWeight", {
                          value: newCompetition.criteria
                            .reduce((sum, c) => sum + Number(c.weight), 0)
                            .toString(),
                        })}
                      </span>
                      {newCompetition.criteria.reduce(
                        (sum, c) => sum + Number(c.weight),
                        0
                      ) !== 100 && (
                        <span className="text-sm text-red-600">{t("totalMustBe100")}</span>
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
                      newCompetition.criteria.reduce(
                        (sum, c) => sum + Number(c.weight),
                        0
                      ) !== 100
                    }
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    aria-label={t("createCompetition")}
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
};

export default CompetitionPage;