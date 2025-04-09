// pages/api/events/[id]/vote.js
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  console.log("req :>> ", req);
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const { ratings } = req.body;

  try {
    const { db } = await connectToDatabase();

    // Update each team's ratings
    const updates = Object.entries(ratings).map(([teamId, rating]) => {
      return db.collection("ratings").updateOne(
        { _id: id, "teams.id": teamId },
        {
          $inc: {
            "teams.$.totalPoints": rating,
            "teams.$.ratingsCount": 1,
            totalVotes: 1,
          },
        }
      );
    });

    await Promise.all(updates);

    // Calculate new average ratings
    const event = await db.collection("events").findOne({ _id: id });
    const updatedTeams = event.teams.map((team) => {
      const averageRating = team.totalPoints / team.ratingsCount;
      return { ...team, averageRating };
    });

    await db
      .collection("teams")
      .updateOne({ _id: id }, { $set: { teams: updatedTeams } });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting vote" });
  }
}
