import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "pamir-connect-jwt-secret-2026";
const SALT_ROUNDS = 10;

function makeToken(profileId: string) {
  return jwt.sign({ sub: profileId }, JWT_SECRET, { expiresIn: "30d" });
}

function sanitize(p: typeof profilesTable.$inferSelect) {
  const { passwordHash, ...rest } = p;
  return rest;
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, institution, city, bio } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password and name are required" });
    }
    const existing = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      return res.status(409).json({ error: "Этот email уже зарегистрирован" });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [profile] = await db
      .insert(profilesTable)
      .values({ email: email.toLowerCase().trim(), passwordHash, name: name.trim(), institution, city, bio })
      .returning();
    const token = makeToken(profile.id);
    res.status(201).json({ token, user: sanitize(profile) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase().trim()));
    if (!profile || !profile.passwordHash) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const valid = await bcrypt.compare(password, profile.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const token = makeToken(profile.id);
    res.json({ token, user: sanitize(profile) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, payload.sub));
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json(sanitize(profile));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
