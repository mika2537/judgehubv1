"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VotingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(`/voting/${id}`)}`);
    }
  }, [status, router, id]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null; // or a loading spinner
  }

  // Rest of your voting page implementation
  // ...
}