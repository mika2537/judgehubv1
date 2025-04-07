// app/api/teams/route.js
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids")?.split(",") || [];

    const { db } = await connectToDatabase();

    const teams = await db
      .collection("Teams")
      .find({
        _id: { $in: ids.map((id) => new ObjectId(id)) },
      })
      .toArray();

    return Response.json(teams);
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
