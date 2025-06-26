import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

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
  participants: { id: string; name: string; performance?: string }[];
  judges: { id: string; name: string; email: string }[];
  scoredParticipantIds?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received request body:", body);

    const {
      competitionId,
      participantId,
      scores,
      judgeId,
      createdAt = new Date().toISOString(),
    }: {
      competitionId: string;
      participantId: string;
      scores?: ScoreInput[];
      judgeId: string;
      createdAt?: string;
    } = body;

    if (!competitionId || !participantId || !judgeId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: competitionId, participantId, judgeId",
        },
        { status: 400 }
      );
    }

    let competitionObjectId;
    try {
      competitionObjectId = new ObjectId(competitionId);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid competitionId format" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("judgehub");

    const competition = await db
      .collection("competitions")
      .findOne<Competition>({ _id: competitionObjectId });

    if (!competition) {
      return NextResponse.json(
        { error: `Competition not found: ${competitionId}` },
        { status: 404 }
      );
    }

    if (!competition.participants.some((p) => p.id === participantId)) {
      return NextResponse.json(
        { error: `Participant not found in competition: ${participantId}` },
        { status: 400 }
      );
    }

    if (!competition.judges.some((j) => j.id === judgeId)) {
      return NextResponse.json(
        { error: `Judge not authorized for competition: ${judgeId}` },
        { status: 403 }
      );
    }

    if (!scores) {
      const existingScores = await db.collection("scoreboard").findOne({
        competitionId: competitionObjectId,
        participantId,
        judgeId,
      });

      return NextResponse.json(
        {
          scores: existingScores
            ? existingScores.scores.map((s: any) => ({
                criterionId: s.criterionId,
                score: s.score,
                comment: s.comment || "",
              }))
            : [],
        },
        { status: 200 }
      );
    }

    if (!competition.criteria || !Array.isArray(competition.criteria)) {
      return NextResponse.json(
        { error: "Competition criteria not properly configured" },
        { status: 400 }
      );
    }

    const competitionCriteriaIds = new Set(
      competition.criteria.map((c) => c.id)
    );
    const submittedCriteriaIds = new Set(scores.map((s) => s.criterionId));

    const missingCriteria = [...competitionCriteriaIds].filter(
      (id) => !submittedCriteriaIds.has(id)
    );

    if (missingCriteria.length > 0) {
      return NextResponse.json(
        { error: "Missing scores for some criteria", missingCriteria },
        { status: 400 }
      );
    }

    for (const score of scores) {
      if (typeof score.score !== "number" || isNaN(score.score)) {
        return NextResponse.json(
          { error: `Invalid score for criterion ${score.criterionId}` },
          { status: 400 }
        );
      }
      if (score.score < 0 || score.score > 10) {
        return NextResponse.json(
          {
            error: `Score must be between 0 and 10 for criterion ${score.criterionId}`,
          },
          { status: 400 }
        );
      }
      if (!competitionCriteriaIds.has(score.criterionId)) {
        return NextResponse.json(
          { error: `Invalid criterionId: ${score.criterionId}` },
          { status: 400 }
        );
      }
    }

    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);

    const existingScore = await db.collection("scoreboard").findOne({
      competitionId: competitionObjectId,
      participantId,
      judgeId,
    });

    if (existingScore) {
      return NextResponse.json(
        {
          error: "Judge has already scored this participant",
          existingScoreId: existingScore._id,
        },
        { status: 409 }
      );
    }

    const scoreDoc = {
      competitionId: competitionObjectId,
      participantId,
      scores: scores.map((score) => ({
        criterionId: score.criterionId,
        score: score.score,
        comment: score.comment || "",
      })),
      totalScore,
      judgeId,
      createdAt: new Date(createdAt),
      updatedAt: new Date(),
    };

    const result = await db.collection("scoreboard").insertOne(scoreDoc);

    await db
      .collection("competitions")
      .updateOne(
        { _id: competitionObjectId },
        { $addToSet: { scoredParticipantIds: participantId } }
      );

    return NextResponse.json(
      {
        message: "Scores submitted successfully",
        data: {
          _id: result.insertedId,
          ...scoreDoc,
          competitionId: competitionId,
          judgeId: judgeId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/scores:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
