import { and, asc, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import {
  achievements,
  attempts,
  badges,
  gamificationCelebrations,
  gamificationFeatures,
  learnerProfiles,
  levelFeatureUnlocks,
  missionDefinitions,
  streakRewardClaims,
  streakRewardMilestones,
  userAchievements,
  userBadges,
  userMissionAssignments,
  xpLevels,
  xpRules,
  xpTransactions,
} from "../drizzle/schema";

type DbExecutor = any;
type LevelRow = typeof xpLevels.$inferSelect;

export type GamificationAttemptInput = {
  userId: number;
  attemptId: number;
  quizId: number;
  quizTitle: string;
  scorePercent: number;
  passed: boolean;
  questionCount: number;
  completedAt?: Date;
};

export type XpRewardEvent = {
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string;
};

const DAY_MS = 86_400_000;

function utcDayStart(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function getGamificationDayKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function startOfUtcWeek(value = new Date()) {
  const start = utcDayStart(value);
  const offset = (start.getUTCDay() + 6) % 7;
  return new Date(start.getTime() - offset * DAY_MS);
}

export function getMissionPeriod(repeatType: "daily" | "weekly" | "special", missionId: number, now: Date, endsAt?: Date | null) {
  if (repeatType === "daily") {
    const start = utcDayStart(now);
    return { key: getGamificationDayKey(start), expiresAt: new Date(start.getTime() + DAY_MS) };
  }
  if (repeatType === "weekly") {
    const start = startOfUtcWeek(now);
    return { key: `${getGamificationDayKey(start)}-w`, expiresAt: new Date(start.getTime() + 7 * DAY_MS) };
  }
  return { key: `special-${missionId}`, expiresAt: endsAt && endsAt.getTime() > now.getTime() ? endsAt : new Date(Date.UTC(2100, 0, 1)) };
}

function configNumber(config: Record<string, unknown> | null, key: string, fallback: number) {
  const value = config?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function enqueueCelebration(db: DbExecutor, input: { userId: number; type: "level_up" | "badge_awarded"; title: string; body: string; xpAmount?: number; icon?: string | null; sourceKey: string; metadata?: Record<string, unknown> }) {
  try {
    await db.insert(gamificationCelebrations).values({ userId: input.userId, type: input.type, title: input.title, body: input.body, xpAmount: input.xpAmount ?? 0, icon: input.icon ?? null, sourceKey: input.sourceKey, metadata: input.metadata ?? null });
    return true;
  } catch (error) {
    const duplicate = await db.select({ id: gamificationCelebrations.id }).from(gamificationCelebrations).where(eq(gamificationCelebrations.sourceKey, input.sourceKey)).limit(1);
    if (duplicate[0]) return false;
    throw error;
  }
}

async function awardBadge(db: DbExecutor, input: { userId: number; badgeId: number; sourceType: string; sourceId: string; now: Date }) {
  const existing = await db.select({ id: userBadges.id }).from(userBadges).where(and(eq(userBadges.userId, input.userId), eq(userBadges.badgeId, input.badgeId), eq(userBadges.sourceType, input.sourceType), eq(userBadges.sourceId, input.sourceId))).limit(1);
  if (existing[0]) return null;
  try {
    await db.insert(userBadges).values({ userId: input.userId, badgeId: input.badgeId, sourceType: input.sourceType, sourceId: input.sourceId, awardedAt: input.now });
  } catch (error) {
    const duplicate = await db.select({ id: userBadges.id }).from(userBadges).where(and(eq(userBadges.userId, input.userId), eq(userBadges.badgeId, input.badgeId), eq(userBadges.sourceType, input.sourceType), eq(userBadges.sourceId, input.sourceId))).limit(1);
    if (duplicate[0]) return null;
    throw error;
  }
  return (await db.select().from(badges).where(eq(badges.id, input.badgeId)).limit(1))[0] ?? null;
}

async function currentLevelForXp(db: DbExecutor, xp: number): Promise<LevelRow | null> {
  const rows = await db.select().from(xpLevels).where(and(eq(xpLevels.isActive, true), lte(xpLevels.minXp, xp))).orderBy(desc(xpLevels.minXp)).limit(1);
  return rows[0] ?? null;
}

async function unlockedFeaturesForLevel(db: DbExecutor, levelId: number | null) {
  if (!levelId) return [];
  return db.select({ feature: gamificationFeatures })
    .from(levelFeatureUnlocks)
    .innerJoin(gamificationFeatures, eq(levelFeatureUnlocks.featureId, gamificationFeatures.id))
    .where(and(eq(levelFeatureUnlocks.levelId, levelId), eq(gamificationFeatures.isActive, true)));
}

export async function awardXp(db: DbExecutor, input: {
  userId: number;
  amount: number;
  sourceType: string;
  sourceId: string;
  dedupeKey: string;
  reason: string;
  ruleId?: number | null;
  metadata?: Record<string, unknown>;
}): Promise<{ awarded: boolean; transactionId?: number; balanceAfter: number; level: LevelRow | null; levelUp: boolean; unlockedFeatures: Array<typeof gamificationFeatures.$inferSelect> }> {
  const existing = await db.select().from(xpTransactions).where(eq(xpTransactions.dedupeKey, input.dedupeKey)).limit(1);
  const profileRows = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, input.userId)).limit(1);
  const profile = profileRows[0];
  if (!profile) throw new Error("Không tìm thấy hồ sơ học viên để ghi nhận XP.");
  const existingLevel = await currentLevelForXp(db, profile.xpBalance);
  if (existing[0]) {
    return { awarded: false, balanceAfter: profile.xpBalance, level: existingLevel, levelUp: false, unlockedFeatures: [] };
  }

  const provisionalBalance = profile.xpBalance + input.amount;
  let transactionId: number;
  try {
    const created = await db.insert(xpTransactions).values({
      userId: input.userId,
      amount: input.amount,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      ruleId: input.ruleId ?? null,
      reason: input.reason,
      balanceAfter: provisionalBalance,
      dedupeKey: input.dedupeKey,
      metadata: input.metadata ?? null,
    });
    transactionId = Number(created[0].insertId);
  } catch (error) {
    const duplicate = await db.select().from(xpTransactions).where(eq(xpTransactions.dedupeKey, input.dedupeKey)).limit(1);
    if (duplicate[0]) return { awarded: false, balanceAfter: profile.xpBalance, level: existingLevel, levelUp: false, unlockedFeatures: [] };
    throw error;
  }

  await db.update(learnerProfiles).set({ xpBalance: sql`${learnerProfiles.xpBalance} + ${input.amount}` }).where(eq(learnerProfiles.id, profile.id));
  const updated = (await db.select().from(learnerProfiles).where(eq(learnerProfiles.id, profile.id)).limit(1))[0];
  if (!updated) throw new Error("Không thể cập nhật số dư XP.");
  const nextLevel = await currentLevelForXp(db, updated.xpBalance);
  const levelUp = Boolean(nextLevel && nextLevel.id !== profile.currentLevelId);
  await db.update(learnerProfiles).set({ currentLevelId: nextLevel?.id ?? null }).where(eq(learnerProfiles.id, profile.id));
  await db.update(xpTransactions).set({ balanceAfter: updated.xpBalance }).where(eq(xpTransactions.id, transactionId));
  const unlocked = levelUp ? await unlockedFeaturesForLevel(db, nextLevel?.id ?? null) : [];
  if (levelUp && nextLevel) await enqueueCelebration(db, { userId: input.userId, type: "level_up", title: `Bạn đã lên Level ${nextLevel.displayOrder}!`, body: `${nextLevel.name} · ${updated.xpBalance.toLocaleString("vi-VN")} XP`, xpAmount: input.amount, icon: nextLevel.icon ?? "Trophy", sourceKey: `level-up:${transactionId}`, metadata: { levelId: nextLevel.id, levelName: nextLevel.name, featureCount: unlocked.length } });
  return { awarded: true, transactionId, balanceAfter: updated.xpBalance, level: nextLevel, levelUp, unlockedFeatures: unlocked.map((row: { feature: typeof gamificationFeatures.$inferSelect }) => row.feature) };
}

async function ensureMissionAssignments(db: DbExecutor, userId: number, now: Date) {
  const definitions = await db.select().from(missionDefinitions).where(and(
    eq(missionDefinitions.isActive, true),
    or(sql`${missionDefinitions.startsAt} is null`, lte(missionDefinitions.startsAt, now)),
    or(sql`${missionDefinitions.endsAt} is null`, gte(missionDefinitions.endsAt, now)),
  )).orderBy(asc(missionDefinitions.displayOrder));
  for (const definition of definitions) {
    const period = getMissionPeriod(definition.repeatType, definition.id, now, definition.endsAt);
    await db.insert(userMissionAssignments).values({
      userId,
      missionDefinitionId: definition.id,
      periodKey: period.key,
      target: definition.target,
      xpReward: definition.xpReward,
      expiresAt: period.expiresAt,
    }).onDuplicateKeyUpdate({ set: { target: definition.target, xpReward: definition.xpReward, expiresAt: period.expiresAt } });
  }
  return definitions;
}

async function ensureAchievementAssignments(db: DbExecutor, userId: number) {
  const definitions = await db.select().from(achievements).where(eq(achievements.isActive, true)).orderBy(asc(achievements.displayOrder));
  for (const definition of definitions) {
    const target = configNumber(definition.conditionConfig ?? null, "target", 1);
    await db.insert(userAchievements).values({ userId, achievementId: definition.id, target, progress: 0, status: "locked" })
      .onDuplicateKeyUpdate({ set: { target } });
  }
}

async function rewardStreak(db: DbExecutor, input: { userId: number; now: Date; sourceId: string }) {
  const profile = (await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, input.userId)).limit(1))[0];
  if (!profile) return { currentStreak: 0, rewards: [] as XpRewardEvent[] };
  const today = utcDayStart(input.now);
  const lastDay = profile.lastLearningAt ? utcDayStart(profile.lastLearningAt) : null;
  if (lastDay?.getTime() === today.getTime()) return { currentStreak: profile.currentStreak, rewards: [] as XpRewardEvent[] };
  const isConsecutive = lastDay?.getTime() === today.getTime() - DAY_MS;
  const currentStreak = isConsecutive ? profile.currentStreak + 1 : 1;
  await db.update(learnerProfiles).set({
    currentStreak,
    longestStreak: Math.max(profile.longestStreak, currentStreak),
    lastLearningAt: input.now,
  }).where(eq(learnerProfiles.id, profile.id));
  const milestones = await db.select().from(streakRewardMilestones).where(and(eq(streakRewardMilestones.isActive, true), eq(streakRewardMilestones.days, currentStreak)));
  const rewards: XpRewardEvent[] = [];
  for (const milestone of milestones) {
    const streakKey = `${getGamificationDayKey(today)}-${currentStreak}`;
    const claim = await db.select().from(streakRewardClaims).where(and(eq(streakRewardClaims.userId, input.userId), eq(streakRewardClaims.milestoneId, milestone.id), eq(streakRewardClaims.streakKey, streakKey))).limit(1);
    if (claim[0]) continue;
    await db.insert(streakRewardClaims).values({ userId: input.userId, milestoneId: milestone.id, streakKey });
    const reward = await awardXp(db, { userId: input.userId, amount: milestone.xpReward, sourceType: "streak", sourceId: String(milestone.id), dedupeKey: `streak:${input.userId}:${milestone.id}:${streakKey}`, reason: milestone.title, metadata: { streakDays: currentStreak } });
    if (reward.awarded) rewards.push({ amount: milestone.xpReward, reason: milestone.title, sourceType: "streak", sourceId: String(milestone.id) });
    if (milestone.badgeId) {
      const badge = await awardBadge(db, { userId: input.userId, badgeId: milestone.badgeId, sourceType: "streak", sourceId: streakKey, now: input.now });
      if (badge) await enqueueCelebration(db, { userId: input.userId, type: "badge_awarded", title: `Huy hiệu mới: ${badge.name}`, body: badge.description, xpAmount: milestone.xpReward, icon: badge.icon, sourceKey: `badge:streak:${input.userId}:${badge.id}:${streakKey}`, metadata: { badgeId: badge.id, source: "streak", streakDays: currentStreak } });
    }
  }
  return { currentStreak, rewards };
}

async function progressMissions(db: DbExecutor, input: GamificationAttemptInput, now: Date) {
  await ensureMissionAssignments(db, input.userId, now);
  const assignments = await db.select({ assignment: userMissionAssignments, definition: missionDefinitions })
    .from(userMissionAssignments)
    .innerJoin(missionDefinitions, eq(userMissionAssignments.missionDefinitionId, missionDefinitions.id))
    .where(and(eq(userMissionAssignments.userId, input.userId), inArray(userMissionAssignments.status, ["available", "completed"])));
  const rewards: XpRewardEvent[] = [];
  for (const row of assignments) {
    const config = row.definition.conditionConfig ?? null;
    const increment = row.definition.metricType === "quiz_completed" ? 1
      : row.definition.metricType === "questions_answered" ? input.questionCount
        : row.definition.metricType === "score_threshold" && input.scorePercent >= configNumber(config, "minimumScore", 80) ? 1
          : 0;
    if (!increment) continue;
    const nextProgress = Math.min(row.assignment.target, row.assignment.progress + increment);
    const becameComplete = row.assignment.progress < row.assignment.target && nextProgress >= row.assignment.target;
    if (!becameComplete) {
      await db.update(userMissionAssignments).set({ progress: nextProgress }).where(eq(userMissionAssignments.id, row.assignment.id));
      continue;
    }
    const reward = await awardXp(db, {
      userId: input.userId,
      amount: row.assignment.xpReward,
      sourceType: "mission",
      sourceId: String(row.assignment.id),
      dedupeKey: `mission:${row.assignment.id}:reward`,
      reason: `Nhiệm vụ hoàn thành: ${row.definition.title}`,
      metadata: { missionCode: row.definition.code, periodKey: row.assignment.periodKey },
    });
    await db.update(userMissionAssignments).set({
      progress: nextProgress,
      status: reward.awarded ? "claimed" : "completed",
      completedAt: now,
      claimedAt: reward.awarded ? now : null,
    }).where(eq(userMissionAssignments.id, row.assignment.id));
    if (reward.awarded) rewards.push({ amount: row.assignment.xpReward, reason: row.definition.title, sourceType: "mission", sourceId: String(row.assignment.id) });
  }
  return rewards;
}

async function progressAchievements(db: DbExecutor, input: GamificationAttemptInput, now: Date) {
  const definitions = await db.select().from(achievements).where(eq(achievements.isActive, true)).orderBy(asc(achievements.displayOrder));
  const rewards: XpRewardEvent[] = [];
  for (const definition of definitions) {
    let progress = 0;
    let target = configNumber(definition.conditionConfig ?? null, "target", 1);
    if (definition.conditionType === "quiz_completed") {
      const completed = await db.select({ count: sql<number>`count(*)` }).from(attempts).where(and(eq(attempts.userId, input.userId), eq(attempts.status, "submitted")));
      progress = Number(completed[0]?.count ?? 0);
    } else if (definition.conditionType === "perfect_score") {
      target = 1;
      progress = input.scorePercent >= configNumber(definition.conditionConfig ?? null, "minimumScore", 100) ? 1 : 0;
    } else continue;
    const existing = (await db.select().from(userAchievements).where(and(eq(userAchievements.userId, input.userId), eq(userAchievements.achievementId, definition.id))).limit(1))[0];
    const achieved = progress >= target;
    if (!existing) {
      await db.insert(userAchievements).values({ userId: input.userId, achievementId: definition.id, progress: Math.min(progress, target), target, status: achieved ? "unlocked" : "locked", unlockedAt: achieved ? now : null });
    } else if (existing.status === "locked") {
      await db.update(userAchievements).set({ progress: Math.min(progress, target), target, status: achieved ? "unlocked" : "locked", unlockedAt: achieved ? now : existing.unlockedAt }).where(eq(userAchievements.id, existing.id));
    }
    if (!achieved || existing?.status === "unlocked") continue;
    const reward = await awardXp(db, { userId: input.userId, amount: definition.xpReward, sourceType: "achievement", sourceId: String(definition.id), dedupeKey: `achievement:${input.userId}:${definition.id}`, reason: `Thành tích mở khóa: ${definition.title}`, metadata: { achievementCode: definition.code } });
    if (reward.awarded) rewards.push({ amount: definition.xpReward, reason: definition.title, sourceType: "achievement", sourceId: String(definition.id) });
    if (definition.badgeId) {
      const badge = await awardBadge(db, { userId: input.userId, badgeId: definition.badgeId, sourceType: "achievement", sourceId: String(definition.id), now });
      if (badge) await enqueueCelebration(db, { userId: input.userId, type: "badge_awarded", title: `Huy hiệu mới: ${badge.name}`, body: badge.description, xpAmount: definition.xpReward, icon: badge.icon, sourceKey: `badge:achievement:${input.userId}:${badge.id}:${definition.id}`, metadata: { badgeId: badge.id, source: "achievement", achievementId: definition.id } });
    }
  }
  return rewards;
}

export async function processGamificationForAttempt(db: DbExecutor, input: GamificationAttemptInput) {
  const now = input.completedAt ?? new Date();
  const rules = await db.select().from(xpRules).where(and(eq(xpRules.status, "active"), or(sql`${xpRules.effectiveAt} is null`, lte(xpRules.effectiveAt, now)), or(sql`${xpRules.expiresAt} is null`, gte(xpRules.expiresAt, now))));
  const outcomes: XpRewardEvent[] = [];
  const levelUps: Array<{ level: LevelRow; features: Array<typeof gamificationFeatures.$inferSelect> }> = [];
  for (const rule of rules) {
    const matches = rule.trigger === "quiz.submitted" || (rule.trigger === "quiz.passed" && input.passed) || (rule.trigger === "quiz.perfect" && input.scorePercent === 100);
    if (!matches) continue;
    const reward = await awardXp(db, {
      userId: input.userId,
      amount: rule.xpAmount,
      sourceType: "attempt",
      sourceId: String(input.attemptId),
      dedupeKey: `attempt:${input.attemptId}:rule:${rule.id}`,
      ruleId: rule.id,
      reason: `${rule.name}: ${input.quizTitle}`,
      metadata: { quizId: input.quizId, scorePercent: input.scorePercent },
    });
    if (reward.awarded) outcomes.push({ amount: rule.xpAmount, reason: rule.name, sourceType: "attempt", sourceId: String(input.attemptId) });
    if (reward.levelUp && reward.level) levelUps.push({ level: reward.level, features: reward.unlockedFeatures });
  }
  const missionRewards = await progressMissions(db, input, now);
  const achievementRewards = await progressAchievements(db, input, now);
  const streak = await rewardStreak(db, { userId: input.userId, now, sourceId: String(input.attemptId) });
  return { xpRewards: [...outcomes, ...missionRewards, ...achievementRewards, ...streak.rewards], currentStreak: streak.currentStreak, levelUps };
}

export async function getLearnerGamificationSummary(db: DbExecutor, userId: number) {
  const profileRows = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  const profile = profileRows[0];
  if (!profile) return undefined;
  await db.transaction(async (tx: DbExecutor) => { await ensureMissionAssignments(tx, userId, new Date()); await ensureAchievementAssignments(tx, userId); });
  const [levels, missions, history, achievementRows, badgeRows, featureRows] = await Promise.all([
    db.select().from(xpLevels).where(eq(xpLevels.isActive, true)).orderBy(asc(xpLevels.minXp)),
    db.select({ assignment: userMissionAssignments, definition: missionDefinitions }).from(userMissionAssignments).innerJoin(missionDefinitions, eq(userMissionAssignments.missionDefinitionId, missionDefinitions.id)).where(and(eq(userMissionAssignments.userId, userId), gte(userMissionAssignments.expiresAt, new Date()))).orderBy(asc(missionDefinitions.displayOrder)),
    db.select().from(xpTransactions).where(eq(xpTransactions.userId, userId)).orderBy(desc(xpTransactions.createdAt)).limit(12),
    db.select({ userAchievement: userAchievements, achievement: achievements, badge: badges }).from(userAchievements).innerJoin(achievements, eq(userAchievements.achievementId, achievements.id)).leftJoin(badges, eq(achievements.badgeId, badges.id)).where(eq(userAchievements.userId, userId)).orderBy(asc(achievements.displayOrder)),
    db.select({ userBadge: userBadges, badge: badges }).from(userBadges).innerJoin(badges, eq(userBadges.badgeId, badges.id)).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.awardedAt)),
    db.select({ feature: gamificationFeatures, level: xpLevels }).from(levelFeatureUnlocks).innerJoin(gamificationFeatures, eq(levelFeatureUnlocks.featureId, gamificationFeatures.id)).innerJoin(xpLevels, eq(levelFeatureUnlocks.levelId, xpLevels.id)).where(eq(gamificationFeatures.isActive, true)).orderBy(asc(xpLevels.minXp)),
  ]);
  const currentLevel = levels.filter((level: LevelRow) => level.minXp <= profile.xpBalance).at(-1) ?? levels[0] ?? null;
  const nextLevel = levels.find((level: LevelRow) => level.minXp > profile.xpBalance) ?? null;
  return {
    profile,
    levels,
    currentLevel,
    nextLevel,
    xpToNextLevel: nextLevel ? Math.max(0, nextLevel.minXp - profile.xpBalance) : 0,
    missions,
    xpHistory: history,
    achievements: achievementRows,
    badges: badgeRows,
    featureUnlocks: featureRows,
  };
}
