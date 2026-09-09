import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { eventsTable, eventParticipantsTable, profilesTable } from "@workspace/db/schema";
import { eq, and, sql, ilike, desc, asc } from "drizzle-orm";
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

async function getCreator(createdBy: string | null) {
  if (!createdBy) return null;
  const [p] = await db.select({
    id: profilesTable.id,
    name: profilesTable.name,
    avatarUrl: profilesTable.avatarUrl,
    city: profilesTable.city,
  }).from(profilesTable).where(eq(profilesTable.id, createdBy));
  return p || null;
}

async function enrichEvent(event: typeof eventsTable.$inferSelect, userId?: string) {
  const [participatingRow, creator, participantsList] = await Promise.all([
    userId
      ? db.select().from(eventParticipantsTable)
          .where(and(eq(eventParticipantsTable.eventId, event.id), eq(eventParticipantsTable.userId, userId)))
      : Promise.resolve([]),
    getCreator(event.createdBy),
    db.select({ count: sql<number>`count(*)` })
      .from(eventParticipantsTable)
      .where(eq(eventParticipantsTable.eventId, event.id)),
  ]);

  const realCount = Number(participantsList[0]?.count || 0);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    location: event.location,
    coverUrl: event.coverUrl,
    participantCount: realCount,
    participating: participatingRow.length > 0,
    createdBy: event.createdBy,
    creator,
    createdAt: event.createdAt,
  };
}

router.get("/events", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const offset = Number(req.query.offset) || 0;
    const userId = req.query.userId as string | undefined;
    const search = req.query.search as string | undefined;
    const filter = (req.query.filter as string) || "upcoming";

    let query = db.select().from(eventsTable).$dynamic();

    if (search) {
      query = query.where(ilike(eventsTable.title, `%${search}%`));
    }

    const now = new Date().toISOString();
    if (filter === "upcoming") {
      query = query.where(sql`${eventsTable.date} >= ${now}`).orderBy(asc(eventsTable.date));
    } else if (filter === "past") {
      query = query.where(sql`${eventsTable.date} < ${now}`).orderBy(desc(eventsTable.date));
    } else {
      query = query.orderBy(desc(eventsTable.date));
    }

    const events = await query.limit(limit).offset(offset);
    const enriched = await Promise.all(events.map((e) => enrichEvent(e, userId)));
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/events", async (req, res) => {
  try {
    const authUserId = getUserFromReq(req);
    const { title, description, date, location, coverUrl, createdBy } = req.body;
    if (!title || !date) return res.status(400).json({ error: "Название и дата обязательны" });

    const ownerId = authUserId || createdBy;

    const [event] = await db.insert(eventsTable)
      .values({ title: title.trim(), description: description?.trim() || "", date, location: location?.trim() || "", coverUrl: coverUrl || null, createdBy: ownerId })
      .returning();

    if (ownerId) {
      await db.insert(eventParticipantsTable).values({ eventId: event.id, userId: ownerId }).onConflictDoNothing();
    }

    const enriched = await enrichEvent(event, ownerId);
    return res.status(201).json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, req.params.id));
    if (!event) return res.status(404).json({ error: "Событие не найдено" });
    const enriched = await enrichEvent(event, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const authUserId = getUserFromReq(req);
    const { userId } = req.body;
    const ownerId = authUserId || userId;
    if (!ownerId) return res.status(401).json({ error: "Требуется авторизация" });

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, req.params.id));
    if (!event) return res.status(404).json({ error: "Событие не найдено" });
    if (event.createdBy !== ownerId) return res.status(403).json({ error: "Нет прав для удаления" });

    await db.delete(eventsTable).where(eq(eventsTable.id, req.params.id));
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/events/:id/participate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId обязателен" });
    await db.insert(eventParticipantsTable).values({ eventId: req.params.id, userId }).onConflictDoNothing();
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, req.params.id));
    if (!event) return res.status(404).json({ error: "Событие не найдено" });
    const enriched = await enrichEvent(event, userId);
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.delete("/events/:id/participate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId обязателен" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, req.params.id));
    if (!event) return res.status(404).json({ error: "Событие не найдено" });
    if (event.createdBy === userId) return res.status(400).json({ error: "Создатель не может покинуть событие" });
    await db.delete(eventParticipantsTable).where(and(eq(eventParticipantsTable.eventId, req.params.id), eq(eventParticipantsTable.userId, userId)));
    const enriched = await enrichEvent(event, userId);
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
