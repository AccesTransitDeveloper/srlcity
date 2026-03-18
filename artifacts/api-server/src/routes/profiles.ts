import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { eq, ilike } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profiles", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const profiles = await db.select().from(profilesTable).limit(limit).offset(offset);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/profiles", async (req, res) => {
  try {
    const { name, avatarUrl, institution, city, bio, badge } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const [profile] = await db.insert(profilesTable).values({ name, avatarUrl, institution, city, bio, badge }).returning();
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/profiles/:id", async (req, res) => {
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, req.params.id));
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/profiles/:id", async (req, res) => {
  try {
    const { name, avatarUrl, institution, city, bio, badge, rating } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (institution !== undefined) updates.institution = institution;
    if (city !== undefined) updates.city = city;
    if (bio !== undefined) updates.bio = bio;
    if (badge !== undefined) updates.badge = badge;
    if (rating !== undefined) updates.rating = rating;
    const [profile] = await db.update(profilesTable).set(updates).where(eq(profilesTable.id, req.params.id)).returning();
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
