import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  groupsTable, groupMembersTable, groupJoinRequestsTable,
  chatThreadsTable, profilesTable,
} from "@workspace/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichGroup(group: typeof groupsTable.$inferSelect, userId?: string) {
  const joined = userId
    ? (await db.select().from(groupMembersTable).where(and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.userId, userId)))).length > 0
    : false;

  let pendingRequest = false;
  if (userId && !joined) {
    const req = await db.select().from(groupJoinRequestsTable).where(
      and(eq(groupJoinRequestsTable.groupId, group.id), eq(groupJoinRequestsTable.userId, userId), eq(groupJoinRequestsTable.status, "pending"))
    );
    pendingRequest = req.length > 0;
  }

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    coverUrl: group.coverUrl,
    memberCount: group.memberCount,
    joined,
    pendingRequest,
    isCreator: userId === group.createdBy,
    createdBy: group.createdBy,
    chatThreadId: group.chatThreadId,
    createdAt: group.createdAt,
  };
}

router.get("/groups", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    const userId = req.query.userId as string | undefined;
    const search = req.query.search as string | undefined;

    let groups;
    if (search) {
      groups = await db.select().from(groupsTable).where(ilike(groupsTable.name, `%${search}%`)).limit(limit).offset(offset);
    } else {
      groups = await db.select().from(groupsTable).limit(limit).offset(offset);
    }
    const enriched = await Promise.all(groups.map((g) => enrichGroup(g, userId)));
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/groups", async (req, res) => {
  try {
    const { name, description, coverUrl, createdBy } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!createdBy) return res.status(400).json({ error: "createdBy is required" });

    const [group] = await db.insert(groupsTable).values({ name, description, coverUrl, createdBy }).returning();

    await db.insert(groupMembersTable).values({ groupId: group.id, userId: createdBy }).onConflictDoNothing();
    await db.update(groupsTable).set({ memberCount: 1 }).where(eq(groupsTable.id, group.id));

    const [thread] = await db.insert(chatThreadsTable).values({ groupId: group.id, isGroup: true, lastMessage: `Чат группы «${name}»` }).returning();
    const [updated] = await db.update(groupsTable).set({ chatThreadId: thread.id }).where(eq(groupsTable.id, group.id)).returning();

    const enriched = await enrichGroup(updated, createdBy);
    return res.status(201).json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get("/groups/:id", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, req.params.id));
    if (!group) return res.status(404).json({ error: "Group not found" });
    const enriched = await enrichGroup(group, userId);
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/groups/:id/request", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, req.params.id));
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (group.createdBy === userId) {
      return res.status(400).json({ error: "Creator cannot request to join own group" });
    }

    const existing = await db.select().from(groupMembersTable).where(
      and(eq(groupMembersTable.groupId, req.params.id), eq(groupMembersTable.userId, userId))
    );
    if (existing.length > 0) return res.status(409).json({ error: "Already a member" });

    const pending = await db.select().from(groupJoinRequestsTable).where(
      and(eq(groupJoinRequestsTable.groupId, req.params.id), eq(groupJoinRequestsTable.userId, userId), eq(groupJoinRequestsTable.status, "pending"))
    );
    if (pending.length > 0) return res.status(409).json({ error: "Request already pending" });

    const [request] = await db.insert(groupJoinRequestsTable).values({ groupId: req.params.id, userId }).returning();
    const enriched = await enrichGroup(group, userId);
    return res.status(201).json({ ...enriched, request });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get("/groups/:id/requests", async (req, res) => {
  try {
    const requests = await db
      .select()
      .from(groupJoinRequestsTable)
      .where(and(eq(groupJoinRequestsTable.groupId, req.params.id), eq(groupJoinRequestsTable.status, "pending")));

    const enriched = await Promise.all(
      requests.map(async (r) => {
        const [user] = await db.select().from(profilesTable).where(eq(profilesTable.id, r.userId));
        const { passwordHash, ...safeUser } = user || ({} as any);
        return { ...r, user: safeUser };
      })
    );
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.patch("/groups/:id/requests/:requestId", async (req, res) => {
  try {
    const { action } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    const [request] = await db
      .update(groupJoinRequestsTable)
      .set({ status: action === "approve" ? "approved" : "rejected" })
      .where(eq(groupJoinRequestsTable.id, req.params.requestId))
      .returning();

    if (!request) return res.status(404).json({ error: "Request not found" });

    if (action === "approve") {
      await db.insert(groupMembersTable).values({ groupId: req.params.id, userId: request.userId }).onConflictDoNothing();
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(groupMembersTable).where(eq(groupMembersTable.groupId, req.params.id));
      await db.update(groupsTable).set({ memberCount: Number(count) }).where(eq(groupsTable.id, req.params.id));
    }

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.delete("/groups/:id/leave", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.delete(groupMembersTable).where(and(eq(groupMembersTable.groupId, req.params.id), eq(groupMembersTable.userId, userId)));
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(groupMembersTable).where(eq(groupMembersTable.groupId, req.params.id));
    const [group] = await db.update(groupsTable).set({ memberCount: Number(count) }).where(eq(groupsTable.id, req.params.id)).returning();
    if (!group) return res.status(404).json({ error: "Group not found" });
    const enriched = await enrichGroup(group, userId);
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
