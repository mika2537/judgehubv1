"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Shield, Eye, Gavel, Crown } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.role
    ) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        // <-- Make sure this matches route filename
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      alert("Registration successful. Please log in.");
      router.push("/pages/login");
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown className="h-5 w-5" />;
      case "judge":
        return <Gavel className="h-5 w-5" />;
      case "viewer":
        return <Eye className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case "admin":
        return "Create and manage events, participants, and system settings";
      case "judge":
        return "Score participants and view competition results";
      case "viewer":
        return "View events, results, and participant information";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-yellow-400" />
            Register to JudgeHub
          </CardTitle>
          <CardDescription className="text-gray-300">
            Create your account and choose your role to begin
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              placeholder="Create a password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Your Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Select Your Role</Label>
            <Select
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="bg-white/10 border-white/30 text-white">
                <SelectValue placeholder="Choose your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    <span>Admin</span>
                  </div>
                </SelectItem>
                <SelectItem value="judge">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4" />
                    <span>Judge</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Viewer</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role && (
            <Card className="bg-white/5 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(formData.role)}
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {formData.role.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">
                  {getRoleDescription(formData.role)}
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full bg-yellow-400 text-purple-900 hover:bg-yellow-500 font-semibold"
          >
            Register as {formData.role || "User"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
