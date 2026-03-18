import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatThreadsTable, messagesTable, profilesTable } from "@workspace/db/schema";
import { eq, or, and, sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichThread(thread: typeof chatThreadsTable.$inferSelect, currentUserId: string) {
  const otherId = thread.user1Id === currentUserId ? thread.user2Id : thread.user1Id;
  const [user] = await db.select().from(profilesTable).where(eq(profilesTable.id, otherId));
  const unread = await db
    .select({ count: sql<number>`count(*)` })
    .from(messagesTable)
    .where(and(eq(messagesTable.threadId, thread.id), eq(messagesTable.read, false)));
  return {
    id: thread.id,
    user: user || null,
    lastMessage: thread.lastMessage,
    lastMessageTime: thread.lastMessageTime,
    unread: Number(unread[0]?.count ?? 0),
    createdAt: thread.createdAt,
  };
}

router.get("/threads", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const threads = await db
      .select()
      .from(chatThreadsTable)
      .where(or(eq(chatThreadsTable.user1Id, userId), eq(chatThreadsTable.user2Id, userId)));
    const enriched = await Promise.all(threads.map((t) => enrichThread(t, userId)));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/threads", async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;
    if (!user1Id || !user2Id) return res.status(400).json({ error: "user1Id and user2Id are required" });
    const existing = await db
      .select()
      .from(chatThreadsTable)
      .where(
        or(
          and(eq(chatThreadsTable.user1Id, user1Id), eq(chatThreadsTable.user2Id, user2Id)),
          and(eq(chatThreadsTable.user1Id, user2Id), eq(chatThreadsTable.user2Id, user1Id))
        )
      );
    if (existing.length > 0) {
      const enriched = await enrichThread(existing[0], user1Id);
      return res.json(enriched);
    }
    const [thread] = await db.insert(chatThreadsTable).values({ user1Id, user2Id }).returning();
    const enriched = await enrichThread(thread, user1Id);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/threads/:id/messages", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.threadId, req.params.id))
      .limit(limit)
      .offset(offset);
    const enriched = await Promise.all(
      msgs.map(async (m) => {
        const [sender] = await db.select().from(profilesTable).where(eq(profilesTable.id, m.senderId));
        return { id: m.id, threadId: m.threadId, sender: sender || null, text: m.text, read: m.read, createdAt: m.createdAt };
      })
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/threads/:id/messages", async (req, res) => {
  try {
    const { senderId, text } = req.body;
    if (!senderId || !text) return res.status(400).json({ error: "senderId and text are required" });
    const [msg] = await db.insert(messagesTable).values({ threadId: req.params.id, senderId, text }).returning();
    await db
      .update(chatThreadsTable)
      .set({ lastMessage: text, lastMessageTime: new Date() })
      .where(eq(chatThreadsTable.id, req.params.id));
    const [sender] = await db.select().from(profilesTable).where(eq(profilesTable.id, senderId));
    res.status(201).json({ id: msg.id, threadId: msg.threadId, sender: sender || null, text: msg.text, read: msg.read, createdAt: msg.createdAt });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
