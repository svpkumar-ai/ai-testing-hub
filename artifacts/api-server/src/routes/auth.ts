import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { JWT_SECRET } from "../app";

const router: IRouter = Router();

function signToken(userId: number, username: string, isGuest: boolean): string {
  return jwt.sign({ userId, username, isGuest }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ username, hashedPassword })
    .returning();

  const token = signToken(user.id, user.username, false);
  res.json({ user: { id: user.id, username: user.username, isGuest: false }, token });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const match = await bcrypt.compare(password, user.hashedPassword);
  if (!match) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = signToken(user.id, user.username, false);
  res.json({ user: { id: user.id, username: user.username, isGuest: false }, token });
});

router.post("/auth/guest", (_req, res) => {
  const token = signToken(-1, "Guest", true);
  res.json({ user: { id: -1, username: "Guest", isGuest: true }, token });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/reset-password", async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { username, newPassword } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(400).json({ error: "Username not found" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db
    .update(usersTable)
    .set({ hashedPassword })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password reset successfully" });
});

router.get("/auth/me", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      isGuest: req.user.isGuest,
    },
  });
});

export default router;
