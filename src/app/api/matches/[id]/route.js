// app/api/matches/[id]/route.js
import { connectToDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    const { teamId, rating, userId } = data;

    // Validate inputs
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid match ID format" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID format" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const { db } = await connectToDb();
    const now = new Date();

    // Verify the team belongs to this match
    const match = await db.collection("events").findOne({
      _id: new ObjectId(id),
      teams: new ObjectId(teamId),
    });

    if (!match) {
      return NextResponse.json(
        { error: "Team not found in this match" },
        { status: 404 }
      );
    }

    // Create rating document
    const ratingDoc = {
      eventId: new ObjectId(id),
      teamId: new ObjectId(teamId),
      rating: Math.round(rating),
      userId: userId ? new ObjectId(userId) : null,
      createdAt: now,
      updatedAt: now,
    };

    // Start transaction for atomic operations
    const session = db.client.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        // Insert rating
        result = await db
          .collection("ratings")
          .insertOne(ratingDoc, { session });

        // Update match vote count
        await db
          .collection("events")
          .updateOne(
            { _id: new ObjectId(id) },
            { $inc: { totalVotes: 1 } },
            { session }
          );

        // Update team statistics
        await db.collection("teams").updateOne(
          { _id: new ObjectId(teamId) },
          {
            $inc: {
              totalRatings: rating,
              ratingsCount: 1,
            },
            $set: {
              updatedAt: now,
            },
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      {
        success: true,
        matchId: id,
        teamId: teamId,
        ratingId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      {
        error: "Failed to submit vote",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
export async function GET(request, { params: { id } }) {
  try {
    console.log("Fetching match with ID:", id);

    // Validate the ID format
    if (!id) {
      return Response.json(
        { message: "Match ID is required" },
        { status: 400 }
      );
    }
    if (!ObjectId.isValid(id)) {
      return Response.json(
        { message: "Invalid match ID format" },
        { status: 400 }
      );
    }

    const { db } = await connectToDb();

    // 1. Get the match document
    const match = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    if (!match) {
      return Response.json({ message: "Match not found" }, { status: 404 });
    }

    // 2. Get all referenced teams - CORRECTED QUERY
    const teamIds = match.teams; // Already ObjectIds
    const teams = await db
      .collection("teams")
      .find({
        _id: { $in: teamIds },
      })
      .toArray();

    console.log(`Found ${teams.length} teams`);

    // 3. Format response
    const responseData = {
      id: match._id.toString(),
      title: match.title,
      description: match.description,
      date: new Date(match.startTime).toLocaleDateString(),
      location: match.location,
      teams: teams.map((team) => ({
        id: team._id.toString(),
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        totalPoints: team.totalPoints || 0,
        averageRating:
          team.totalPoints && team.ratingsCount
            ? parseFloat((team.totalPoints / team.ratingsCount).toFixed(1))
            : 0,
        ratingsCount: team.ratingsCount || 0,
        color: team.color || "bg-gray-500",
        players: team.players || [],
        stats: team.stats || {
          wins: 0,
          losses: 0,
          draws: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        },
      })),
      matchStats: {
        totalVotes: match.totalVotes || 0,
        mostRatedTeam: match.featuredParticipant?.toString() || null,
        recentComments: match.recentComments || 0,
      },
    };

    return Response.json(responseData);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
