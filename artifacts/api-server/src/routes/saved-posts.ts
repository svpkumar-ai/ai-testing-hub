import { Router, type IRouter, type Request, type Response } from "express";
import { db, savedPostsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SavePostBody, RemoveSavedPostParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user || req.user.isGuest) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/saved-posts", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const posts = await db
    .select()
    .from(savedPostsTable)
    .where(eq(savedPostsTable.userId, req.user!.userId));

  res.json({ posts });
});

router.post("/saved-posts", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const parsed = SavePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const [post] = await db
    .insert(savedPostsTable)
    .values({
      userId: req.user!.userId,
      articleUrl: parsed.data.articleUrl,
      articleTitle: parsed.data.articleTitle,
      articleSource: parsed.data.articleSource,
      articleDate: parsed.data.articleDate,
      articleDescription: parsed.data.articleDescription,
    })
    .returning();

  res.json(post);
});

router.delete("/saved-posts/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const parsed = RemoveSavedPostParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  await db
    .delete(savedPostsTable)
    .where(
      and(
        eq(savedPostsTable.id, parsed.data.id),
        eq(savedPostsTable.userId, req.user!.userId)
      )
    );

  res.json({ message: "Post removed" });
});

export default router;
