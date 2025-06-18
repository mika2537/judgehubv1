import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

if (!client) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

interface ScoreInput {
  criterionId: string;
  score: number;
  comment?: string;
}

interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Competition {
  _id: ObjectId;
  criteria: Criterion[];
  // You can add other fields here if needed
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      competitionId,
      participantId,
      scores,
      judgeId,
      createdAt,
    }: {
      competitionId: string;
      participantId: string;
      scores: ScoreInput[];
      judgeId: string;
      createdAt: string;
    } = body;

    if (
      !competitionId ||
      !participantId ||
      !judgeId ||
      !Array.isArray(scores)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !ObjectId.isValid(competitionId) ||
      !ObjectId.isValid(participantId) ||
      !ObjectId.isValid(judgeId)
    ) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    await clientPromise;
    if (!client) {
      throw new Error("MongoClient is not initialized");
    }

    const db = client.db("judgehub");

    // Fetch competition
    const competition = (await db
      .collection("events")
      .findOne({ _id: new ObjectId(competitionId) })) as Competition | null;

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    if (!Array.isArray(competition.criteria)) {
      return NextResponse.json(
        { error: "Invalid competition criteria" },
        { status: 400 }
      );
    }

    // Validate scores cover all criteria
    const criteriaIds = new Set(competition.criteria.map((c) => c.id));
    const receivedCriteriaIds = new Set(scores.map((s) => s.criterionId));
    if (
      criteriaIds.size !== receivedCriteriaIds.size ||
      ![...criteriaIds].every((id) => receivedCriteriaIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Scores must cover all criteria" },
        { status: 400 }
      );
    }

    for (const score of scores) {
      if (
        typeof score.score !== "number" ||
        score.score < 1 ||
        score.score > 10
      ) {
        return NextResponse.json(
          { error: "Scores must be numbers between 1 and 10" },
          { status: 400 }
        );
      }
    }

    // Calculate total score
    const totalScore = scores.reduce((total: number, score: ScoreInput) => {
      const criterion = competition.criteria.find(
        (c) => c.id === score.criterionId
      );
      if (!criterion) return total;
      return total + (score.score * criterion.weight) / 100;
    }, 0);

    // Check if judge already scored
    const existingScore = await db.collection("scoreboard").findOne({
      competitionId: new ObjectId(competitionId),
      participantId,
      judgeId: new ObjectId(judgeId),
    });

    if (existingScore) {
      return NextResponse.json(
        { error: "Participant already scored by this judge" },
        { status: 400 }
      );
    }

    // Insert new score
    const scoreEntry = {
      competitionId: new ObjectId(competitionId),
      participantId,
      judgeId: new ObjectId(judgeId),
      scores: scores.map((s: ScoreInput) => ({
        criterionId: s.criterionId,
        score: s.score,
        comment: s.comment || "",
      })),
      totalScore,
      createdAt: new Date(createdAt),
    };

    await db.collection("scoreboard").insertOne(scoreEntry);

    // Update participant as scored
    await db.collection("events").updateOne(
      { _id: new ObjectId(competitionId) },
      { $addToSet: { scoredParticipantIds: participantId } }
    );

    return NextResponse.json(
      { message: "Scores submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("MongoDB error:", error);
    return NextResponse.json(
      { error: "Failed to submit scores" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";