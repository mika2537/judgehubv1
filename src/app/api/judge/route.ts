// src/app/api/judge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDb } from "@/lib/mongodb";

interface Participant {
  id: string;
  name: string;
  performance: string;
}

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Competition {
  _id: string;
  name: string;
  status: string;
  participants: Participant[];
  criteria: Criterion[];
  scoredParticipantIds: string[];
  endDate?: string;
}

interface Score {
  competitionId: string;
  participantId: string;
}

export async function GET(req: NextRequest) {
  try {
    type SessionUser = {
      id: string;
      role: string;
    };

    const session = (await getServerSession(authOptions)) as { user: SessionUser } | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { role, id: judgeId } = session.user;
    if (!["admin", "judge"].includes(role)) {
      return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const { db } = await connectToDb();

    const competitions = (await db.collection("competitions").find({}).toArray()).map((doc) => ({
      _id: doc._id.toString(),
      name: doc.name,
      status: doc.status,
      participants: doc.participants,
      criteria: doc.criteria,
      scoredParticipantIds: doc.scoredParticipantIds || [],
      endDate: doc.endDate,
    })) as Competition[];

    const scores = (await db
      .collection("scores")
      .find({ judgeId })
      .project({ competitionId: 1, participantId: 1, _id: 0 })
      .toArray()) as Score[];

    const formattedCompetitions = competitions.map((comp: Competition) => ({
      _id: comp._id,
      name: comp.name,
      status: comp.status,
      participants: comp.participants.map((p: Participant) => ({
        id: p.id,
        name: p.name,
        performance: p.performance,
      })),
      criteria: comp.criteria.map((c: Criterion) => ({
        id: c.id,
        name: c.name,
        weight: c.weight,
      })),
      scoredParticipantIds: scores
        .filter((score: Score) => score.competitionId === comp._id)
        .map((score) => score.participantId),
      endDate: comp.endDate,
    }));

    // Detect language from Accept-Language header
    const acceptLanguage = req.headers.get("accept-language") || "en";
    const language = acceptLanguage.includes("mn") ? "mn" : acceptLanguage.includes("ja") ? "ja" : "en";

    return NextResponse.json({ competitions: formattedCompetitions, language });
  } catch (error) {
    console.error("Error in /api/judge route:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}