import { and, asc, desc, eq, inArray, isNull, like, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { attempts, auditLogs, questionOptions, questions, quizQuestions, quizzes, topics, users } from "../drizzle/schema";
import { validateQuestionConfiguration } from "../shared/questionValidation";
import { getDb } from "./db";
import { createInAppNotification } from "./inAppNotifications";
import { adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { buildTopicPath, isTopicDescendantPath, normalizeCpanelLearningSlug, remapDescendantPath } from "./cpanelLearningUtils";

const topicStatusSchema = z.enum(["active", "archived"]);
const quizStatusSchema = z.enum(["draft", "pending_review", "rejected", "published", "locked", "archived"]);
const MAX_QUIZZES_PER_PAGE = 20;
const quizQuestionPayloadSchema = z.object({
  prompt: z.string().trim().min(8).max(5000),
  type: z.enum(["single", "multiple", "true_false", "true_false_statements", "fill_blank", "image", "matching", "ordering", "image_choice", "audio", "video", "hotspot", "short_answer_ai", "essay", "essay_ai"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  explanation: z.string().trim().max(5000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  answerConfig: z.record(z.string(), z.unknown()).optional(),
  imageUrl: z.string().url().max(1024).nullable().optional(),
  options: z.array(z.object({ body: z.string().trim().min(1).max(2000), isCorrect: z.boolean() })).max(12).default([]),
  points: z.number().int().min(0).max(1000).default(1),
});

function conflict(message: string) {
  return new TRPCError({ code: "CONFLICT", message });
}

function notFound(message: string) {
  return new TRPCError({ code: "NOT_FOUND", message });
}

export const cpanelLearningRouter = router({
  topics: router({
    tree: adminProcedure.input(z.object({ search: z.string().trim().max(160).optional(), status: z.enum(["active", "archived", "all"]).default("active") }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { items: [], refreshedAt: new Date() };
        const conditions = [isNull(topics.deletedAt)];
        if (input?.status && input.status !== "all") conditions.push(eq(topics.status, input.status));
        if (input?.search) conditions.push(like(topics.name, `%${input.search}%`));
        const rows = await db.select().from(topics).where(and(...conditions)).orderBy(asc(topics.sortOrder), asc(topics.name));
        const counts = rows.length ? await db.select({ topicId: quizzes.topicId, count: sql<number>`count(*)` }).from(quizzes).where(and(inArray(quizzes.topicId, rows.map(row => row.id)), isNull(quizzes.deletedAt))).groupBy(quizzes.topicId) : [];
        const quizCountByTopic = new Map(counts.map(row => [row.topicId, Number(row.count)]));
        const childCountByTopic = new Map<number, number>();
        for (const row of rows) if (row.parentId) childCountByTopic.set(row.parentId, (childCountByTopic.get(row.parentId) ?? 0) + 1);
        return { items: rows.map(row => ({ ...row, quizCount: quizCountByTopic.get(row.id) ?? 0, childCount: childCountByTopic.get(row.id) ?? 0 })), refreshedAt: new Date() };
      }),
    detail: adminProcedure.input(z.object({ topicId: z.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập Chủ đề." });
      const topic = (await db.select().from(topics).where(and(eq(topics.id, input.topicId), isNull(topics.deletedAt))).limit(1))[0];
      if (!topic) throw notFound("Không tìm thấy Chủ đề.");
      const [children, quizStat] = await Promise.all([
        db.select().from(topics).where(and(eq(topics.parentId, topic.id), isNull(topics.deletedAt))).orderBy(asc(topics.sortOrder), asc(topics.name)),
        db.select({ count: sql<number>`count(*)` }).from(quizzes).where(and(eq(quizzes.topicId, topic.id), isNull(quizzes.deletedAt))),
      ]);
      return { topic, children, quizCount: Number(quizStat[0]?.count ?? 0) };
    }),
    checkUrl: adminProcedure.input(z.object({ url: z.string().trim().max(180), excludeTopicId: z.number().int().positive().optional() }))
      .query(async ({ input }) => {
        const normalizedUrl = normalizeCpanelLearningSlug(input.url);
        if (!normalizedUrl) return { normalizedUrl, available: false };
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể kiểm tra URL Chủ đề." });
        const conditions = [eq(topics.slug, normalizedUrl)];
        if (input.excludeTopicId) conditions.push(ne(topics.id, input.excludeTopicId));
        const duplicate = await db.select({ id: topics.id }).from(topics).where(and(...conditions)).limit(1);
        return { normalizedUrl, available: !duplicate.length };
      }),
    create: adminProcedure.input(z.object({ name: z.string().trim().min(2).max(160), slug: z.string().trim().max(180).optional(), parentId: z.number().int().positive().nullable().optional(), status: topicStatusSchema.default("active"), allowQuizCreation: z.boolean().default(true), requireQuizModeration: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tạo Chủ đề." });
        const slug = input.slug?.trim() || normalizeCpanelLearningSlug(input.name);
        const existingSlug = await db.select({ id: topics.id }).from(topics).where(eq(topics.slug, slug)).limit(1);
        if (existingSlug.length) throw conflict("Slug Chủ đề đã tồn tại.");
        return db.transaction(async tx => {
          const parent = input.parentId ? (await tx.select().from(topics).where(and(eq(topics.id, input.parentId), isNull(topics.deletedAt))).limit(1))[0] : undefined;
          if (input.parentId && !parent) throw notFound("Không tìm thấy Chủ đề cha.");
          if (parent?.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Không thể tạo Chủ đề con trong nhánh đã archive." });
          const siblingFilter = parent ? eq(topics.parentId, parent.id) : isNull(topics.parentId);
          const orderRow = (await tx.select({ max: sql<number>`coalesce(max(${topics.sortOrder}), -1)` }).from(topics).where(and(siblingFilter, isNull(topics.deletedAt))))[0];
          const created = await tx.insert(topics).values({ name: input.name, slug, parentId: parent?.id ?? null, path: "/pending/", depth: parent ? parent.depth + 1 : 0, sortOrder: Number(orderRow?.max ?? -1) + 1, status: input.status, allowQuizCreation: input.allowQuizCreation, requireQuizModeration: input.requireQuizModeration, createdByUserId: ctx.user.id, updatedByUserId: ctx.user.id });
          const id = Number(created[0].insertId);
          const path = buildTopicPath(parent?.path ?? null, id);
          await tx.update(topics).set({ path }).where(eq(topics.id, id));
          await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "topic.created", entityType: "topic", entityId: id, metadata: { after: { name: input.name, slug, parentId: parent?.id ?? null, path, status: input.status, allowQuizCreation: input.allowQuizCreation, requireQuizModeration: input.requireQuizModeration } } });
          return { id, name: input.name, slug, parentId: parent?.id ?? null, path, depth: parent ? parent.depth + 1 : 0, status: input.status, allowQuizCreation: input.allowQuizCreation, requireQuizModeration: input.requireQuizModeration };
        });
      }),
    update: adminProcedure.input(z.object({ topicId: z.number().int().positive(), name: z.string().trim().min(2).max(160).optional(), slug: z.string().trim().max(180).optional(), parentId: z.number().int().positive().nullable().optional(), status: topicStatusSchema.optional(), allowQuizCreation: z.boolean().optional(), requireQuizModeration: z.boolean().optional(), version: z.number().int().positive(), reason: z.string().trim().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật Chủ đề." });
        return db.transaction(async tx => {
          const topic = (await tx.select().from(topics).where(and(eq(topics.id, input.topicId), isNull(topics.deletedAt))).limit(1))[0];
          if (!topic) throw notFound("Không tìm thấy Chủ đề.");
          if (topic.version !== input.version) throw conflict("Chủ đề đã được thay đổi bởi người khác. Vui lòng tải lại trước khi lưu.");
          const parentChanged = input.parentId !== undefined && input.parentId !== topic.parentId;
          let parent = input.parentId === undefined ? undefined : input.parentId ? (await tx.select().from(topics).where(and(eq(topics.id, input.parentId), isNull(topics.deletedAt))).limit(1))[0] : undefined;
          if (input.parentId && !parent) throw notFound("Không tìm thấy Chủ đề cha mới.");
          if (parent?.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Không thể di chuyển vào Chủ đề đã archive." });
          if (parent?.id === topic.id || (parent && isTopicDescendantPath(parent.path, topic.path))) throw conflict("Không thể chọn chính Chủ đề này hoặc một Chủ đề con làm cha.");
          const nextSlug = input.slug ?? topic.slug;
          if (nextSlug !== topic.slug) {
            const duplicate = await tx.select({ id: topics.id }).from(topics).where(and(eq(topics.slug, nextSlug), ne(topics.id, topic.id))).limit(1);
            if (duplicate.length) throw conflict("Slug Chủ đề đã tồn tại.");
          }
          const nextPath = parentChanged ? buildTopicPath(parent?.path ?? null, topic.id) : topic.path;
          const nextDepth = parentChanged ? (parent ? parent.depth + 1 : 0) : topic.depth;
          const before = { name: topic.name, slug: topic.slug, parentId: topic.parentId, path: topic.path, depth: topic.depth, status: topic.status, allowQuizCreation: topic.allowQuizCreation, requireQuizModeration: topic.requireQuizModeration, version: topic.version };
          await tx.update(topics).set({ name: input.name ?? topic.name, slug: nextSlug, parentId: parentChanged ? input.parentId ?? null : topic.parentId, path: nextPath, depth: nextDepth, status: input.status ?? topic.status, allowQuizCreation: input.allowQuizCreation ?? topic.allowQuizCreation, requireQuizModeration: input.requireQuizModeration ?? topic.requireQuizModeration, updatedByUserId: ctx.user.id, version: topic.version + 1 }).where(and(eq(topics.id, topic.id), eq(topics.version, input.version)));
          if (parentChanged) {
            const descendants = await tx.select().from(topics).where(and(like(topics.path, `${topic.path}%`), isNull(topics.deletedAt), ne(topics.id, topic.id)));
            for (const child of descendants) await tx.update(topics).set({ path: remapDescendantPath(child.path, topic.path, nextPath), depth: child.depth + (nextDepth - topic.depth), updatedByUserId: ctx.user.id }).where(eq(topics.id, child.id));
          }
          const after = { name: input.name ?? topic.name, slug: nextSlug, parentId: parentChanged ? input.parentId ?? null : topic.parentId, path: nextPath, depth: nextDepth, status: input.status ?? topic.status, allowQuizCreation: input.allowQuizCreation ?? topic.allowQuizCreation, requireQuizModeration: input.requireQuizModeration ?? topic.requireQuizModeration, version: topic.version + 1 };
          await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: parentChanged ? "topic.parent_changed" : "topic.updated", entityType: "topic", entityId: topic.id, metadata: { before, after, reason: input.reason ?? null } });
          return { id: topic.id, ...after };
        });
      }),
    bulkUpdateQuizPolicies: adminProcedure.input(z.object({ topicIds: z.array(z.number().int().positive()).min(1).max(100), allowQuizCreation: z.boolean(), requireQuizModeration: z.boolean(), reason: z.string().trim().min(3).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật chính sách Chủ đề." });
        const uniqueIds = Array.from(new Set(input.topicIds));
        return db.transaction(async tx => {
          const selected = await tx.select().from(topics).where(and(inArray(topics.id, uniqueIds), isNull(topics.deletedAt)));
          if (selected.length !== uniqueIds.length) throw notFound("Một hoặc nhiều Chủ đề đã không còn tồn tại.");
          for (const topic of selected) {
            const before = { allowQuizCreation: topic.allowQuizCreation, requireQuizModeration: topic.requireQuizModeration, version: topic.version };
            const after = { allowQuizCreation: input.allowQuizCreation, requireQuizModeration: input.requireQuizModeration, version: topic.version + 1 };
            await tx.update(topics).set({ allowQuizCreation: input.allowQuizCreation, requireQuizModeration: input.requireQuizModeration, updatedByUserId: ctx.user.id, version: topic.version + 1 }).where(and(eq(topics.id, topic.id), eq(topics.version, topic.version)));
            await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "topic.quiz_policies_bulk_updated", entityType: "topic", entityId: topic.id, metadata: { before, after, reason: input.reason, bulkSize: selected.length } });
          }
          return { affected: selected.length };
        });
      }),
    archive: adminProcedure.input(z.object({ topicId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể archive Chủ đề." });
      const topic = (await db.select().from(topics).where(and(eq(topics.id, input.topicId), isNull(topics.deletedAt))).limit(1))[0];
      if (!topic) throw notFound("Không tìm thấy Chủ đề.");
      if (topic.version !== input.version) throw conflict("Chủ đề đã được thay đổi bởi người khác.");
      await db.update(topics).set({ status: "archived", updatedByUserId: ctx.user.id, version: topic.version + 1 }).where(eq(topics.id, topic.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "topic.archived", entityType: "topic", entityId: topic.id, metadata: { before: { status: topic.status }, after: { status: "archived" }, reason: input.reason } });
      return { success: true };
    }),
    remove: adminProcedure.input(z.object({ topicId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xóa Chủ đề." });
      const topic = (await db.select().from(topics).where(and(eq(topics.id, input.topicId), isNull(topics.deletedAt))).limit(1))[0];
      if (!topic) throw notFound("Không tìm thấy Chủ đề.");
      if (topic.version !== input.version) throw conflict("Chủ đề đã được thay đổi bởi người khác.");
      const [childCount, quizCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(topics).where(and(eq(topics.parentId, topic.id), isNull(topics.deletedAt))),
        db.select({ count: sql<number>`count(*)` }).from(quizzes).where(and(eq(quizzes.topicId, topic.id), isNull(quizzes.deletedAt))),
      ]);
      if (Number(childCount[0]?.count ?? 0) > 0 || Number(quizCount[0]?.count ?? 0) > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Không thể xóa Chủ đề vì còn ${Number(childCount[0]?.count ?? 0)} Chủ đề con và ${Number(quizCount[0]?.count ?? 0)} Quiz liên kết.` });
      await db.update(topics).set({ deletedAt: new Date(), status: "archived", updatedByUserId: ctx.user.id, version: topic.version + 1 }).where(eq(topics.id, topic.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "topic.deleted", entityType: "topic", entityId: topic.id, metadata: { before: { status: topic.status }, after: { status: "archived", deleted: true }, reason: input.reason } });
      return { success: true };
    }),
  }),
  quizzes: router({
    list: adminProcedure.input(z.object({ page: z.number().int().min(1).default(1), search: z.string().trim().max(160).optional(), topicId: z.number().int().positive().optional(), status: z.enum(["all", "draft", "pending_review", "rejected", "published", "locked", "archived"]).default("all"), sort: z.enum(["title.asc", "title.desc", "createdAt.desc", "publishedAt.desc"]).default("title.asc") }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { items: [], pagination: { page: 1, pageSize: MAX_QUIZZES_PER_PAGE, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
        const page = input?.page ?? 1;
        const conditions = [isNull(quizzes.deletedAt)];
        if (input?.topicId) conditions.push(eq(quizzes.topicId, input.topicId));
        if (input?.status && input.status !== "all") conditions.push(eq(quizzes.status, input.status));
        if (input?.search) conditions.push(like(quizzes.title, `%${input.search}%`));
        const filter = and(...conditions);
        const totalRows = await db.select({ count: sql<number>`count(*)` }).from(quizzes).where(filter);
        const totalItems = Number(totalRows[0]?.count ?? 0);
        const listQuery = db.select().from(quizzes).where(filter);
        const rows = input?.sort === "title.desc" ? await listQuery.orderBy(desc(quizzes.title), desc(quizzes.publishedAt), asc(quizzes.id)).limit(MAX_QUIZZES_PER_PAGE).offset((page - 1) * MAX_QUIZZES_PER_PAGE)
          : input?.sort === "createdAt.desc" ? await listQuery.orderBy(desc(quizzes.createdAt), asc(quizzes.id)).limit(MAX_QUIZZES_PER_PAGE).offset((page - 1) * MAX_QUIZZES_PER_PAGE)
          : input?.sort === "publishedAt.desc" ? await listQuery.orderBy(desc(quizzes.publishedAt), asc(quizzes.id)).limit(MAX_QUIZZES_PER_PAGE).offset((page - 1) * MAX_QUIZZES_PER_PAGE)
          : await listQuery.orderBy(asc(quizzes.title), desc(quizzes.publishedAt), asc(quizzes.id)).limit(MAX_QUIZZES_PER_PAGE).offset((page - 1) * MAX_QUIZZES_PER_PAGE);
        const authorIds = Array.from(new Set(rows.map(row => row.authorUserId ?? row.creatorUserId).filter((id): id is number => id !== null)));
        const topicIds = Array.from(new Set(rows.map(row => row.topicId).filter((id): id is number => id !== null)));
        const quizIds = rows.map(row => row.id);
        const [authorRows, topicRows, questionRows] = await Promise.all([
          authorIds.length ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, authorIds)) : Promise.resolve([]),
          topicIds.length ? db.select({ id: topics.id, name: topics.name, path: topics.path }).from(topics).where(inArray(topics.id, topicIds)) : Promise.resolve([]),
          quizIds.length ? db.select({ quizId: quizQuestions.quizId, count: sql<number>`count(*)` }).from(quizQuestions).where(inArray(quizQuestions.quizId, quizIds)).groupBy(quizQuestions.quizId) : Promise.resolve([]),
        ]);
        const authors = new Map(authorRows.map(row => [row.id, row]));
        const topicMap = new Map(topicRows.map(row => [row.id, row]));
        const questionCount = new Map(questionRows.map(row => [row.quizId, Number(row.count)]));
        const totalPages = Math.ceil(totalItems / MAX_QUIZZES_PER_PAGE);
        return { items: rows.map(row => ({ ...row, questionCount: questionCount.get(row.id) ?? row.questionCount, author: authors.get(row.authorUserId ?? row.creatorUserId ?? -1) ?? null, topic: row.topicId ? topicMap.get(row.topicId) ?? null : null })), pagination: { page, pageSize: MAX_QUIZZES_PER_PAGE, totalItems, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }, sort: input?.sort ?? "title.asc", refreshedAt: new Date() };
      }),
    detail: adminProcedure.input(z.object({ quizId: z.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể truy cập Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      const [topic, author, linkedQuestions, attemptStat] = await Promise.all([
        quiz.topicId ? db.select({ id: topics.id, name: topics.name, path: topics.path, status: topics.status }).from(topics).where(eq(topics.id, quiz.topicId)).limit(1) : Promise.resolve([]),
        quiz.authorUserId || quiz.creatorUserId ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, quiz.authorUserId ?? quiz.creatorUserId!)).limit(1) : Promise.resolve([]),
        db.select({ link: quizQuestions, question: questions }).from(quizQuestions).innerJoin(questions, eq(quizQuestions.questionId, questions.id)).where(eq(quizQuestions.quizId, quiz.id)).orderBy(asc(quizQuestions.sortOrder)),
        db.select({ count: sql<number>`count(*)` }).from(attempts).where(eq(attempts.quizId, quiz.id)),
      ]);
      const optionRows = linkedQuestions.length ? await db.select().from(questionOptions).where(inArray(questionOptions.questionId, linkedQuestions.map(row => row.question.id))).orderBy(asc(questionOptions.sortOrder)) : [];
      return { quiz, topic: topic[0] ?? null, author: author[0] ?? null, questions: linkedQuestions.map(row => ({ ...row, options: optionRows.filter(option => option.questionId === row.question.id) })), attemptCount: Number(attemptStat[0]?.count ?? 0) };
    }),
    create: adminProcedure.input(z.object({ title: z.string().trim().min(4).max(220), topicId: z.number().int().positive().optional(), summary: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tạo Quiz." });
      let topicPolicy: typeof topics.$inferSelect | undefined;
      if (input.topicId) {
        topicPolicy = (await db.select().from(topics).where(and(eq(topics.id, input.topicId), eq(topics.status, "active"), isNull(topics.deletedAt))).limit(1))[0];
        if (!topicPolicy) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chủ đề đã chọn không tồn tại hoặc đã archive." });
        if (!topicPolicy.allowQuizCreation) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chủ đề đã chọn không cho phép tạo Quiz mới." });
      }
      const baseSlug = normalizeCpanelLearningSlug(input.title);
      const duplicate = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.slug, baseSlug)).limit(1);
      const slug = duplicate.length ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
      const initialStatus = topicPolicy?.requireQuizModeration ? "pending_review" as const : "draft" as const;
      const created = await db.insert(quizzes).values({ lessonId: null, topicId: input.topicId ?? null, creatorUserId: ctx.user.id, authorUserId: ctx.user.id, title: input.title, slug, summary: input.summary ?? null, status: initialStatus, isPublished: false, questionCount: 0 });
      const id = Number(created[0].insertId);
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: initialStatus === "pending_review" ? "quiz.created_pending_review" : "quiz.created", entityType: "quiz", entityId: id, metadata: { after: { title: input.title, topicId: input.topicId ?? null, status: initialStatus, requireQuizModeration: topicPolicy?.requireQuizModeration ?? false } } });
      return { id, slug, status: initialStatus };
    }),
    update: adminProcedure.input(z.object({ quizId: z.number().int().positive(), title: z.string().trim().min(4).max(220).optional(), topicId: z.number().int().positive().nullable().optional(), summary: z.string().trim().max(1000).nullable().optional(), version: z.number().int().positive(), reason: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác. Vui lòng tải lại trước khi lưu.");
      if (quiz.status === "locked" || quiz.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz đang khóa hoặc archive, không thể chỉnh sửa." });
      if (input.topicId) {
        const topic = (await db.select().from(topics).where(and(eq(topics.id, input.topicId), eq(topics.status, "active"), isNull(topics.deletedAt))).limit(1))[0];
        if (!topic) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Không thể gán Quiz vào Chủ đề đã archive." });
      }
      const before = { title: quiz.title, topicId: quiz.topicId, summary: quiz.summary, version: quiz.version };
      const next = { title: input.title ?? quiz.title, topicId: input.topicId === undefined ? quiz.topicId : input.topicId, summary: input.summary === undefined ? quiz.summary : input.summary, version: quiz.version + 1 };
      await db.update(quizzes).set({ title: next.title, topicId: next.topicId, summary: next.summary, version: next.version }).where(and(eq(quizzes.id, quiz.id), eq(quizzes.version, input.version)));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.updated", entityType: "quiz", entityId: quiz.id, metadata: { before, after: next, reason: input.reason ?? null } });
      return { id: quiz.id, ...next };
    }),
    publish: adminProcedure.input(z.object({ quizId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500), publishedAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể publish Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      if (!quiz.topicId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz cần thuộc một Chủ đề trước khi publish." });
      const topic = (await db.select().from(topics).where(and(eq(topics.id, quiz.topicId), eq(topics.status, "active"), isNull(topics.deletedAt))).limit(1))[0];
      if (!topic) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chủ đề của Quiz không còn hoạt động." });
      const links = await db.select({ question: questions }).from(quizQuestions).innerJoin(questions, eq(quizQuestions.questionId, questions.id)).where(eq(quizQuestions.quizId, quiz.id));
      if (!links.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz cần có ít nhất một câu hỏi hợp lệ trước khi publish." });
      const optionRows = await db.select().from(questionOptions).where(inArray(questionOptions.questionId, links.map(row => row.question.id)));
      const invalidQuestion = links.find(({ question }) => validateQuestionConfiguration({ type: question.type, options: optionRows.filter(option => option.questionId === question.id).map(option => ({ body: option.body, isCorrect: option.isCorrect })), answerConfig: question.answerConfig ?? undefined, imageUrl: question.imageUrl }) !== null);
      if (invalidQuestion) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Câu hỏi #${invalidQuestion.question.id} chưa có cấu hình đáp án hợp lệ.` });
      const publishedAt = input.publishedAt ?? new Date();
      const isReviewApproval = quiz.status === "pending_review";
      const reviewedAt = isReviewApproval ? new Date() : quiz.reviewedAt;
      await db.update(quizzes).set({ status: "published", isPublished: true, publishedAt, reviewedAt, reviewedByUserId: isReviewApproval ? ctx.user.id : quiz.reviewedByUserId, reviewReason: isReviewApproval ? null : quiz.reviewReason, version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: isReviewApproval ? "quiz.review_approved" : "quiz.published", entityType: "quiz", entityId: quiz.id, metadata: { before: { status: quiz.status, publishedAt: quiz.publishedAt }, after: { status: "published", publishedAt, reviewedAt }, reason: input.reason } });
      if (isReviewApproval && quiz.creatorUserId) await createInAppNotification(db, { userId: quiz.creatorUserId, type: "quiz_approved", title: "Quiz đã được phê duyệt", body: `Quiz “${quiz.title}” đã được quản trị viên duyệt và xuất bản.`, href: "/quiz-cua-toi?status=published", metadata: { quizId: quiz.id, status: "published" } });
      return { success: true, status: "published" as const, publishedAt, version: quiz.version + 1 };
    }),
    reviewReject: adminProcedure.input(z.object({ quizId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể từ chối Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      if (quiz.status !== "pending_review") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chỉ Quiz đang chờ duyệt mới có thể bị từ chối." });
      const reviewedAt = new Date();
      await db.update(quizzes).set({ status: "rejected", isPublished: false, reviewedAt, reviewedByUserId: ctx.user.id, reviewReason: input.reason, version: quiz.version + 1 }).where(and(eq(quizzes.id, quiz.id), eq(quizzes.version, input.version)));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.review_rejected", entityType: "quiz", entityId: quiz.id, metadata: { before: { status: quiz.status }, after: { status: "rejected", reviewedAt }, reason: input.reason } });
      if (quiz.creatorUserId) await createInAppNotification(db, { userId: quiz.creatorUserId, type: "quiz_rejected", title: "Quiz cần chỉnh sửa", body: `Quiz “${quiz.title}” chưa được duyệt. Lý do: ${input.reason}`, href: "/quiz-cua-toi?status=rejected", metadata: { quizId: quiz.id, status: "rejected", reason: input.reason } });
      return { success: true, status: "rejected" as const, reviewedAt, version: quiz.version + 1 };
    }),
    lock: adminProcedure.input(z.object({ quizId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể khóa Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      if (quiz.status === "locked") throw conflict("Quiz đã được khóa.");
      await db.update(quizzes).set({ status: "locked", lockedAt: new Date(), lockedByUserId: ctx.user.id, lockedFromStatus: quiz.status, lockReason: input.reason, isPublished: false, version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.locked", entityType: "quiz", entityId: quiz.id, metadata: { before: { status: quiz.status }, after: { status: "locked" }, reason: input.reason } });
      return { success: true, status: "locked" as const, version: quiz.version + 1 };
    }),
    unlock: adminProcedure.input(z.object({ quizId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở khóa Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      if (quiz.status !== "locked") throw conflict("Quiz không ở trạng thái khóa.");
      const nextStatus = quiz.lockedFromStatus === "published" ? "published" : quiz.lockedFromStatus === "pending_review" ? "pending_review" : quiz.lockedFromStatus === "rejected" ? "rejected" : "draft";
      await db.update(quizzes).set({ status: nextStatus, isPublished: nextStatus === "published", lockedAt: null, lockedByUserId: null, lockedFromStatus: null, lockReason: null, version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.unlocked", entityType: "quiz", entityId: quiz.id, metadata: { before: { status: "locked" }, after: { status: nextStatus }, reason: input.reason } });
      return { success: true, status: nextStatus, version: quiz.version + 1 };
    }),
    changeAuthor: adminProcedure.input(z.object({ quizId: z.number().int().positive(), authorUserId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể đổi tác giả Quiz." });
      const [quiz, author] = await Promise.all([
        db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1),
        db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, input.authorUserId)).limit(1),
      ]);
      const source = quiz[0];
      if (!source) throw notFound("Không tìm thấy Quiz.");
      if (!author[0]) throw notFound("Không tìm thấy tài khoản tác giả mới.");
      if (source.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      await db.update(quizzes).set({ authorUserId: input.authorUserId, version: source.version + 1 }).where(eq(quizzes.id, source.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.author_changed", entityType: "quiz", entityId: source.id, metadata: { before: { authorUserId: source.authorUserId ?? source.creatorUserId }, after: { authorUserId: input.authorUserId }, reason: input.reason } });
      return { success: true, author: author[0], version: source.version + 1 };
    }),
    changePublishDate: adminProcedure.input(z.object({ quizId: z.number().int().positive(), publishedAt: z.date(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể đổi ngày đăng Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      if (quiz.status !== "published") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Chỉ Quiz đã publish mới có thể đổi ngày đăng." });
      await db.update(quizzes).set({ publishedAt: input.publishedAt, version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.publish_date_changed", entityType: "quiz", entityId: quiz.id, metadata: { before: { publishedAt: quiz.publishedAt }, after: { publishedAt: input.publishedAt }, reason: input.reason } });
      return { success: true, publishedAt: input.publishedAt, version: quiz.version + 1 };
    }),
    archive: adminProcedure.input(z.object({ quizId: z.number().int().positive(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể archive Quiz." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.version !== input.version) throw conflict("Quiz đã được thay đổi bởi người khác.");
      await db.update(quizzes).set({ status: "archived", isPublished: false, deletedAt: new Date(), version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
      await db.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.deleted", entityType: "quiz", entityId: quiz.id, metadata: { before: { status: quiz.status }, after: { status: "archived", deleted: true }, reason: input.reason } });
      return { success: true };
    }),
    bulkStatus: adminProcedure.input(z.object({ quizIds: z.array(z.number().int().positive()).min(1).max(100).refine(values => new Set(values).size === values.length, "Danh sách Quiz bị trùng."), action: z.enum(["lock", "archive"]), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể thực hiện thao tác hàng loạt." });
      const rows = await db.select().from(quizzes).where(and(inArray(quizzes.id, input.quizIds), isNull(quizzes.deletedAt)));
      const selected = new Map(rows.map(row => [row.id, row]));
      const missingIds = input.quizIds.filter(id => !selected.has(id));
      const target = rows.filter(row => input.action === "lock" ? row.status !== "locked" && row.status !== "archived" : row.status !== "archived");
      if (!target.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Không có Quiz hợp lệ để thực hiện thao tác đã chọn." });
      await db.transaction(async tx => {
        for (const quiz of target) {
          if (input.action === "lock") await tx.update(quizzes).set({ status: "locked", lockedAt: new Date(), lockedByUserId: ctx.user.id, lockedFromStatus: quiz.status, lockReason: input.reason, isPublished: false, version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
          else await tx.update(quizzes).set({ status: "archived", isPublished: false, deletedAt: new Date(), version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
          await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: input.action === "lock" ? "quiz.bulk_locked" : "quiz.bulk_archived", entityType: "quiz", entityId: quiz.id, metadata: { before: { status: quiz.status }, after: { status: input.action === "lock" ? "locked" : "archived" }, reason: input.reason, batchSize: input.quizIds.length } });
        }
      });
      return { requested: input.quizIds.length, succeeded: target.length, excludedIds: [...missingIds, ...rows.filter(row => !target.some(item => item.id === row.id)).map(row => row.id)] };
    }),
  }),
  questions: router({
    create: adminProcedure.input(z.object({ quizId: z.number().int().positive(), question: quizQuestionPayloadSchema })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tạo câu hỏi." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.status === "locked" || quiz.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz đang khóa hoặc archive, không thể sửa câu hỏi." });
      const validationError = validateQuestionConfiguration({ type: input.question.type, options: input.question.options, answerConfig: input.question.answerConfig, imageUrl: input.question.imageUrl ?? undefined });
      if (validationError) throw new TRPCError({ code: "BAD_REQUEST", message: validationError });
      return db.transaction(async tx => {
        const last = (await tx.select({ max: sql<number>`coalesce(max(${quizQuestions.sortOrder}), -1)` }).from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)))[0];
        const createdQuestion = await tx.insert(questions).values({ lessonId: null, topicId: quiz.topicId, creatorUserId: ctx.user.id, prompt: input.question.prompt, type: input.question.type, difficulty: input.question.difficulty, explanation: input.question.explanation ?? null, tags: input.question.tags, answerConfig: input.question.answerConfig ?? null, imageUrl: input.question.imageUrl ?? null });
        const questionId = Number(createdQuestion[0].insertId);
        if (input.question.options.length) await tx.insert(questionOptions).values(input.question.options.map((option, sortOrder) => ({ questionId, body: option.body, isCorrect: option.isCorrect, sortOrder })));
        await tx.insert(quizQuestions).values({ quizId: quiz.id, questionId, points: input.question.points, sortOrder: Number(last?.max ?? -1) + 1 });
        const count = (await tx.select({ count: sql<number>`count(*)` }).from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id)))[0];
        await tx.update(quizzes).set({ questionCount: Number(count?.count ?? 0), version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
        await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.question_created", entityType: "quiz", entityId: quiz.id, metadata: { questionId, after: { type: input.question.type, points: input.question.points } } });
        return { questionId, quizVersion: quiz.version + 1 };
      });
    }),
    update: adminProcedure.input(z.object({ quizId: z.number().int().positive(), questionId: z.number().int().positive(), question: quizQuestionPayloadSchema, reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật câu hỏi." });
      const [quiz, linked] = await Promise.all([
        db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1),
        db.select({ link: quizQuestions, question: questions }).from(quizQuestions).innerJoin(questions, eq(quizQuestions.questionId, questions.id)).where(and(eq(quizQuestions.quizId, input.quizId), eq(quizQuestions.questionId, input.questionId))).limit(1),
      ]);
      const source = quiz[0];
      if (!source) throw notFound("Không tìm thấy Quiz.");
      if (!linked[0]) throw notFound("Câu hỏi không thuộc Quiz này.");
      if (source.status === "locked" || source.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz đang khóa hoặc archive, không thể sửa câu hỏi." });
      const validationError = validateQuestionConfiguration({ type: input.question.type, options: input.question.options, answerConfig: input.question.answerConfig, imageUrl: input.question.imageUrl ?? undefined });
      if (validationError) throw new TRPCError({ code: "BAD_REQUEST", message: validationError });
      await db.transaction(async tx => {
        await tx.update(questions).set({ topicId: source.topicId, prompt: input.question.prompt, type: input.question.type, difficulty: input.question.difficulty, explanation: input.question.explanation ?? null, tags: input.question.tags, answerConfig: input.question.answerConfig ?? null, imageUrl: input.question.imageUrl ?? null }).where(eq(questions.id, input.questionId));
        await tx.delete(questionOptions).where(eq(questionOptions.questionId, input.questionId));
        if (input.question.options.length) await tx.insert(questionOptions).values(input.question.options.map((option, sortOrder) => ({ questionId: input.questionId, body: option.body, isCorrect: option.isCorrect, sortOrder })));
        await tx.update(quizQuestions).set({ points: input.question.points }).where(and(eq(quizQuestions.quizId, input.quizId), eq(quizQuestions.questionId, input.questionId)));
        await tx.update(quizzes).set({ version: source.version + 1 }).where(eq(quizzes.id, source.id));
        await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.question_updated", entityType: "quiz", entityId: source.id, metadata: { questionId: input.questionId, reason: input.reason } });
      });
      return { success: true, quizVersion: source.version + 1 };
    }),
    remove: adminProcedure.input(z.object({ quizId: z.number().int().positive(), questionId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xóa câu hỏi." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.status === "locked" || quiz.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz đang khóa hoặc archive, không thể sửa câu hỏi." });
      const link = (await db.select().from(quizQuestions).where(and(eq(quizQuestions.quizId, input.quizId), eq(quizQuestions.questionId, input.questionId))).limit(1))[0];
      if (!link) throw notFound("Câu hỏi không thuộc Quiz này.");
      await db.transaction(async tx => {
        await tx.delete(quizQuestions).where(eq(quizQuestions.id, link.id));
        const remainingLinks = (await tx.select({ count: sql<number>`count(*)` }).from(quizQuestions).where(eq(quizQuestions.questionId, input.questionId)))[0];
        if (Number(remainingLinks?.count ?? 0) === 0) await tx.update(questions).set({ isActive: false }).where(eq(questions.id, input.questionId));
        const quizCount = (await tx.select({ count: sql<number>`count(*)` }).from(quizQuestions).where(eq(quizQuestions.quizId, input.quizId)))[0];
        await tx.update(quizzes).set({ questionCount: Number(quizCount?.count ?? 0), version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
        await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.question_removed", entityType: "quiz", entityId: quiz.id, metadata: { questionId: input.questionId, reason: input.reason } });
      });
      return { success: true, quizVersion: quiz.version + 1 };
    }),
    reorder: adminProcedure.input(z.object({ quizId: z.number().int().positive(), items: z.array(z.object({ questionId: z.number().int().positive(), sortOrder: z.number().int().min(0) })).min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể sắp xếp câu hỏi." });
      const quiz = (await db.select().from(quizzes).where(and(eq(quizzes.id, input.quizId), isNull(quizzes.deletedAt))).limit(1))[0];
      if (!quiz) throw notFound("Không tìm thấy Quiz.");
      if (quiz.status === "locked" || quiz.status === "archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quiz đang khóa hoặc archive, không thể sắp xếp." });
      const links = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
      const currentIds = new Set(links.map(link => link.questionId));
      if (input.items.length !== links.length || input.items.some(item => !currentIds.has(item.questionId))) throw new TRPCError({ code: "BAD_REQUEST", message: "Danh sách thứ tự câu hỏi không hợp lệ." });
      await db.transaction(async tx => {
        for (const item of input.items) await tx.update(quizQuestions).set({ sortOrder: item.sortOrder }).where(and(eq(quizQuestions.quizId, quiz.id), eq(quizQuestions.questionId, item.questionId)));
        await tx.update(quizzes).set({ version: quiz.version + 1 }).where(eq(quizzes.id, quiz.id));
        await tx.insert(auditLogs).values({ actorUserId: ctx.user.id, action: "quiz.questions_reordered", entityType: "quiz", entityId: quiz.id, metadata: { order: input.items } });
      });
      return { success: true, quizVersion: quiz.version + 1 };
    }),
  }),
});
