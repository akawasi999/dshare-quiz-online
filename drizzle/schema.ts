import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const accountTierValues = ["basic", "pro", "premium"] as const;
export const quizModeValues = ["training", "testing"] as const;
export const questionTypeValues = ["single", "multiple", "true_false", "fill_blank", "image", "matching"] as const;
export const difficultyValues = ["easy", "medium", "hard"] as const;

export const learnerProfiles = mysqlTable("learnerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", accountTierValues).default("basic").notNull(),
  pointBalance: int("pointBalance").default(0).notNull(),
  referralCode: varchar("referralCode", { length: 20 }).notNull(),
  referredByCode: varchar("referredByCode", { length: 20 }),
  avatarUrl: varchar("avatarUrl", { length: 1024 }),
  bio: varchar("bio", { length: 500 }),
  notificationPreferences: json("notificationPreferences").$type<{ studyReminders: boolean; resultUpdates: boolean; platformUpdates: boolean }>(),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("learner_profiles_user_unique").on(table.userId),
  uniqueIndex("learner_profiles_referral_unique").on(table.referralCode),
]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  accent: varchar("accent", { length: 24 }).default("#C7A76C").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("categories_slug_unique").on(table.slug)]);

export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("subjects_slug_unique").on(table.slug),
  index("subjects_category_idx").on(table.categoryId),
]);

export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: int("subjectId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  summary: text("summary"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("lessons_slug_unique").on(table.slug),
  index("lessons_subject_idx").on(table.subjectId),
]);

export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  summary: text("summary"),
  mode: mysqlEnum("mode", quizModeValues).default("training").notNull(),
  difficulty: mysqlEnum("difficulty", difficultyValues).default("medium").notNull(),
  accessTier: mysqlEnum("accessTier", accountTierValues).default("basic").notNull(),
  durationSeconds: int("durationSeconds").default(900).notNull(),
  passingScore: int("passingScore").default(70).notNull(),
  entryPointCost: int("entryPointCost").default(0).notNull(),
  completionReward: int("completionReward").default(0).notNull(),
  questionCount: int("questionCount").default(0).notNull(),
  randomizeQuestions: boolean("randomizeQuestions").default(true).notNull(),
  randomizeOptions: boolean("randomizeOptions").default(true).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("quizzes_slug_unique").on(table.slug),
  index("quizzes_lesson_idx").on(table.lessonId),
  index("quizzes_publish_idx").on(table.isPublished),
]);

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  prompt: text("prompt").notNull(),
  type: mysqlEnum("type", questionTypeValues).default("single").notNull(),
  difficulty: mysqlEnum("difficulty", difficultyValues).default("medium").notNull(),
  explanation: text("explanation"),
  tags: json("tags").$type<string[]>().notNull(),
  answerConfig: json("answerConfig").$type<Record<string, unknown>>(),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("questions_lesson_idx").on(table.lessonId),
  index("questions_difficulty_idx").on(table.difficulty),
]);

export const questionOptions = mysqlTable("questionOptions", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  body: text("body").notNull(),
  isCorrect: boolean("isCorrect").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
}, table => [index("question_options_question_idx").on(table.questionId)]);

export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  questionId: int("questionId").notNull(),
  points: int("points").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
}, table => [
  uniqueIndex("quiz_question_unique").on(table.quizId, table.questionId),
  index("quiz_questions_quiz_idx").on(table.quizId),
]);

export const attempts = mysqlTable("attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  quizId: int("quizId").notNull(),
  mode: mysqlEnum("mode", quizModeValues).notNull(),
  status: mysqlEnum("status", ["in_progress", "submitted", "expired"]).default("in_progress").notNull(),
  questionOrder: json("questionOrder").$type<number[]>().notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  score: int("score").default(0).notNull(),
  correctCount: int("correctCount").default(0).notNull(),
  totalQuestions: int("totalQuestions").default(0).notNull(),
  passed: boolean("passed").default(false).notNull(),
  violationCount: int("violationCount").default(0).notNull(),
}, table => [
  index("attempts_user_idx").on(table.userId),
  index("attempts_quiz_idx").on(table.quizId),
  index("attempts_status_idx").on(table.status),
]);

export const attemptAnswers = mysqlTable("attemptAnswers", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  questionId: int("questionId").notNull(),
  selectedOptionIds: json("selectedOptionIds").$type<number[]>().notNull(),
  isCorrect: boolean("isCorrect").default(false).notNull(),
  savedAt: timestamp("savedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("attempt_answer_unique").on(table.attemptId, table.questionId),
  index("attempt_answers_attempt_idx").on(table.attemptId),
]);

export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["top_up", "quiz_fee", "quiz_reward", "referral_reward", "report_reward", "admin_adjustment", "plan_upgrade"]).notNull(),
  amount: int("amount").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  referenceType: varchar("referenceType", { length: 60 }),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("wallet_transactions_user_idx").on(table.userId)]);

export const paymentRecords = mysqlTable("paymentRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  itemType: mysqlEnum("itemType", ["points", "membership"]).notNull(),
  itemCode: varchar("itemCode", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("payment_records_intent_unique").on(table.stripePaymentIntentId),
  index("payment_records_user_idx").on(table.userId),
]);

export const bugReports = mysqlTable("bugReports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  attemptId: int("attemptId"),
  details: text("details").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  moderatorNote: text("moderatorNote"),
  rewardPoints: int("rewardPoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
}, table => [
  index("bug_reports_status_idx").on(table.status),
  index("bug_reports_question_idx").on(table.questionId),
]);

export const discussionPosts = mysqlTable("discussionPosts", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["visible", "hidden"]).default("visible").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("discussion_posts_quiz_idx").on(table.quizId)]);

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("audit_logs_actor_idx").on(table.actorUserId)]);

export const attemptSecurityEvents = mysqlTable("attemptSecurityEvents", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  eventType: mysqlEnum("eventType", ["copy", "paste", "context_menu", "tab_hidden", "fullscreen_exit"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => [index("attempt_security_events_attempt_idx").on(table.attemptId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
