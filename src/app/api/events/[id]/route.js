// app/api/events/[id]/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    console.log("Fetching event with ID:", id); // Debug log

    // Validate ID format
    if (!ObjectId.isValid(id)) {
      console.log("Invalid ID format:", id);
      return Response.json(
        { message: "Invalid event ID format" },
        { status: 400 }
      );
    }

    const { db } = await connectToDb();

    // 1. Get the event document
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    });

    console.log("Found event:", event); // Debug log

    if (!event) {
      return Response.json({ message: "Event not found" }, { status: 404 });
    }

    // 2. Get all referenced teams
    const teamIds = event.teams.map((t) => new ObjectId(t.$oid));
    const teams = await db
      .collection("teams")
      .find({
        _id: { $in: teamIds },
      })
      .toArray();

    console.log("Found teams:", teams); // Debug log

    // 3. Format response
    const responseData = {
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: new Date(event.startTime).toLocaleDateString(),
      location: event.location,
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
        totalVotes: event.totalVotes || 0,
        mostRatedTeam: event.featuredParticipant?.$oid || null,
        recentComments: event.recentComments || 0,
      },
    };

    console.log("Response data:", responseData); // Debug log

    return Response.json(responseData);
  } catch (error) {
    console.error("Full API error:", {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString(),
    });
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
