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

export async function GET(_req: NextRequest, { params }: { params: { id?: string } }) {
  if (!params || typeof params.id !== "string") {
    console.error("Invalid params:", params);
    return NextResponse.json({ error: "Competition ID is required" }, { status: 400 });
  }

  const id = params.id;

  try {
    await clientPromise;
    if (!client) {
      throw new Error("MongoClient is not initialized");
    }
    const db = client.db("judgehub");

    // Fetch competition
    const competition = await db.collection("competitions").findOne({ _id: new ObjectId(id) });
    console.log(`Competition found for _id: ${id}:`, competition ? "Yes" : "No");

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    // Aggregate scoreboard entries to average scores per participant
    const scoreboardAggregation = await db
      .collection("scoreboard")
      .aggregate([
        { $match: { competitionId: id } }, // String match
        {
          $unwind: "$scores",
        },
        {
          $group: {
            _id: {
              participantId: "$participantId",
              criterionId: "$scores.criterionId",
            },
            avgScore: { $avg: "$scores.score" },
          },
        },
        {
          $group: {
            _id: "$_id.participantId",
            scores: {
              $push: {
                criterionId: "$_id.criterionId",
                score: "$avgScore",
              },
            },
          },
        },
      ])
      .toArray();

    console.log(`Scoreboard aggregation for competitionId: ${id}:`, scoreboardAggregation);

    // Create score map with averaged scores
    const scoreMap = scoreboardAggregation.reduce((map: any, entry: any) => {
      map[entry._id] = {
        scores: entry.scores,
        totalScore: entry.scores.reduce((sum: number, score: any) => {
          const criterion = competition.criteria.find((c: any) => c.id === score.criterionId);
          return sum + (score.score * (criterion ? criterion.weight / 100 : 0));
        }, 0),
      };
      return map;
    }, {});

    // Generate ScoreboardEntry for all participants
    const formattedScoreboard = competition.participants.map((participant: any) => ({
      _id: `scoreboard-${participant.id}`,
      participantId: participant.id,
      scores: scoreMap[participant.id]?.scores || competition.criteria.map((criterion: any) => ({
        criterionId: criterion.id,
        score: 0,
      })),
      totalScore: scoreMap[participant.id]?.totalScore || 0,
    }));

    return NextResponse.json(formattedScoreboard, { status: 200 });
  } catch (error) {
    console.error(`MongoDB error for competitionId: ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch scoreboard" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
