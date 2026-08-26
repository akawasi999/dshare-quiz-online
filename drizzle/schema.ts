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

export const accountStatusValues = ["active", "suspended", "banned", "deactivated"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", accountStatusValues).default("active").notNull(),
  nameChangedAt: timestamp("nameChangedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userCredentials = mysqlTable("userCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  passwordHash: varchar("passwordHash", { length: 512 }).notNull(),
  resetTokenHash: varchar("resetTokenHash", { length: 128 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  loginLockedUntil: timestamp("loginLockedUntil"),
  passwordUpdatedAt: timestamp("passwordUpdatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_credentials_user_unique").on(table.userId), index("user_credentials_reset_token_idx").on(table.resetTokenHash)]);

export const userOAuthIdentities = mysqlTable("userOAuthIdentities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  providerSubject: varchar("providerSubject", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("oauth_identity_provider_subject_unique").on(table.provider, table.providerSubject), index("oauth_identity_user_idx").on(table.userId)]);

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
  styleConfig: json("styleConfig"),
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

export const oauthProviderSettings = mysqlTable("oauthProviderSettings", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(),
  clientId: varchar("clientId", { length: 320 }),
  clientSecretCiphertext: text("clientSecretCiphertext"),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("oauth_provider_settings_provider_unique").on(table.provider)]);

export const seoSettings = mysqlTable("seoSettings", {
  id: int("id").autoincrement().primaryKey(),
  googleAnalyticsMeasurementId: varchar("googleAnalyticsMeasurementId", { length: 32 }),
  googleSearchConsoleVerification: varchar("googleSearchConsoleVerification", { length: 255 }),
  defaultQuizCoverUrl: varchar("defaultQuizCoverUrl", { length: 1024 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  homePageUrl: varchar("homePageUrl", { length: 1024 }).default("https://dsharequiz-jxleeaps.manus.space").notNull(),
  boardTitle: varchar("boardTitle", { length: 180 }).default("Dshare Quiz Online").notNull(),
  metaDescription: varchar("metaDescription", { length: 320 }).default("Nền tảng tạo Quiz, học tập và chia sẻ kiến thức trực tuyến.").notNull(),
  defaultEmailAddress: varchar("defaultEmailAddress", { length: 320 }),
  termsContent: text("termsContent"),
  termsUpdatedAt: timestamp("termsUpdatedAt"),
  privacyContent: text("privacyContent"),
  privacyUpdatedAt: timestamp("privacyUpdatedAt"),
  supportTitle: varchar("supportTitle", { length: 180 }),
  supportDescription: text("supportDescription"),
  supportEmail: varchar("supportEmail", { length: 320 }),
  supportPhone: varchar("supportPhone", { length: 80 }),
  supportHours: varchar("supportHours", { length: 320 }),
  supportUpdatedAt: timestamp("supportUpdatedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteNavigationItems = mysqlTable("siteNavigationItems", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  position: int("position").default(0).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("site_navigation_position_idx").on(table.position, table.isEnabled)]);

export const supportFaqs = mysqlTable("supportFaqs", {
  id: int("id").autoincrement().primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  position: int("position").default(0).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("support_faq_position_idx").on(table.position, table.isEnabled)]);

export const contactMessageStatusValues = ["new", "read", "resolved"] as const;
export const supportMessages = mysqlTable("supportMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 320 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", contactMessageStatusValues).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("support_message_status_created_idx").on(table.status, table.createdAt)]);

export const accountTierValues = ["basic", "pro", "premium"] as const;
export const paymentStatusValues = ["pending", "paid", "cancelled", "failed", "expired"] as const;
export const quizModeValues = ["training", "testing"] as const;
export const questionTypeValues = ["single", "multiple", "true_false", "true_false_statements", "fill_blank", "image", "matching", "ordering", "image_choice", "essay"] as const;
export const difficultyValues = ["easy", "medium", "hard"] as const;
export const topicStatusValues = ["active", "archived"] as const;
export const quizLifecycleStatusValues = ["draft", "pending_review", "rejected", "published", "locked", "archived"] as const;
export const xpRuleStatusValues = ["draft", "active", "paused", "archived"] as const;
export const userNotificationTypeValues = ["account_plan", "account_permission", "quiz_approved", "quiz_rejected"] as const;
export const gamificationCelebrationTypeValues = ["level_up", "badge_awarded"] as const;
export const missionRepeatTypeValues = ["daily", "weekly", "special"] as const;
export const missionStatusValues = ["available", "completed", "claimed", "expired"] as const;
export const missionMetricTypeValues = ["quiz_completed", "questions_answered", "score_threshold", "study_minutes", "ai_content_created"] as const;
export const achievementStatusValues = ["locked", "unlocked"] as const;
export const featureCategoryValues = ["learning", "creation", "ai", "analytics", "premium"] as const;
export const walletTransactionTypeValues = ["top_up", "quiz_fee", "quiz_reward", "referral_reward", "report_reward", "admin_adjustment", "plan_upgrade", "ai_question_generation", "ai_quiz_generation", "premium_feature", "refund"] as const;

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
  contactEmail: varchar("contactEmail", { length: 320 }),
  birthDate: varchar("birthDate", { length: 10 }),
  address: varchar("address", { length: 500 }),
  countryCode: varchar("countryCode", { length: 2 }),
  province: varchar("province", { length: 120 }),
  pendingContactEmail: varchar("pendingContactEmail", { length: 320 }),
  contactEmailVerificationTokenHash: varchar("contactEmailVerificationTokenHash", { length: 128 }),
  contactEmailVerificationExpiresAt: timestamp("contactEmailVerificationExpiresAt"),
  notificationPreferences: json("notificationPreferences").$type<{ studyReminders: boolean; resultUpdates: boolean; platformUpdates: boolean }>(),
  lastPracticeCategoryId: int("lastPracticeCategoryId"),
  xpBalance: int("xpBalance").default(0).notNull(),
  currentLevelId: int("currentLevelId"),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastLearningAt: timestamp("lastLearningAt"),
  gamificationOnboardedAt: timestamp("gamificationOnboardedAt"),
  tierExpiresAt: timestamp("tierExpiresAt"),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("learner_profiles_user_unique").on(table.userId),
  uniqueIndex("learner_profiles_referral_unique").on(table.referralCode),
]);

/**
 * Tên miền trung tính dùng cho mã mới. Bảng MySQL giữ tên cũ trong giai đoạn
 * chuyển đổi để không làm gián đoạn dữ liệu, migration hoặc tích hợp đang dùng.
 */
export const accountProfiles = learnerProfiles;

export const userNotifications = mysqlTable("userNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", userNotificationTypeValues).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  href: varchar("href", { length: 512 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("user_notifications_user_unread_created_idx").on(table.userId, table.isRead, table.createdAt),
  index("user_notifications_user_created_idx").on(table.userId, table.createdAt),
]);

export const gamificationCelebrations = mysqlTable("gamificationCelebrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", gamificationCelebrationTypeValues).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: varchar("body", { length: 500 }).notNull(),
  xpAmount: int("xpAmount").default(0).notNull(),
  icon: varchar("icon", { length: 80 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  sourceKey: varchar("sourceKey", { length: 191 }).notNull(),
  seenAt: timestamp("seenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("gamification_celebration_source_unique").on(table.sourceKey),
  index("gamification_celebration_user_seen_created_idx").on(table.userId, table.seenAt, table.createdAt),
]);

export const xpLevels = mysqlTable("xpLevels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  minXp: int("minXp").notNull(),
  icon: varchar("icon", { length: 80 }),
  description: varchar("description", { length: 500 }),
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
  balanceAfter: int("balanceAfter").default(0).notNull(),
  dedupeKey: varchar("dedupeKey", { length: 191 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("xp_transactions_user_created_idx").on(table.userId, table.createdAt),
  index("xp_transactions_rule_idx").on(table.ruleId),
  index("xp_transactions_source_idx").on(table.sourceType, table.sourceId),
  uniqueIndex("xp_transactions_dedupe_unique").on(table.dedupeKey),
]);

export const gamificationFeatures = mysqlTable("gamificationFeatures", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 80 }),
  category: mysqlEnum("category", featureCategoryValues).default("learning").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("gamification_features_code_unique").on(table.code), index("gamification_features_active_category_idx").on(table.isActive, table.category)]);

export const levelFeatureUnlocks = mysqlTable("levelFeatureUnlocks", {
  id: int("id").autoincrement().primaryKey(),
  levelId: int("levelId").notNull(),
  featureId: int("featureId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("level_feature_unlock_unique").on(table.levelId, table.featureId), index("level_feature_unlock_feature_idx").on(table.featureId)]);

export const missionDefinitions = mysqlTable("missionDefinitions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 80 }),
  repeatType: mysqlEnum("repeatType", missionRepeatTypeValues).default("daily").notNull(),
  metricType: mysqlEnum("metricType", missionMetricTypeValues).notNull(),
  target: int("target").notNull(),
  xpReward: int("xpReward").notNull(),
  conditionConfig: json("conditionConfig").$type<Record<string, unknown>>(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("mission_definitions_code_unique").on(table.code), index("mission_definitions_active_repeat_idx").on(table.isActive, table.repeatType, table.displayOrder)]);

export const userMissionAssignments = mysqlTable("userMissionAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  missionDefinitionId: int("missionDefinitionId").notNull(),
  periodKey: varchar("periodKey", { length: 20 }).notNull(),
  target: int("target").notNull(),
  progress: int("progress").default(0).notNull(),
  xpReward: int("xpReward").notNull(),
  status: mysqlEnum("status", missionStatusValues).default("available").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_mission_period_unique").on(table.userId, table.missionDefinitionId, table.periodKey), index("user_missions_user_status_expiry_idx").on(table.userId, table.status, table.expiresAt)]);

export const streakRewardMilestones = mysqlTable("streakRewardMilestones", {
  id: int("id").autoincrement().primaryKey(),
  days: int("days").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  xpReward: int("xpReward").notNull(),
  badgeId: int("badgeId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("streak_reward_milestones_days_unique").on(table.days)]);

export const streakRewardClaims = mysqlTable("streakRewardClaims", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  milestoneId: int("milestoneId").notNull(),
  streakKey: varchar("streakKey", { length: 24 }).notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
}, table => [uniqueIndex("streak_reward_claim_unique").on(table.userId, table.milestoneId, table.streakKey), index("streak_reward_claim_user_idx").on(table.userId, table.claimedAt)]);

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 80 }).notNull(),
  color: varchar("color", { length: 16 }).default("#7C5CFC").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("badges_code_unique").on(table.code), index("badges_active_idx").on(table.isActive)]);

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 80 }).notNull(),
  conditionType: varchar("conditionType", { length: 80 }).notNull(),
  conditionConfig: json("conditionConfig").$type<Record<string, unknown>>(),
  xpReward: int("xpReward").default(0).notNull(),
  badgeId: int("badgeId"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("achievements_code_unique").on(table.code), index("achievements_active_order_idx").on(table.isActive, table.displayOrder)]);

export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  progress: int("progress").default(0).notNull(),
  target: int("target").default(1).notNull(),
  status: mysqlEnum("status", achievementStatusValues).default("locked").notNull(),
  unlockedAt: timestamp("unlockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_achievement_unique").on(table.userId, table.achievementId), index("user_achievement_user_status_idx").on(table.userId, table.status)]);

export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  sourceType: varchar("sourceType", { length: 80 }).notNull(),
  sourceId: varchar("sourceId", { length: 120 }),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
}, table => [uniqueIndex("user_badge_source_unique").on(table.userId, table.badgeId, table.sourceType, table.sourceId), index("user_badges_user_awarded_idx").on(table.userId, table.awardedAt)]);

export const pointPriceRules = mysqlTable("pointPriceRules", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: varchar("description", { length: 500 }),
  pointCost: int("pointCost").notNull(),
  conditionConfig: json("conditionConfig").$type<Record<string, unknown>>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("point_price_rules_code_unique").on(table.code), index("point_price_rules_active_idx").on(table.isActive)]);

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

export const permissionRegistry = mysqlTable("permissionRegistry", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 120 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: varchar("description", { length: 600 }),
  category: varchar("category", { length: 80 }).notNull(),
  type: mysqlEnum("type", ["boolean", "limit", "quota"]).default("boolean").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("permission_registry_key_unique").on(table.key), index("permission_registry_category_idx").on(table.category)]);

export const subscriptionPlanPermissions = mysqlTable("subscriptionPlanPermissions", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  permissionId: int("permissionId").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  limitValue: int("limitValue"),
  limitUnit: varchar("limitUnit", { length: 40 }),
  config: json("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("subscription_plan_permissions_unique").on(table.planId, table.permissionId), index("subscription_plan_permissions_plan_idx").on(table.planId)]);

export const userPermissionOverrides = mysqlTable("userPermissionOverrides", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permissionId: int("permissionId").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  limitValue: int("limitValue"),
  expiresAt: timestamp("expiresAt"),
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("user_permission_overrides_unique").on(table.userId, table.permissionId), index("user_permission_overrides_user_idx").on(table.userId)]);

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
  visibility: mysqlEnum("visibility", ["public", "unlisted", "private"]).default("public").notNull(),
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

export const quizStudioAiHistories = mysqlTable("quizStudioAiHistories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kind: mysqlEnum("kind", ["chat", "enhancement"]).notNull(),
  label: varchar("label", { length: 220 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("quiz_studio_ai_history_user_created_idx").on(table.userId, table.createdAt),
  index("quiz_studio_ai_history_user_kind_idx").on(table.userId, table.kind),
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
  type: mysqlEnum("type", walletTransactionTypeValues).notNull(),
  amount: int("amount").notNull(),
  balanceBefore: int("balanceBefore").default(0).notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  referenceType: varchar("referenceType", { length: 60 }),
  referenceId: int("referenceId"),
  dedupeKey: varchar("dedupeKey", { length: 191 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("wallet_transactions_user_idx").on(table.userId), uniqueIndex("wallet_transactions_dedupe_unique").on(table.dedupeKey)]);

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
export const routeErrorEvents = mysqlTable("routeErrorEvents", {
  id: int("id").autoincrement().primaryKey(),
  path: varchar("path", { length: 512 }).notNull(),
  referrerPath: varchar("referrerPath", { length: 512 }),
  userId: int("userId"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => [index("route_error_events_occurred_idx").on(table.occurredAt), index("route_error_events_path_idx").on(table.path)]);
export const attemptSecurityEvents = mysqlTable("attemptSecurityEvents", {
  id: int("id").autoincrement().primaryKey(),
  attemptId: int("attemptId").notNull(),
  eventType: mysqlEnum("eventType", ["copy", "paste", "context_menu", "tab_hidden", "fullscreen_exit"]).notNull(),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, table => [index("attempt_security_events_attempt_idx").on(table.attemptId)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
