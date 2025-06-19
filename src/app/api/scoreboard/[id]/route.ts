import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDb } from "@/lib/mongodb";

// Define necessary interfaces
interface Criterion {
  id: string;
  name: string;
  weight: number;
}

interface Participant {
  id: string;
  name: string;
  performance: string;
}

interface Score {
  criterionId: string;
  score: number;
}

interface Competition {
  _id: ObjectId;
  name: string;
  description: string;
  date: string;
  criteria: Criterion[];
  participants: Participant[];
}

interface ScoreboardAggregation {
  _id: string; // participantId
  scores: Score[];
}

export async function GET(_req: NextRequest) {
  const id = _req.url.split("scoreboard/").pop();
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Competition ID is required" },
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDb();

    // Fetch competition
    const competition = await db
      .collection<Competition>("competitions")
      .findOne({ _id: new ObjectId(id) });
    console.log(`Competition found for id: ${id}:`, competition ? "Yes" : "No");

    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    // Aggregate scoreboard entries to average scores per participant
    const scoreboardAggregation = await db
      .collection("scoreboard")
      .aggregate<ScoreboardAggregation>([
        { $match: { competitionId: id } },
        { $unwind: "$scores" },
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

    console.log(
      `Scoreboard aggregation for competitionId: ${id}:`,
      scoreboardAggregation
    );

    // Create score map with averaged scores
    const scoreMap = scoreboardAggregation.reduce<
      Record<string, { scores: Score[]; totalScore: number }>
    >((map, entry) => {
      const scores = entry.scores;
      const totalScore = scores.reduce((sum: number, score: Score) => {
        const criterion = competition.criteria.find(
          (c) => c.id === score.criterionId
        );
        return sum + score.score * (criterion ? criterion.weight / 100 : 0);
      }, 0);

      map[entry._id] = {
        scores,
        totalScore,
      };

      return map;
    }, {});

    // Generate ScoreboardEntry for all participants
    const formattedScoreboard = competition.participants.map((participant) => ({
      _id: `scoreboard-${participant.id}`,
      participantId: participant.id,
      scores:
        scoreMap[participant.id]?.scores ||
        competition.criteria.map((criterion) => ({
          criterionId: criterion.id,
          score: 0,
        })),
      totalScore: scoreMap[participant.id]?.totalScore || 0,
    }));

    return NextResponse.json(formattedScoreboard, { status: 200 });
  } catch (error) {
    console.error(`MongoDB error for competitionId: ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch scoreboard" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
