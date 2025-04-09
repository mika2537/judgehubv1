// app/api/matches/[id]/ratings/route.js
import { connectToDb } from "@/lib/mongodb";
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { ratings: incomingRatings, userId } = await request.json();

    // Validate request body
    if (!Array.isArray(incomingRatings)) {
      return NextResponse.json(
        { error: "Ratings must be provided as an array" },
        { status: 400 }
      );
    }

    if (incomingRatings.length === 0) {
      return NextResponse.json(
        { error: "At least one rating is required" },
        { status: 400 }
      );
    }

    const { db } = await connectToDb();
    const now = new Date();

    // Prepare ratings array that matches schema
    const ratings = incomingRatings.map(({ teamId, rating }) => {
      // Validate teamId
      if (!ObjectId.isValid(teamId)) {
        throw new Error(`Invalid team ID format: ${teamId}`);
      }

      // Validate rating
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error(`Rating must be an integer between 1-5 for team ${teamId}`);
      }

      return {
        teamId: new ObjectId(teamId),
        rating: rating
      };
    });

    // Verify all teams belong to this match
    const match = await db.collection("events").findOne({
      _id: new ObjectId(id),
      teams: { $all: ratings.map(r => r.teamId) }
    });

    if (!match) {
      return NextResponse.json(
        { error: "One or more teams not found in this match" },
        { status: 400 }
      );
    }

    // Create the rating document that matches schema
    const ratingDoc = {
      eventId: new ObjectId(id),
      ratings: ratings,
      createdAt: now,
      updatedAt: now,
      ...(userId && { userId: userId }) // Only include userId if provided
    };

    // Insert the complete rating document
    const result = await db.collection("ratings").insertOne(ratingDoc);

    // Update team statistics for each rated team
    await Promise.all(
      ratings.map(({ teamId, rating }) => 
        db.collection("teams").updateOne(
          { _id: teamId },
          {
            $inc: {
              totalRatings: rating,
              ratingsCount: 1
            },
            $set: {
              updatedAt: now
            }
          }
        )
      )
    );

    // Update match vote count
    await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { totalVotes: ratings.length } }
    );

    return NextResponse.json(
      {
        success: true,
        ratingId: result.insertedId.toString(),
        ratedTeams: ratings.length
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { 
        error: error.message.includes('validation') 
          ? "Data validation failed: " + error.message
          : "Failed to submit votes",
        details: error.message
      },
      { status: 500 }
    );
  }
}