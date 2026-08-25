export type QuizDifficultyKey = "easy" | "medium" | "hard";

type QuizDifficultyTone = {
  key: QuizDifficultyKey;
  label: string;
  badgeClass: string;
  dotClass: string;
};

const DIFFICULTY_TONES: Record<QuizDifficultyKey, QuizDifficultyTone> = {
  easy: {
    key: "easy",
    label: "Dễ",
    badgeClass: "bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D] dark:text-[#BBF7D0]",
    dotClass: "bg-[#22C55E]",
  },
  medium: {
    key: "medium",
    label: "Trung bình",
    badgeClass: "bg-[#FFEDD5] text-[#C2410C] dark:bg-[#7C2D12] dark:text-[#FED7AA]",
    dotClass: "bg-[#F97316]",
  },
  hard: {
    key: "hard",
    label: "Nâng cao",
    badgeClass: "bg-[#FCE7F3] text-[#BE185D] dark:bg-[#831843] dark:text-[#FBCFE8]",
    dotClass: "bg-[#EC4899]",
  },
};

export function getQuizDifficultyTone(value?: string | null) {
  const normalized = value?.trim().toLocaleLowerCase("vi-VN") ?? "";
  const key: QuizDifficultyKey =
    normalized === "easy" || normalized === "dễ"
      ? "easy"
      : normalized === "hard" || normalized === "khó" || normalized === "nâng cao"
        ? "hard"
        : "medium";
  const tone = DIFFICULTY_TONES[key];
  const isKnownDifficulty = [
    "easy",
    "dễ",
    "medium",
    "trung bình",
    "hard",
    "khó",
    "nâng cao",
  ].includes(normalized);
  return {
    ...tone,
    label: isKnownDifficulty ? tone.label : value?.trim() || tone.label,
  };
}
