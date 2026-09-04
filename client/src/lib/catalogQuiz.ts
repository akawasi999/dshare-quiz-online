import type { ShowcaseQuiz } from "@/data/demo";

export const difficultyLabels = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Nâng cao",
} as const;

export const tierLabels = {
  basic: "Basic",
  pro: "Pro",
  premium: "Premium",
} as const;

export type CatalogQuizRecord = {
  quizId: number;
  title: string;
  rootTopicTitle?: string | null;
  topicTitle?: string | null;
  categoryTitle?: string | null;
  subjectTitle?: string | null;
  lessonTitle?: string | null;
  topicPath?: string | null;
  summary?: string | null;
  mode?: string | null;
  difficulty: keyof typeof difficultyLabels;
  durationSeconds: number;
  questionCount: number;
  entryPointCost: number;
  completionReward: number;
  attemptCount?: number | null;
  recentAttemptCount?: number | null;
  createdAt?: Date | null;
  coverImageUrl?: string | null;
  creatorName?: string | null;
  accessTier: keyof typeof tierLabels;
};

export function toShowcaseQuiz(quiz: CatalogQuizRecord): ShowcaseQuiz {
  const category =
    quiz.rootTopicTitle ??
    quiz.topicTitle ??
    quiz.categoryTitle ??
    "Chưa phân loại";

  return {
    id: quiz.quizId,
    title: quiz.title,
    category,
    subject: quiz.subjectTitle ?? "",
    lesson: quiz.lessonTitle ?? "",
    topicPath:
      quiz.topicPath ??
      ([quiz.rootTopicTitle, quiz.topicTitle].filter(Boolean).join(" › ") ||
        quiz.categoryTitle ||
        "Chưa phân loại"),
    summary: quiz.summary ?? "Bộ đề đã được biên soạn trong Dshare.",
    mode: quiz.mode === "testing" ? "Kiểm tra" : "Ôn tập",
    difficulty: difficultyLabels[quiz.difficulty],
    duration: `${Math.ceil(quiz.durationSeconds / 60)} phút`,
    questionCount: quiz.questionCount,
    accent: "var(--primary)",
    points: quiz.entryPointCost,
    reward: quiz.completionReward,
    attemptCount: Number(quiz.attemptCount ?? 0),
    recentAttemptCount: Number(quiz.recentAttemptCount ?? 0),
    createdAt: quiz.createdAt ?? undefined,
    coverImage: quiz.coverImageUrl ?? undefined,
    authorName: quiz.creatorName ?? undefined,
    tier: tierLabels[quiz.accessTier],
    visibility: "public",
  };
}
