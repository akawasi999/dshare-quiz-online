import {
  bigint,
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

export const brandSettings = mysqlTable("brandSettings", {
  id: int("id").autoincrement().primaryKey(),
  primaryColor: varchar("primaryColor", { length: 16 }).default("#065BE5").notNull(),
  accentColor: varchar("accentColor", { length: 16 }).default("#3762D2").notNull(),
  successColor: varchar("successColor", { length: 16 }).default("#007453").notNull(),
  attentionColor: varchar("attentionColor", { length: 16 }).default("#DE1264").notNull(),
  pageColor: varchar("pageColor", { length: 16 }).default("#EBF4FF").notNull(),
  surfaceColor: varchar("surfaceColor", { length: 16 }).default("#FFFFFF").notNull(),
  questionTabContentWidth: int("questionTabContentWidth").default(1440).notNull(),
  settingsTabContentWidth: int("settingsTabContentWidth").default(1040).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailDeliverySettings = mysqlTable("emailDeliverySettings", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 40 }).default("resend").notNull(),
  apiKeyCiphertext: text("apiKeyCiphertext"),
  fromEmail: varchar("fromEmail", { length: 320 }),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const accountTierValues = ["basic", "pro", "premium"] as const;
export const paymentStatusValues = ["pending", "paid", "cancelled", "failed", "expired"] as const;
export const quizModeValues = ["training", "testing"] as const;
export const questionTypeValues = ["single", "multiple", "true_false", "true_false_statements", "fill_blank", "image", "matching", "essay"] as const;
export const difficultyValues = ["easy", "medium", "hard"] as const;
export const topicStatusValues = ["active", "archived"] as const;
export const quizLifecycleStatusValues = ["draft", "pending_review", "rejected", "published", "locked", "archived"] as const;
export const xpRuleStatusValues = ["draft", "active", "paused", "archived"] as const;

export const learnerProfiles = mysqlTable("learnerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", accountTierValues).default("basic").notNull(),
  pointBalance: int("pointBalance").default(0).notNull(),
  referralCode: varchar("referralCode", { length: 20 }).notNull(),
  referredByCode: varchar("referredByCode", { length: 20 }),
  avatarUrl: varchar("avatarUrl", { length: 1024 }),
  bio: varchar("bio", { length: 500 }),
  learningGoal: varchar("learningGoal", { length: 220 }),
  notificationPreferences: json("notificationPreferences").$type<{ studyReminders: boolean; resultUpdates: boolean; platformUpdates: boolean }>(),
  lastPracticeCategoryId: int("lastPracticeCategoryId"),
  tierExpiresAt: timestamp("tierExpiresAt"),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("learner_profiles_user_unique").on(table.userId),
  uniqueIndex("learner_profiles_referral_unique").on(table.referralCode),
]);

export const xpLevels = mysqlTable("xpLevels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  minXp: int("minXp").notNull(),
  icon: varchar("icon", { length: 80 }),
  rewardMetadata: json("rewardMetadata").$type<Record<string, unknown>>(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("xp_levels_min_xp_unique").on(table.minXp),
  index("xp_levels_active_order_idx").on(table.isActive, table.displayOrder),
]);

export const xpRules = mysqlTable("xpRules", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  trigger: varchar("trigger", { length: 100 }).notNull(),
  conditionConfig: json("conditionConfig").$type<Record<string, unknown>>(),
  xpAmount: int("xpAmount").notNull(),
  cooldownSeconds: int("cooldownSeconds").default(0).notNull(),
  dailyCap: int("dailyCap"),
  effectiveAt: timestamp("effectiveAt"),
  expiresAt: timestamp("expiresAt"),
  status: mysqlEnum("status", xpRuleStatusValues).default("draft").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("xp_rules_code_unique").on(table.code),
  index("xp_rules_status_trigger_idx").on(table.status, table.trigger),
]);

export const xpTransactions = mysqlTable("xpTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  sourceType: varchar("sourceType", { length: 80 }).notNull(),
  sourceId: varchar("sourceId", { length: 120 }),
  ruleId: int("ruleId"),
  reason: varchar("reason", { length: 500 }).notNull(),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("xp_transactions_user_created_idx").on(table.userId, table.createdAt),
  index("xp_transactions_rule_idx").on(table.ruleId),
  index("xp_transactions_source_idx").on(table.sourceType, table.sourceId),
]);

export const membershipGroupPermissions = mysqlTable("membershipGroupPermissions", {
  id: int("id").autoincrement().primaryKey(),
  tier: mysqlEnum("tier", accountTierValues).notNull(),
  canCreateQuiz: boolean("canCreateQuiz").default(true).notNull(),
  canUseAi: boolean("canUseAi").default(true).notNull(),
  canExportData: boolean("canExportData").default(false).notNull(),
  canViewAdvancedReports: boolean("canViewAdvancedReports").default(false).notNull(),
  canReceivePrioritySupport: boolean("canReceivePrioritySupport").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("membership_group_permissions_tier_unique").on(table.tier)]);

export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  tier: mysqlEnum("tier", accountTierValues).notNull(),
  description: varchar("description", { length: 500 }),
  benefits: json("benefits").$type<string[]>(),
  monthlyPrice: int("monthlyPrice").default(0).notNull(),
  promoPrice: int("promoPrice"),
  payosEnabled: boolean("payosEnabled").default(false).notNull(),
  payosRewardPoints: int("payosRewardPoints").default(0).notNull(),
  membershipMonths: int("membershipMonths").default(1).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("subscription_plans_code_unique").on(table.code)]);

export const userGroups = mysqlTable("userGroups", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId"),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 500 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_groups_name_unique").on(table.name), index("user_groups_plan_idx").on(table.planId)]);

export const userGroupPermissions = mysqlTable("userGroupPermissions", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  permissionKey: varchar("permissionKey", { length: 80 }).notNull(),
  isAllowed: boolean("isAllowed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_group_permissions_unique").on(table.groupId, table.permissionKey), index("user_group_permissions_group_idx").on(table.groupId)]);

export const userGroupMembers = mysqlTable("userGroupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_group_members_user_unique").on(table.userId), uniqueIndex("user_group_members_group_user_unique").on(table.groupId, table.userId), index("user_group_members_group_idx").on(table.groupId)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull(),
  description: text("description"),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
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

export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull(),
  parentId: int("parentId"),
  path: varchar("path", { length: 2000 }).notNull(),
  depth: int("depth").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", topicStatusValues).default("active").notNull(),
  allowQuizCreation: boolean("allowQuizCreation").default(true).notNull(),
  requireQuizModeration: boolean("requireQuizModeration").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  deletedAt: timestamp("deletedAt"),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("topics_slug_unique").on(table.slug),
  index("topics_parent_order_idx").on(table.parentId, table.sortOrder, table.name),
  index("topics_status_deleted_idx").on(table.status, table.deletedAt),
  index("topics_path_idx").on(table.path),
]);

export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId"),
  topicId: int("topicId"),
  creatorUserId: int("creatorUserId"),
  authorUserId: int("authorUserId"),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull(),
  summary: text("summary"),
  coverImageUrl: varchar("coverImageUrl", { length: 1024 }),
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
  visibility: mysqlEnum("visibility", ["public", "private"]).default("public").notNull(),
  creatorSettings: json("creatorSettings").$type<Record<string, unknown>>(),
  isPublished: boolean("isPublished").default(false).notNull(),
  status: mysqlEnum("status", quizLifecycleStatusValues).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewReason: text("reviewReason"),
  lockedAt: timestamp("lockedAt"),
  lockedByUserId: int("lockedByUserId"),
  lockedFromStatus: mysqlEnum("lockedFromStatus", quizLifecycleStatusValues),
  lockReason: varchar("lockReason", { length: 500 }),
  deletedAt: timestamp("deletedAt"),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("quizzes_slug_unique").on(table.slug),
  index("quizzes_lesson_idx").on(table.lessonId),
  index("quizzes_creator_idx").on(table.creatorUserId),
  index("quizzes_topic_status_idx").on(table.topicId, table.status, table.deletedAt),
  index("quizzes_author_active_idx").on(table.authorUserId, table.deletedAt),
  index("quizzes_published_active_idx").on(table.publishedAt, table.deletedAt),
  index("quizzes_publish_idx").on(table.isPublished),
  index("quizzes_visibility_idx").on(table.visibility),
]);

export const quizCreatorDrafts = mysqlTable("quizCreatorDrafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  draftKey: varchar("draftKey", { length: 96 }).notNull(),
  quizId: int("quizId"),
  title: varchar("title", { length: 220 }).notNull().default(""),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("quiz_creator_draft_user_key_unique").on(table.userId, table.draftKey),
  index("quiz_creator_draft_user_updated_idx").on(table.userId, table.updatedAt),
  index("quiz_creator_draft_quiz_idx").on(table.quizId),
]);

export const quizCreatorDraftVersions = mysqlTable("quizCreatorDraftVersions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  draftKey: varchar("draftKey", { length: 96 }).notNull(),
  title: varchar("title", { length: 220 }).notNull().default(""),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
}, table => [
  index("quiz_creator_draft_version_user_key_saved_idx").on(table.userId, table.draftKey, table.savedAt),
  index("quiz_creator_draft_version_user_key_pinned_idx").on(table.userId, table.draftKey, table.isPinned),
]);

export const quizSourceHistories = mysqlTable("quizSourceHistories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 2048 }).notNull(),
  sourceName: varchar("sourceName", { length: 220 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["youtube", "web"]).notNull(),
  sourceCharacterCount: int("sourceCharacterCount").default(0).notNull(),
  lastQuestionCount: int("lastQuestionCount").default(5).notNull(),
  lastDifficulty: mysqlEnum("lastDifficulty", difficultyValues).default("medium").notNull(),
  useCount: int("useCount").default(1).notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("quiz_source_history_user_url_unique").on(table.userId, table.sourceUrl),
  index("quiz_source_history_user_used_idx").on(table.userId, table.lastUsedAt),
]);

export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId"),
  topicId: int("topicId"),
  creatorUserId: int("creatorUserId"),
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
  index("questions_topic_idx").on(table.topicId),
  index("questions_creator_idx").on(table.creatorUserId),
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
  answerPayload: json("answerPayload").$type<Record<string, unknown> | null>(),
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

export const aiUsageEvents = mysqlTable("aiUsageEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["explain", "assist", "generate_question"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("ai_usage_events_user_created_idx").on(table.userId, table.createdAt),
]);

export const aiAssistantSettings = mysqlTable("aiAssistantSettings", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["manus", "gemini"]).default("manus").notNull(),
  model: varchar("model", { length: 120 }).default("gpt-5-mini").notNull(),
  apiKeyCiphertext: text("apiKeyCiphertext"),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  welcomeMessage: varchar("welcomeMessage", { length: 500 }).default("Chào bạn, tôi là Dshare AI Assistant. Tôi có thể giúp bạn lập kế hoạch ôn tập, giải thích khái niệm và gợi ý cách học hiệu quả.").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const aiAssistantConversations = mysqlTable("aiAssistantConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("ai_assistant_conversations_user_created_idx").on(table.userId, table.createdAt),
]);

export const paymentRecords = mysqlTable("paymentRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  itemType: mysqlEnum("itemType", ["points", "membership"]).notNull(),
  itemCode: varchar("itemCode", { length: 100 }).notNull(),
  payosOrderCode: bigint("payosOrderCode", { mode: "number" }),
  payosPaymentLinkId: varchar("payosPaymentLinkId", { length: 255 }),
  amount: int("amount"),
  currency: varchar("currency", { length: 8 }).default("VND").notNull(),
  status: mysqlEnum("status", paymentStatusValues).default("pending").notNull(),
  pointAmount: int("pointAmount"),
  targetTier: mysqlEnum("targetTier", accountTierValues),
  membershipMonths: int("membershipMonths"),
  description: varchar("description", { length: 500 }),
  webhookReference: varchar("webhookReference", { length: 255 }),
  webhookPayload: json("webhookPayload").$type<Record<string, unknown>>(),
  confirmationEmailSentAt: timestamp("confirmationEmailSentAt"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("payment_records_intent_unique").on(table.stripePaymentIntentId),
  uniqueIndex("payment_records_payos_order_unique").on(table.payosOrderCode),
  uniqueIndex("payment_records_payos_link_unique").on(table.payosPaymentLinkId),
  index("payment_records_user_idx").on(table.userId),
  index("payment_records_status_idx").on(table.status),
]);

export const paymentEmailDeliveries = mysqlTable("paymentEmailDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  paymentRecordId: int("paymentRecordId"),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  kind: mysqlEnum("kind", ["payment_confirmation", "test"]).notNull(),
  status: mysqlEnum("status", ["sent", "failed"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  errorMessage: varchar("errorMessage", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("payment_email_deliveries_payment_idx").on(table.paymentRecordId),
  index("payment_email_deliveries_created_idx").on(table.createdAt),
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
