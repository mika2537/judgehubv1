import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Adjust the import path as necessary
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
}

interface Score {
  competitionId: string;
  participantId: string;
}
export async function GET(_req: NextRequest) {
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

    const competitions = await db.collection("competitions").find({}).toArray();
    if (competitions.length === 0) {
      return NextResponse.json([]);
    }

    const scores: Score[] = await db
      .collection("scores")
      .find({ judgeId })
      .project({ competitionId: 1, participantId: 1, _id: 0 })
      .toArray();

      const formattedCompetitions = competitions.map((comp: Competition) => {
        const scoredParticipantIds = scores
          .filter((score: Score) => score.competitionId === comp._id)
          .map((score) => score.participantId);
      
        return {
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
          scoredParticipantIds,
        };
      });

    return NextResponse.json(formattedCompetitions);
  } catch (error) {
    console.error("Error in /api/judge route:", error );
    return NextResponse.json({ message: "Internal server error" ,_req}, { status: 500 });
  }
}