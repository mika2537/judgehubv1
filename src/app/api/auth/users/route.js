import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const { email, password, name } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({
          error: "Please provide email, password, and name.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign default role
    const role = "viewer";

    // Insert new user
    await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
