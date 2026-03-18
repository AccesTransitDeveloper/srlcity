import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { postsTable, commentsTable, likesTable, profilesTable } from "@workspace/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

const router: IRouter = Router();

async function enrichPost(post: typeof postsTable.$inferSelect, userId?: string) {
  const [author] = await db.select().from(profilesTable).where(eq(profilesTable.id, post.authorId));
  const likesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(likesTable)
    .where(eq(likesTable.postId, post.id));
  const liked = userId
    ? (await db.select().from(likesTable).where(and(eq(likesTable.postId, post.id), eq(likesTable.userId, userId)))).length > 0
    : false;
  const comments = await db.select().from(commentsTable).where(eq(commentsTable.postId, post.id)).orderBy(commentsTable.createdAt);
  const enrichedComments = await Promise.all(
    comments.map(async (c) => {
      const [commentAuthor] = await db.select().from(profilesTable).where(eq(profilesTable.id, c.authorId));
      return { id: c.id, author: commentAuthor || null, text: c.text, createdAt: c.createdAt };
    })
  );
  return {
    id: post.id,
    author: author || null,
    content: post.content,
    imageUrl: post.imageUrl,
    groupId: post.groupId,
    likes: Number(likesCount[0]?.count ?? 0),
    liked,
    comments: enrichedComments,
    createdAt: post.createdAt,
  };
}

router.get("/posts", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const userId = req.query.userId as string | undefined;
    const groupId = req.query.groupId as string | undefined;

    let query = db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(limit).offset(offset);
    const posts = await query;
    const enriched = await Promise.all(posts.map((p) => enrichPost(p, userId)));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/posts", async (req, res) => {
  try {
    const { authorId, content, imageUrl, groupId } = req.body;
    if (!authorId || !content) return res.status(400).json({ error: "authorId and content are required" });
    const [post] = await db.insert(postsTable).values({ authorId, content, imageUrl, groupId }).returning();
    const enriched = await enrichPost(post, authorId);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/posts/:id", async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, req.params.id));
    if (!post) return res.status(404).json({ error: "Post not found" });
    const enriched = await enrichPost(post, userId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/posts/:id", async (req, res) => {
  try {
    await db.delete(postsTable).where(eq(postsTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/posts/:id/likes", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.insert(likesTable).values({ postId: req.params.id, userId }).onConflictDoNothing();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(likesTable)
      .where(eq(likesTable.postId, req.params.id));
    res.json({ likes: Number(count), liked: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/posts/:id/likes", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    await db.delete(likesTable).where(and(eq(likesTable.postId, req.params.id), eq(likesTable.userId, userId)));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(likesTable)
      .where(eq(likesTable.postId, req.params.id));
    res.json({ likes: Number(count), liked: false });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/posts/:id/comments", async (req, res) => {
  try {
    const comments = await db.select().from(commentsTable).where(eq(commentsTable.postId, req.params.id)).orderBy(commentsTable.createdAt);
    const enriched = await Promise.all(
      comments.map(async (c) => {
        const [author] = await db.select().from(profilesTable).where(eq(profilesTable.id, c.authorId));
        return { id: c.id, author: author || null, text: c.text, createdAt: c.createdAt };
      })
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/posts/:id/comments", async (req, res) => {
  try {
    const { authorId, text } = req.body;
    if (!authorId || !text) return res.status(400).json({ error: "authorId and text are required" });
    const [comment] = await db.insert(commentsTable).values({ postId: req.params.id, authorId, text }).returning();
    const [author] = await db.select().from(profilesTable).where(eq(profilesTable.id, authorId));
    res.status(201).json({ id: comment.id, author: author || null, text: comment.text, createdAt: comment.createdAt });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
