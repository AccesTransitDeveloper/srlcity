import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { groupsTable, groupMembersTable, profilesTable } from "@workspace/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

async function enrichGroup(group: typeof groupsTable.$inferSelect, userId?: string) {
  const joined = userId
    ? (await db.select().from(groupMembersTable).where(and(eq(groupMembersTable.groupId, group.id), eq(groupMembersTable.userId, userId)))).length > 0
    : false;
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    coverUrl: group.coverUrl,
    memberCount: group.memberCount,
    joined,
    createdBy: group.createdBy,
    createdAt: group.createdAt,
  };
}

router.get("/groups", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
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
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/groups", async (req, res) => {
  try {
    const { name, description, coverUrl, createdBy } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const [group] = await db.insert(groupsTable).values({ name, description, coverUrl, createdBy }).returning();
    if (createdBy) {
      await db.insert(groupMembersTable).values({ groupId: group.id, userId: createdBy }).onConflictDoNothing();
      await db.update(groupsTable).set({ memberCount: 1 }).where(eq(groupsTable.id, group.id));
    }
    const enriched = await enrichGroup(group, createdBy);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/groups/:id", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, req.params.id));
    if (!group) return res.status(404).json({ error: "Group not found" });
    const enriched = await enrichGroup(group, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/groups/:id/join", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.insert(groupMembersTable).values({ groupId: req.params.id, userId }).onConflictDoNothing();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembersTable)
      .where(eq(groupMembersTable.groupId, req.params.id));
    const [group] = await db
      .update(groupsTable)
      .set({ memberCount: Number(count) })
      .where(eq(groupsTable.id, req.params.id))
      .returning();
    if (!group) return res.status(404).json({ error: "Group not found" });
    const enriched = await enrichGroup(group, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/groups/:id/join", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.delete(groupMembersTable).where(and(eq(groupMembersTable.groupId, req.params.id), eq(groupMembersTable.userId, userId)));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembersTable)
      .where(eq(groupMembersTable.groupId, req.params.id));
    const [group] = await db
      .update(groupsTable)
      .set({ memberCount: Number(count) })
      .where(eq(groupsTable.id, req.params.id))
      .returning();
    if (!group) return res.status(404).json({ error: "Group not found" });
    const enriched = await enrichGroup(group, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
