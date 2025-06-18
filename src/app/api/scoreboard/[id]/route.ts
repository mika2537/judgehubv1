import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// Reuse MongoClient connection across requests
if (!client) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Extract ID from URL path

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid competition ID" }, { status: 400 });
    }

    await clientPromise; // Ensure client is connected
    if (!client) {
      throw new Error("MongoClient is not initialized");
    }
    const db = client.db("judgehub");

    const scoreboard = await db
      .collection("scoreboard")
      .find({ competitionId: new ObjectId(id) })
      .toArray();

    return NextResponse.json(scoreboard, { status: 200 });
  } catch (error) {
    console.error("MongoDB error:", error);
    return NextResponse.json({ error: "Failed to fetch scoreboard" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";