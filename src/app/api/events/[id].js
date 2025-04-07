// pages/api/events/[id].js
import { connectToDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const { db } = await connectToDatabase();
    const event = await db.collection("hha").findOne({ _id: id });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching event" });
  }
}
