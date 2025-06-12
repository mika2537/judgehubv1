// /app/api/auth/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/lib/mongodb"; // Make sure connectToDb is exported
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const { email, password, name, role } = await request.json();

    // Basic validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to DB
    const { db } = await connectToDb();

    // Check if user already exists (case-insensitive match)
    const existingUser = await db
      .collection("users")
      .findOne({ email: { $regex: `^${email}$`, $options: "i" } });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  }  catch (error: unknown) {
    if (error instanceof Error) {
      console.error("User registration error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  
    // Fallback for non-Error objects
    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}