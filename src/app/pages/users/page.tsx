"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import { Trash2, ArrowLeft, User } from "lucide-react";
import { useToast } from "@/app/components/ui/use-toast";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/app/components/ThemeProvider";
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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

function ManageUsersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/users", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        throw new Error(data.error || t("failedToFetchUsers"));
      }
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
      sessionStorage.setItem("loginRedirect", "/pages/ManageUsers");
      router.push("/pages/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      toast({
        title: t("accessDenied"),
        description: t("onlyAdmins"),
        variant: "destructive",
      });
      router.push("/pages/Dashboard");
    } else if (status === "authenticated" && session?.user?.role === "admin") {
      fetchUsers();
    }
  }, [status, session, router, fetchUsers, toast, t]);

  const handleRoleChange = useCallback(
    async (userId: string, newRole: string) => {
      try {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, newRole }),
        });

        const data = await res.json();

        if (!res.ok && data.error !== "User not found or role unchanged") {
          throw new Error(data.error || t("failedToUpdateRole"));
        }

        toast({
          title: t("success"),
          description: t("roleUpdated"),
        });
        fetchUsers();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("failedToUpdateRole");
        console.error("Role update failed:", errorMessage);
        console.log("Attempting to update user", { userId, newRole });
        toast({
          title: t("error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [t, toast, fetchUsers]
  );

  const handleDelete = useCallback(
    async (userId: string) => {
      if (!confirm(t("confirmDeleteUser"))) return;
      try {
        const res = await fetch("/api/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t("failedToDeleteUser"));
        }

        toast({
          title: t("success"),
          description: t("userDeleted"),
        });
        fetchUsers();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t("failedToDeleteUser");
        toast({
          title: t("error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [t, toast, fetchUsers]
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error || (!session || session.user.role !== "admin")) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 text-lg font-semibold mb-4">
          {error || t("accessDenied")}
        </p>
        <Button
          onClick={() => router.push("/pages/Dashboard")}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
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
              className={`text-3xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {t("userManagement")}
            </h1>
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-2>
              {t("manageUserRoles")}
            </p>
          </div>
          <div className="flex items-center space-x-4">
          <Button
  variant="outline"
  size="sm"
  onClick={() => router.push("/pages/Dashboard")}
  className={`flex-1 ${
    theme === "dark"
      ? "bg-gray-700/20 border-gray-600 hover:bg-gray-700 text-gray-300"
      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
  }`} // <-- closed the backtick and bracket here
>
  <ArrowLeft className="h-4 w-4 mr-2" />
  {t("back")}
</Button>
            
          </div>
        </div>

        <Card
          className={`backdrop-blur-sm border-0 shadow-xl hover:shadow-lg transition-all duration-300 ${
            theme === "dark" ? "bg-gray-800/90 border-gray-700" : "bg-white/95 border-gray-200"
          }`}
        >
          <CardHeader>
            <CardTitle
              className={`text-xl ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {t("userManagement")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            {users.length === 0 ? (
              <div className="text-center">
                <p
                  className={`text-lg font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {t("noUsersFound")}
                </p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-md border transition-all duration-300 hover:scale-105 ${
                    theme === "dark" ? "bg-gray-700/80 border-gray-600" : "bg-gray-100 border-gray-200"
                  }`}
                >
                  <div>
                    <p
                      className={`font-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {user.name}
                    </p>
                    <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"} text-sm>
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 md:mt-0">
                    <Select
                      value={user.role}
                      onValueChange={(value) => {
                        if (value !== user.role) {
                          handleRoleChange(user._id, value);
                        }
                      }}
                    >
                      <SelectTrigger
                        className={`w-[120px] ${
                          theme === "dark"
                            ? "bg-gray-700/80 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        className={theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
                      >
                        <SelectItem value="admin">{t("admin")}</SelectItem>
                        <SelectItem value="judge">{t("judge")}</SelectItem>
                        <SelectItem value="viewer">{t("viewer")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => handleDelete(user._id)}
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ManageUsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ManageUsersContent />
    </Suspense>
  );
}