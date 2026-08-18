export type LeaderboardScope = "all" | "quiz";

export function createLeaderboardInput(scope: LeaderboardScope, quizId: number | null) {
  return scope === "quiz" && quizId ? { quizId } : undefined;
}

export function getLeaderboardHeading(scope: LeaderboardScope, quizTitle?: string | null) {
  return scope === "quiz" && quizTitle ? quizTitle : scope === "quiz" ? "Bộ đề đang chọn" : "Toàn hệ thống";
}
