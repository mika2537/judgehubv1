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
import { Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");

  const t = {
    en: {
      title: "Register to JudgeHub",
      desc: "Create your account to begin",
      email: "Email",
      password: "Password",
      name: "Your Name",
      register: "Register",
      backToLogin: "Back to Login",
      success: "Registration successful. Please log in.",
      error: "Please fill in all fields",
      passwordInvalid:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    },
    mn: {
      title: "JudgeHub-д бүртгүүлэх",
      desc: "Бүртгэл үүсгэж эхлэнэ үү",
      email: "И-мэйл",
      password: "Нууц үг",
      name: "Таны нэр",
      register: "Бүртгүүлэх",
      backToLogin: "Нэвтрэх рүү буцах",
      success: "Амжилттай бүртгэгдлээ. Нэвтэрнэ үү.",
      error: "Бүх талбарыг бөглөнө үү",
      passwordInvalid:
        "Нууц үг нь дор хаяж 8 тэмдэгт, том, жижиг үсэг, тоо агуулсан байх шаардлагатай.",
    },
  };

  const tr = t[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { email, password, name } = formData;

    if (!email || !password || !name) {
      setError(tr.error);
      return;
    }

    // Password must have at least 8 chars, 1 lowercase, 1 uppercase, 1 number
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(password)) {
      setError(tr.passwordInvalid);
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMsg = "Something went wrong";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // response was not JSON
        }
        throw new Error(errorMsg);
      }

      alert(tr.success);
      router.push("/pages/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 relative">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          className="text-white border-white"
          onClick={() => setLanguage(language === "en" ? "mn" : "en")}
        >
          {language === "en" ? "MN" : "EN"}
        </Button>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-yellow-400" />
            {tr.title}
          </CardTitle>
          <CardDescription className="text-gray-300">{tr.desc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              {tr.email}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              placeholder="email@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              {tr.password}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              placeholder="********"
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              {tr.name}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
              placeholder="Bat-Erdene"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-yellow-400 text-purple-900 hover:bg-yellow-500 font-semibold"
          >
            {tr.register}
          </Button>

          {/* Back to Login */}
          <Button
            variant="ghost"
            onClick={() => router.push("/pages/login")}
            className="w-full text-white hover:underline mt-2"
          >
            {tr.backToLogin}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
