import { NextResponse } from "next/server";
import { ObjectId, ClientSession } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { connectToDb } from "@/lib/mongodb";
import Scoreboard from "../../pages/Scoreboard/page";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const role = url.searchParams.get("role");
    const competitionId = url.searchParams.get("competitionId"); // Optional filter

    const { client, db } = await connectToDb();

    if (role === "judge") {
      // Search for users with judge role
      const query: any = { role: "judge" };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const judges = await db.collection("users").find(query).toArray();
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
    let competitionQuery = {};
    if (competitionId) {
      competitionQuery = { _id: new ObjectId(competitionId) };
    }

    const competitions = await db
      .collection("competitions")
      .find(competitionQuery)
      .toArray();

    // Get scoreboards for these competitions
    const competitionIds = competitions.map((c) => new ObjectId(c._id));
    const scoreboards = await db
      .collection("scoreboard")
      .find({
        competitionId: { $in: competitionIds },
      })
      .toArray();

    // Combine competitions with their scoreboards
    const competitionsWithScores = competitions.map((competition) => {
      const competitionScoreboards = scoreboards.filter(
        (scoreboard) =>
          scoreboard.competitionId.toString() === competition._id.toString()
      );

      return {
        ...competition,
        scoreboards: competitionScoreboards,
        // Optional: Calculate aggregate scores
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

    const competition = await request.json();
    const { client, db } = await connectToDb();

    // Prepare competition data with proper ID handling
    const competitionData = {
      name: competition.name,
      description: competition.description,
      startDate: competition.startDate,
      endDate: competition.endDate,
      status: competition.status,
      // Convert only valid ObjectIds, keep others as strings
      judgeIds: competition.judges.map((j: any) =>
        ObjectId.isValid(j.id) ? new ObjectId(j.id) : j.id
      ),
      // Keep participant IDs as they are (could be UUIDs or other formats)
      participantIds: competition.participants.map((p: any) => p.id),
      // Keep criterion IDs as they are (assuming they're UUIDs)
      criterionIds: competition.criteria.map((c: any) => c.id),
      // Optionally store the full objects if needed
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

    const clientSession = client.startSession();
    try {
      await clientSession.withTransaction(async () => {
        const competition = await db
          .collection("competitions")
          .findOne({ _id: competitionId }, { session: clientSession });

        if (!competition) {
          throw new Error("Competition not found");
        }

        // Delete competition
        await db
          .collection("competitions")
          .deleteOne({ _id: competitionId }, { session: clientSession });

        // Delete related data if needed
        // ... (your existing deletion logic)
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
