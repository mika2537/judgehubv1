// pages/api/events/[id]/ratings.js
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  try {
    const { db } = await connectToDatabase();
    
    const ratings = await db.collection("ratings")
      .find({ eventId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(50) // Get most recent 50 ratings
      .toArray();

    res.status(200).json(ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ 
      message: "Error fetching ratings",
      error: error.message 
    });
  }
}