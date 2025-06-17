import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  // 1. Allow only POST method
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { competitionId, name } = req.body;

    // 2. Validate required fields
    if (!competitionId || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing competitionId or name" });
    }

    // 3. Validate competitionId format
    if (!ObjectId.isValid(competitionId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid competitionId format" });
    }

    const client = await clientPromise;
    const db = client.db();

    // 4. Optional: check if competition exists
    const competitionExists = await db
      .collection("competitions")
      .findOne({ _id: new ObjectId(competitionId) });
    if (!competitionExists) {
      return res
        .status(404)
        .json({ success: false, message: "Competition not found" });
    }

    // 5. Prepare participant document
    const participant = {
      competitionId: competitionId, // store as string or ObjectId? Usually string if you query by string elsewhere
      name,
      createdAt: new Date(),
    };

    // 6. Insert participant
    const result = await db.collection("participants").insertOne(participant);

    // 7. Success response
    res.status(201).json({ success: true, participantId: result.insertedId });
  } catch (error) {
    console.error("Error adding participant:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error adding participant",
        error: error.message,
      });
  }
}
