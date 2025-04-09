// app/api/teams/batch/route.js
import { connectToDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { teamIds } = await request.json();

    if (!teamIds || !Array.isArray(teamIds)) {
      return Response.json(
        { message: "Array of team IDs required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDb();
    const objectIds = teamIds.map((id) => new ObjectId(id));

    const teams = await db
      .collection("teams")
      .find({
        _id: { $in: match.teams.map((id) => new ObjectId(id)) },
      })
      .toArray();

    const responseData = {
      id: match._id.toString(),
      title: match.title,
      description: match.description,
      startTime: match.startTime,
      location: match.location,
      teams: teams.map((team) => ({
        id: team._id.toString(),
        name: team.name,
        averageRating: team.totalRatings / (team.ratingsCount || 1),
        stats: {
          // Adding team stats section
          wins: team.wins || 0,
          goalsFor: team.goalsFor || 0,
          rank: team.rank || "N/A",
          keyPlayers: team.keyPlayers || [],
        },
      })),
      totalVotes: match.totalVotes || 0,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
