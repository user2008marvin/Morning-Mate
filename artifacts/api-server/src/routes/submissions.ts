import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { submissionsTable } from "@workspace/db/schema";
import { CreateSubmissionBody } from "@workspace/api-zod";
import { eq, gte, sql, desc, count } from "drizzle-orm";

const router: IRouter = Router();

router.post("/submissions", async (req, res) => {
  const parsed = CreateSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { occasion, look, firstName, email, imageDataUrl } = parsed.data;

  const [submission] = await db.insert(submissionsTable).values({
    occasion,
    look,
    firstName: firstName ?? null,
    email: email ?? null,
    imageDataUrl: imageDataUrl ?? null,
  }).returning();

  res.status(201).json(submission);
});

router.get("/admin/submissions", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;

  const [submissions, totalResult] = await Promise.all([
    db.select().from(submissionsTable)
      .orderBy(desc(submissionsTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(submissionsTable),
  ]);

  res.json({
    submissions,
    total: Number(totalResult[0]?.count ?? 0),
    page,
    pageSize,
  });
});

router.get("/admin/stats", async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const [totalResult, todayResult, weekResult, byOccasion, byLook, withEmailResult] = await Promise.all([
    db.select({ count: count() }).from(submissionsTable),
    db.select({ count: count() }).from(submissionsTable).where(gte(submissionsTable.createdAt, todayStart)),
    db.select({ count: count() }).from(submissionsTable).where(gte(submissionsTable.createdAt, weekStart)),
    db.select({
      occasion: submissionsTable.occasion,
      count: count(),
    }).from(submissionsTable).groupBy(submissionsTable.occasion).orderBy(desc(count())),
    db.select({
      look: submissionsTable.look,
      count: count(),
    }).from(submissionsTable).groupBy(submissionsTable.look).orderBy(desc(count())),
    db.select({ count: count() }).from(submissionsTable).where(sql`${submissionsTable.email} IS NOT NULL`),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const withEmail = Number(withEmailResult[0]?.count ?? 0);

  res.json({
    totalSubmissions: total,
    submissionsToday: Number(todayResult[0]?.count ?? 0),
    submissionsThisWeek: Number(weekResult[0]?.count ?? 0),
    byOccasion: byOccasion.map(r => ({ occasion: r.occasion, count: Number(r.count) })),
    byLook: byLook.map(r => ({ look: r.look, count: Number(r.count) })),
    emailCaptureRate: total > 0 ? withEmail / total : 0,
  });
});

export default router;
