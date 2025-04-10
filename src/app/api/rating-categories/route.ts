import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export  async function GET(req) {
  try {
    if (!client.isConnected) await client.connect();
    const db = client.db("voting_db");
    const categories = await db.collection("ratingCategories").find({}).toArray();
     return NextResponse.json(
      categories
          );
  } catch (err) {
    console.error("Error fetching rating categories:", err);
    return NextResponse.json({ error: "Failed to fetch categories" });
  }
}