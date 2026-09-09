import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable, profilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const notifications = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId));
    const enriched = await Promise.all(
      notifications.map(async (n) => {
        const [fromUser] = await db.select().from(profilesTable).where(eq(profilesTable.id, n.fromUserId));
        return { id: n.id, type: n.type, fromUser: fromUser || null, text: n.text, read: n.read, createdAt: n.createdAt };
      })
    );
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.patch("/notifications/:id/read", async (req, res) => {
  try {
    const [notification] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, req.params.id))
      .returning();
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    const [fromUser] = await db.select().from(profilesTable).where(eq(profilesTable.id, notification.fromUserId));
    return res.json({ id: notification.id, type: notification.type, fromUser: fromUser || null, text: notification.text, read: notification.read, createdAt: notification.createdAt });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
