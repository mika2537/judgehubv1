import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("voting_db"); // Replace with your DB name

    const events = await db
      .collection("events") // Replace with your collection name
      .find({})
      .sort({ isLive: -1, date: -1 }) // Sort live events first, then by date
      .toArray();

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Failed to fetch events" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
