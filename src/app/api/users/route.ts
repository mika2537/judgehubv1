import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ----------------------
// Validation Schemas
// ----------------------

const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateUserRoleSchema = z.object({
  userId: z.string().length(24, "Invalid userId"),
  newRole: z.enum(["admin", "judge", "viewer"]),
});

const deleteUserSchema = z.object({
  userId: z.string().length(24, "Invalid userId"),
});

// ----------------------
// Helper: Admin Check
// ----------------------

async function isAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return false;
  }
  return true;
}

// ----------------------
// POST: Create User
// ----------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "judgehub");

    const existingUser = await db
      .collection("users")
      .findOne({ email: { $regex: `^${email}$`, $options: "i" } });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      name,
      role: "viewer",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ----------------------
// GET: All Users (no password)
// ----------------------

export async function GET() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "judgehub");

    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ----------------------
// PATCH: Update User Role
// ----------------------

export async function PATCH(request: NextRequest) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { userId, newRole } = parsed.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "judgehub");

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: newRole } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/users error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ----------------------
// DELETE: Remove User
// ----------------------

export async function DELETE(request: NextRequest) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = deleteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { userId } = parsed.data;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "judgehub");

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}