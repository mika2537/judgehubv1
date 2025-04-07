// pages/api/events/[id]/vote.js
import { connectToDatabase } from "../../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const { ratings } = req.body;

  try {
    const { db } = await connectToDatabase();

    // Update each team's ratings
    const updates = Object.entries(ratings).map(([teamId, rating]) => {
      return db.collection("hha").updateOne(
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
    const event = await db.collection("hha").findOne({ _id: id });
    const updatedTeams = event.teams.map((team) => {
      const averageRating = team.totalPoints / team.ratingsCount;
      return { ...team, averageRating };
    });

    await db
      .collection("hha")
      .updateOne({ _id: id }, { $set: { teams: updatedTeams } });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting vote" });
  }
}
