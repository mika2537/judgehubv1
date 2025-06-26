import { NextResponse } from "next/server";
import { ObjectId, ClientSession } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { connectToDb } from "@/lib/mongodb";

// Define interfaces for better type safety
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  role: string;
}

interface Judge {
  id: string;
  [key: string]: unknown; // Adjust based on actual judge properties
}

interface Participant {
  id: string;
  [key: string]: unknown; // Adjust based on actual participant properties
}

interface Criterion {
  id: string;
  [key: string]: unknown; // Adjust based on actual criterion properties
}

interface Competition {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  judges: Judge[];
  participants: Participant[];
  criteria: Criterion[];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const role = url.searchParams.get("role");
    const competitionId = url.searchParams.get("competitionId");

    const { db } = await connectToDb(); // Removed unused `client`

    if (role === "judge") {
      // Define query type for MongoDB
      const query: {
        role: string;
        $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
      } = { role: "judge" };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const judges = await db.collection<User>("users").find(query).toArray();
      return NextResponse.json(
        judges.map((judge) => ({
          id: judge._id.toString(),
          name: judge.name,
          email: judge.email,
        })),
        { status: 200 }
      );
    }

    // Default behavior - fetch competitions with their scoreboards
    let competitionQuery: { _id?: ObjectId } = {};
    if (competitionId) {
      competitionQuery = { _id: new ObjectId(competitionId) };
    }

    const competitions = await db
      .collection("competitions")
      .find(competitionQuery)
      .toArray();

    const competitionIds = competitions.map((c) => new ObjectId(c._id));
    const scoreboards = await db
      .collection("scoreboard")
      .find({
        competitionId: { $in: competitionIds },
      })
      .toArray();

    const competitionsWithScores = competitions.map((competition) => {
      const competitionScoreboards = scoreboards.filter(
        (scoreboard) =>
          scoreboard.competitionId.toString() === competition._id.toString()
      );

      return {
        ...competition,
        scoreboards: competitionScoreboards,
        totalScores: competitionScoreboards.reduce(
          (acc, curr) => acc + (curr.score || 0),
          0
        ),
        participantCount: competitionScoreboards.length,
      };
    });

    return NextResponse.json(competitionsWithScores, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const competition: Competition = await request.json();
    const { db } = await connectToDb(); // Removed unused `client`

    const competitionData = {
      name: competition.name,
      description: competition.description,
      startDate: competition.startDate,
      endDate: competition.endDate,
      status: competition.status,
      judgeIds: competition.judges.map((j: Judge) =>
        ObjectId.isValid(j.id) ? new ObjectId(j.id) : j.id
      ),
      participantIds: competition.participants.map((p: Participant) => p.id),
      criterionIds: competition.criteria.map((c: Criterion) => c.id),
      judges: competition.judges,
      participants: competition.participants,
      criteria: competition.criteria,
    };

    const result = await db
      .collection("competitions")
      .insertOne(competitionData);

    return NextResponse.json(
      { success: true, id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating competition:", error);
    return NextResponse.json(
      {
        error: "Failed to create competition",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing competition ID" },
        { status: 400 }
      );
    }

    const competitionId = new ObjectId(id);
    const { client, db } = await connectToDb();

    const clientSession: ClientSession = client.startSession();
    try {
      await clientSession.withTransaction(async () => {
        const competition = await db
          .collection("competitions")
          .findOne({ _id: competitionId }, { session: clientSession });

        if (!competition) {
          throw new Error("Competition not found");
        }

        await db
          .collection("competitions")
          .deleteOne({ _id: competitionId }, { session: clientSession });

        // Delete related data if needed
      });
    } finally {
      await clientSession.endSession();
    }

    return NextResponse.json(
      { message: "Competition deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting competition:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete competition",
      },
      { status: 500 }
    );
  }
}
