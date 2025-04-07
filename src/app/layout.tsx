"use client"; // This must be at the top

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const userLoggedIn = localStorage.getItem("auth_token");

    if (!userLoggedIn) {
      router.push("/login");
    }
  }, []);

  return <html>
    <body>
      <SessionProvider>
        
    {children}

      </SessionProvider>
    </body>
    </html>;
}