import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Extract ID from the URL

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await client.connect();
    const db = client.db("judgehub");

    const competition = await db
      .collection("competitions")
      .findOne({ _id: new ObjectId(id) });
    if (!competition) {
      return NextResponse.json(
        { error: "Competition not found" },
        { status: 404 }
      );
    }

    const participants = await db
      .collection("participants")
      .find({ competitionId: new ObjectId(id) })
      .toArray();

    const scores = await db
      .collection("scoreboard")
      .find({ competitionId: new ObjectId(id) })
      .toArray();

    return NextResponse.json(
      { competition, participants, scores },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
