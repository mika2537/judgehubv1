import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const { ratings } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID format" });
  }

  try {
    const { db } = await connectToDatabase();
    const eventId = new ObjectId(id);

    // Update each team's ratings in the event
    const bulkOps = Object.entries(ratings).map(([teamId, rating]) => ({
      updateOne: {
        filter: {
          _id: eventId,
          "teams._id": new ObjectId(teamId),
        },
        update: {
          $inc: {
            "teams.$.totalPoints": rating,
            "teams.$.ratingsCount": 1,
            totalVotes: 1,
          },
        },
      },
    }));

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "No ratings provided" });
    }

    const result = await db.collection("events").bulkWrite(bulkOps);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Event or teams not found" });
    }

    // Fetch updated event with averages
    const updatedEvent = await db
      .collection("events")
      .findOne({ _id: eventId });

    res.status(200).json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Vote submission error:", error);
    res.status(500).json({ message: "Error submitting vote" });
  }
}
