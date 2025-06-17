// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface ScoreInput {
  competitionId: string;
  participantId: string;
  scores: { criterionId: string; score: number; comment?: string }[];
  totalScore: number;
  judgeId: string;
  createdAt: string;
}

interface Participant {
  id: string;
  name?: string;
  // add other participant fields if needed
}

interface Criterion {
  id: string;
  name?: string;
  weight?: number;
  // add other criterion fields if needed
}

interface Competition {
  _id: ObjectId;
  participants: Participant[];
  criteria: Criterion[];
  scoredParticipantIds?: string[];
  // add other competition fields if needed
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { role, id: judgeId } = session.user;
    if (!role || !["admin", "judge"].includes(role)) {
      return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
    }

    const body: ScoreInput = await req.json();
    const { competitionId, participantId, scores, totalScore, judgeId: submittedJudgeId } = body;

    if (submittedJudgeId !== judgeId) {
      return NextResponse.json({ message: "Judge ID mismatch" }, { status: 403 });
    }

    const { db } = await connectToDb();

    // Validate competition exists
    const competition = await db.collection<Competition>("competitions").findOne({
      _id: new ObjectId(competitionId),
    });

    if (!competition) {
      return NextResponse.json({ message: "Competition not found" }, { status: 404 });
    }

    // Validate participant exists in competition
    const participant = competition.participants.find((p) => p.id === participantId);
    if (!participant) {
      return NextResponse.json({ message: "Participant not found in competition" }, { status: 404 });
    }

    // Validate all criteria are scored
    const criteriaIds = competition.criteria.map((c) => c.id);
    if (
      scores.length !== criteriaIds.length ||
      !scores.every((s) => criteriaIds.includes(s.criterionId) && s.score >= 1 && s.score <= 10)
    ) {
      return NextResponse.json({ message: "Invalid or incomplete scores" }, { status: 400 });
    }

    // Check if participant has already been scored by this judge
    const existingScore = await db.collection("scores").findOne({
      competitionId,
      participantId,
      judgeId,
    });
    if (existingScore) {
      return NextResponse.json(
        { message: "Participant already scored by this judge" },
        { status: 400 }
      );
    }

    // Insert score
    await db.collection("scores").insertOne({
      competitionId,
      participantId,
      judgeId,
      scores,
      totalScore,
      createdAt: new Date(body.createdAt),
      updatedAt: new Date(),
    });

    // Update scoredParticipantIds in competition
    await db.collection("competitions").updateOne(
      { _id: new ObjectId(competitionId) },
      { $addToSet: { scoredParticipantIds: participantId } }
    );

    return NextResponse.json({ message: "Score submitted successfully" });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}