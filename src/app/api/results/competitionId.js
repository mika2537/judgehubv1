import { ObjectId } from "mongodb";
import clientPromise from "../../../../../lib/mongodb";

export default async function handler(req, res) {
  const { competitionId } = req.query;

  // 1. Validate presence of competitionId
  if (!competitionId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing competitionId parameter" });
  }

  // 2. Validate competitionId is a valid ObjectId
  if (!ObjectId.isValid(competitionId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid competitionId format" });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // 3. Optional: Verify competition exists
    const competitionExists = await db
      .collection("competitions")
      .findOne({ _id: new ObjectId(competitionId) });
    if (!competitionExists) {
      return res
        .status(404)
        .json({ success: false, message: "Competition not found" });
    }

    // 4. Query participants belonging to this competition
    const participants = await db
      .collection("participants")
      .find({ competitionId })
      .toArray();

    // 5. Query scores belonging to this competition
    const scores = await db
      .collection("scores")
      .find({ competitionId })
      .toArray();

    // 6. Calculate totals and averages
    const results = participants.map((participant) => {
      const participantIdStr = participant._id.toString();
      const participantScores = scores.filter(
        (s) => s.participantId === participantIdStr
      );

      const total = participantScores.reduce((sum, score) => {
        return (
          sum + Object.values(score.scores).reduce((acc, val) => acc + val, 0)
        );
      }, 0);

      return {
        participantId: participant._id,
        name: participant.name,
        totalScore: total,
        averageScore:
          participantScores.length > 0 ? total / participantScores.length : 0,
        judgeCount: participantScores.length,
      };
    });

    // 7. Sort descending by totalScore
    results.sort((a, b) => b.totalScore - a.totalScore);

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Error fetching competition results:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching results" });
  }
}
