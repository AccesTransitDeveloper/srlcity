import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatThreadsTable, messagesTable, profilesTable, groupsTable, groupMembersTable } from "@workspace/db/schema";
import { eq, or, and, sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichThread(thread: typeof chatThreadsTable.$inferSelect, currentUserId: string) {
  if (thread.isGroup && thread.groupId) {
    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, thread.groupId));
    const unread = await db
      .select({ count: sql<number>`count(*)` })
      .from(messagesTable)
      .where(and(eq(messagesTable.threadId, thread.id), eq(messagesTable.read, false)));
    return {
      id: thread.id,
      isGroup: true,
      group: group || null,
      user: null,
      lastMessage: thread.lastMessage,
      lastMessageTime: thread.lastMessageTime,
      unread: Number(unread[0]?.count ?? 0),
      createdAt: thread.createdAt,
    };
  }

  const otherId = thread.user1Id === currentUserId ? thread.user2Id : thread.user1Id;
  const [user] = otherId ? await db.select().from(profilesTable).where(eq(profilesTable.id, otherId)) : [null];
  const safeUser = user ? (() => { const { passwordHash, ...rest } = user; return rest; })() : null;
  const unread = await db
    .select({ count: sql<number>`count(*)` })
    .from(messagesTable)
    .where(and(eq(messagesTable.threadId, thread.id), eq(messagesTable.read, false)));
  return {
    id: thread.id,
    isGroup: false,
    group: null,
    user: safeUser,
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

    const directThreads = await db
      .select()
      .from(chatThreadsTable)
      .where(and(eq(chatThreadsTable.isGroup, false), or(eq(chatThreadsTable.user1Id, userId), eq(chatThreadsTable.user2Id, userId))));

    const memberGroups = await db.select().from(groupMembersTable).where(eq(groupMembersTable.userId, userId));
    const groupIds = memberGroups.map((m) => m.groupId);

    let groupThreads: typeof chatThreadsTable.$inferSelect[] = [];
    for (const groupId of groupIds) {
      const threads = await db.select().from(chatThreadsTable).where(and(eq(chatThreadsTable.isGroup, true), eq(chatThreadsTable.groupId, groupId)));
      groupThreads = [...groupThreads, ...threads];
    }

    const all = [...directThreads, ...groupThreads];
    const enriched = await Promise.all(all.map((t) => enrichThread(t, userId)));
    enriched.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
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
    const [thread] = await db.insert(chatThreadsTable).values({ user1Id, user2Id, isGroup: false }).returning();
    const enriched = await enrichThread(thread, user1Id);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/threads/:id/messages", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
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
        const { passwordHash, ...safeSender } = sender || ({} as any);
        return { id: m.id, threadId: m.threadId, sender: safeSender || null, text: m.text, mediaUrl: m.mediaUrl, mediaType: m.mediaType, read: m.read, createdAt: m.createdAt };
      })
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/threads/:id/messages", async (req, res) => {
  try {
    const { senderId, text, mediaUrl, mediaType } = req.body;
    if (!senderId) return res.status(400).json({ error: "senderId is required" });
    if (!text && !mediaUrl) return res.status(400).json({ error: "text or mediaUrl is required" });

    const [msg] = await db.insert(messagesTable).values({
      threadId: req.params.id,
      senderId,
      text: text || "",
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
    }).returning();

    const lastMessage = text || (mediaType === "video" ? "📹 Видео" : "📷 Фото");
    await db.update(chatThreadsTable).set({ lastMessage, lastMessageTime: new Date() }).where(eq(chatThreadsTable.id, req.params.id));

    const [sender] = await db.select().from(profilesTable).where(eq(profilesTable.id, senderId));
    const { passwordHash, ...safeSender } = sender || ({} as any);
    res.status(201).json({ id: msg.id, threadId: msg.threadId, sender: safeSender || null, text: msg.text, mediaUrl: msg.mediaUrl, mediaType: msg.mediaType, read: msg.read, createdAt: msg.createdAt });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
