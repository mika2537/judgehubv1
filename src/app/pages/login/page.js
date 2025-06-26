"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getCsrfToken } from "next-auth/react";
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

export default function LoginPage() {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");

  const t = {
    en: {
      loginTitle: "Login to JudgeHub",
      loginDesc: "Enter your credentials to continue",
      email: "Email",
      password: "Password",
      login: "Login",
      register: "Register",
      error: "Please fill in all fields",
    },
    mn: {
      loginTitle: "JudgeHub-д системд нэвтрэх",
      loginDesc: "Нэвтрэх мэдээллээ оруулна уу",
      email: "И-мэйл",
      password: "Нууц үг",
      login: "Нэвтрэх",
      register: "Бүртгүүлэх",
      error: "Бүх талбарыг бөглөнө үү",
    },
  };

  useEffect(() => {
    const loadToken = async () => {
      const token = await getCsrfToken();
      if (token) setCsrfToken(token);
    };
    loadToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError(t[language].error);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
      csrfToken, // ✅ include token
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
    }
  };

  const handleRegisterRedirect = () => {
    router.push("register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          className="text-white border-white"
          onClick={() => setLanguage(language === "en" ? "mn" : "en")}
        >
          {language === "en" ? "MN" : "EN"}
        </Button>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-yellow-400" />
            {t[language].loginTitle}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {t[language].loginDesc}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="csrfToken" value={csrfToken} />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                {t[language].email}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-white/10 border-white/30 text-white placeholder:text-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                {t[language].password}
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

            <Button
              type="submit"
              className="w-full bg-yellow-400 text-purple-900 hover:bg-yellow-500 font-semibold"
            >
              {t[language].login}
            </Button>

            <Button
              type="button"
              onClick={handleRegisterRedirect}
              className="w-full text-white hover:underline mt-2"
            >
              {t[language].register}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
