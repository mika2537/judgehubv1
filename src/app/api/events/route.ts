import { connectToDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// Define an interface for the competition data
interface Competition {
  _id: ObjectId;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  judgeIds?: string[];
  participantIds?: string[];
  criterionIds?: string[];
  judges?: Array<{ id: string; [key: string]: unknown }>;
  participants?: Array<{ id: string; [key: string]: unknown }>;
  criteria?: Array<{ id: string; [key: string]: unknown }>;
  [key: string]: unknown; // Allow additional fields if needed
}

export async function GET() {
  try {
    const { db } = await connectToDb();
    const matches: Competition[] = await db
      .collection<Competition>("competitions")
      .find()
      .toArray();

    // Convert MongoDB _id to string for serialization
    const serializedMatches = matches.map((match) => ({
      ...match,
      _id: match._id.toString(),
      id: match._id.toString(), // Add both _id and id for compatibility
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
