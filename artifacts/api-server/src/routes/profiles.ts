import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  profilesTable,
  postsTable,
  eventParticipantsTable,
  groupMembersTable,
  ridesTable,
} from "@workspace/db/schema";
import { eq, ilike, desc, sql, ne } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "pamir-connect-jwt-secret-2026";

function getUserFromReq(req: any): string | null {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

function sanitize(p: typeof profilesTable.$inferSelect, isSelf = false) {
  const { passwordHash, email, phone, ...rest } = p;
  if (isSelf) {
    return { ...rest, email: email || null, phone: phone || null };
  }
  return rest;
}

router.get("/profiles", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search as string | undefined;

    let query = db.select().from(profilesTable).$dynamic();
    if (search) {
      query = query.where(ilike(profilesTable.name, `%${search}%`));
    }
    query = query.orderBy(desc(profilesTable.rating)).limit(limit).offset(offset);
    const profiles = await query;
    res.json(profiles.map(p => sanitize(p)));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/profiles/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const profiles = await db.select().from(profilesTable)
      .orderBy(desc(profilesTable.rating))
      .limit(limit);
    res.json(profiles.map(p => sanitize(p)));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/profiles/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    const [postCount, eventCount, groupCount, rideCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(postsTable).where(eq(postsTable.authorId, id)),
      db.select({ count: sql<number>`count(*)` }).from(eventParticipantsTable).where(eq(eventParticipantsTable.userId, id)),
      db.select({ count: sql<number>`count(*)` }).from(groupMembersTable).where(eq(groupMembersTable.userId, id)),
      db.select({ count: sql<number>`count(*)` }).from(ridesTable).where(eq(ridesTable.driverId, id)),
    ]);

    res.json({
      posts: Number(postCount[0]?.count || 0),
      events: Number(eventCount[0]?.count || 0),
      groups: Number(groupCount[0]?.count || 0),
      rides: Number(rideCount[0]?.count || 0),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/profiles/:id", async (req, res) => {
  try {
    const authUserId = getUserFromReq(req);
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, req.params.id));
    if (!profile) return res.status(404).json({ error: "Профиль не найден" });
    const isSelf = authUserId === profile.id;
    res.json(sanitize(profile, isSelf));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/profiles/:id", async (req, res) => {
  try {
    const authUserId = getUserFromReq(req);
    if (authUserId && authUserId !== req.params.id) {
      return res.status(403).json({ error: "Нельзя редактировать чужой профиль" });
    }

    const { name, avatarUrl, institution, city, bio, badge, rating } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl || null;
    if (institution !== undefined) updates.institution = institution;
    if (city !== undefined) updates.city = city;
    if (bio !== undefined) updates.bio = bio;
    if (badge !== undefined) updates.badge = badge;
    if (rating !== undefined) updates.rating = rating;

    const [profile] = await db.update(profilesTable).set(updates).where(eq(profilesTable.id, req.params.id)).returning();
    if (!profile) return res.status(404).json({ error: "Профиль не найден" });
    res.json(sanitize(profile, true));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
