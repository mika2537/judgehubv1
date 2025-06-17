// lib/schemas/userSchema.ts
import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().length(24, "Invalid MongoDB ObjectId"),
  newRole: z.enum(["admin", "judge", "viewer"]),
});

export const deleteUserSchema = z.object({
  userId: z.string().length(24, "Invalid MongoDB ObjectId"),
});