import { connectToDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId, Collection } from "mongodb";

interface Competition {
  _id: ObjectId;
  name: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  participants?: unknown[];
  [key: string]: unknown;
}

export async function GET() {
  try {
    const { db } = await connectToDb();

    const competitionCollection: Collection<Competition> = db.collection("competitions");

    const matches = await competitionCollection.find().toArray();

    const serializedMatches = matches.map((match) => ({
      ...match,
      _id: match._id.toString(),
      id: match._id.toString(),
    }));

    return NextResponse.json(serializedMatches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}