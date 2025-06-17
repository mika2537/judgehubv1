"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { Trash2 } from "lucide-react";

export default function ManageUsersPage() {
  const { data: session, status } = useSession();

  interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.role === "admin") fetchUsers();
  }, [session]);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (res.ok) setUsers(data);
    else setError(data.error || "Failed to fetch users");
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
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
        throw new Error(data.error || "Failed to update role");
      }

      fetchUsers();
    } catch (err) {
      console.error("Role update failed:", (err as Error).message);
      console.log("Attempting to update user", { userId, newRole });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) fetchUsers();
  };

  if (status === "loading") return <p className="text-white">Loading...</p>;
  if (!session || session.user.role !== "admin")
    return <p className="text-red-500">Access Denied</p>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-white">User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}
          {users.map((user) => (
            <div
              key={user._id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/10 p-4 rounded-md border border-white/20"
            >
              <div>
                <p className="text-white font-semibold">{user.name}</p>
                <p className="text-gray-300 text-sm">{user.email}</p>
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
                  <SelectTrigger className="bg-white/10 text-white w-[120px] border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="judge">Judge</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
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
          ))}
        </CardContent>
      </Card>
    </div>
  );
}