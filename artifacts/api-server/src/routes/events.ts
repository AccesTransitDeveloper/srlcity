import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { eventsTable, eventParticipantsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichEvent(event: typeof eventsTable.$inferSelect, userId?: string) {
  const participating = userId
    ? (await db.select().from(eventParticipantsTable).where(and(eq(eventParticipantsTable.eventId, event.id), eq(eventParticipantsTable.userId, userId)))).length > 0
    : false;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    coverUrl: event.coverUrl,
    participantCount: event.participantCount,
    participating,
    createdBy: event.createdBy,
    createdAt: event.createdAt,
  };
}

router.get("/events", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const userId = req.query.userId as string | undefined;
    const events = await db.select().from(eventsTable).limit(limit).offset(offset);
    const enriched = await Promise.all(events.map((e) => enrichEvent(e, userId)));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/events", async (req, res) => {
  try {
    const { title, description, date, location, coverUrl, createdBy } = req.body;
    if (!title || !date) return res.status(400).json({ error: "title and date are required" });
    const [event] = await db.insert(eventsTable).values({ title, description, date, location, coverUrl, createdBy }).returning();
    if (createdBy) {
      await db.insert(eventParticipantsTable).values({ eventId: event.id, userId: createdBy }).onConflictDoNothing();
      await db.update(eventsTable).set({ participantCount: 1 }).where(eq(eventsTable.id, event.id));
    }
    const enriched = await enrichEvent(event, createdBy);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, req.params.id));
    if (!event) return res.status(404).json({ error: "Event not found" });
    const enriched = await enrichEvent(event, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/events/:id/participate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.insert(eventParticipantsTable).values({ eventId: req.params.id, userId }).onConflictDoNothing();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventParticipantsTable)
      .where(eq(eventParticipantsTable.eventId, req.params.id));
    const [event] = await db
      .update(eventsTable)
      .set({ participantCount: Number(count) })
      .where(eq(eventsTable.id, req.params.id))
      .returning();
    if (!event) return res.status(404).json({ error: "Event not found" });
    const enriched = await enrichEvent(event, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/events/:id/participate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.delete(eventParticipantsTable).where(and(eq(eventParticipantsTable.eventId, req.params.id), eq(eventParticipantsTable.userId, userId)));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventParticipantsTable)
      .where(eq(eventParticipantsTable.eventId, req.params.id));
    const [event] = await db
      .update(eventsTable)
      .set({ participantCount: Number(count) })
      .where(eq(eventsTable.id, req.params.id))
      .returning();
    if (!event) return res.status(404).json({ error: "Event not found" });
    const enriched = await enrichEvent(event, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
