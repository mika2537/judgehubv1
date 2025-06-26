import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Participant {
  id: string;
  name: string;
  performance?: string;
}

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Competition {
  _id: ObjectId;
  name: string;
  status: string;
  participants: Participant[];
  criteria: Criterion[];
  judges: { id: string; name: string; email: string }[];
  scoredParticipantIds: string[];
  endDate?: string;
}

interface Score {
  competitionId: string;
  participantId: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { role, id: judgeId } = session.user;
    if (!["admin", "judge"].includes(role ?? "")) {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    const { db } = await connectToDb();

    // Filter competitions by judgeId
    const competitionDocs = await db
      .collection("competitions")
      .find({})
      .toArray();

    console.log("Competitions found for judge", judgeId, ":", competitionDocs);

    const competitions = competitionDocs.map((doc) => ({
      _id: doc._id.toString(),
      name: doc.name,
      status: doc.status,
      participants: (doc.participants || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        performance: p.performance || "",
      })),
      criteria: (doc.criteria || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        weight: c.weight || 0,
      })),
      scoredParticipantIds: doc.scoredParticipantIds || [],
      endDate: doc.endDate,
    }));

    // Fetch scores for this judge
    const scores = await db
      .collection("scoreboard")
      .find({ judgeId: new ObjectId(judgeId) })
      .project({ competitionId: 1, participantId: 1, _id: 0 })
      .toArray();

    const formattedCompetitions = competitions.map((comp) => ({
      ...comp,
      scoredParticipantIds: scores
        .filter((score) => (score as Score).competitionId === comp._id)
        .map((score) => score.participantId),
    }));

    // Detect language from Accept-Language header
    const acceptLanguage = req.headers.get("accept-language") || "en";
    const language = acceptLanguage.includes("mn")
      ? "mn"
      : acceptLanguage.includes("ja")
      ? "ja"
      : "en";

    return NextResponse.json({ competitions: formattedCompetitions, language });
  } catch (error) {
    console.error("Error in /api/judge route:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
