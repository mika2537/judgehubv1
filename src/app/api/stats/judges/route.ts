// src/app/api/stats/judges/route.ts
import { connectToDb } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Optional: only admins can access this
async function isAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const connection = await connectToDb();
    const db = connection?.db;
    if (!db) {
      throw new Error("Database connection failed.");
    }

    const judgeCount = await db
      .collection("users")
      .countDocuments({ role: "judge" });

    return NextResponse.json({ totalJudges: judgeCount });
  } catch (error) {
    console.error("Failed to count judges:", error);
    return NextResponse.json({ error: "Failed to count judges" }, { status: 500 });
  }
}