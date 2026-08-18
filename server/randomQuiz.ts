export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyRatios = Record<Difficulty, number>;

export function allocateQuestionCounts(questionCount: number, ratios: DifficultyRatios): Record<Difficulty, number> {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const raw = difficulties.map(difficulty => ({ difficulty, value: questionCount * ratios[difficulty] }));
  const counts = Object.fromEntries(raw.map(item => [item.difficulty, Math.floor(item.value)])) as Record<Difficulty, number>;
  let remaining = questionCount - difficulties.reduce((total, difficulty) => total + counts[difficulty], 0);
  raw.sort((left, right) => (right.value - Math.floor(right.value)) - (left.value - Math.floor(left.value)) || difficulties.indexOf(left.difficulty) - difficulties.indexOf(right.difficulty));
  for (let index = 0; remaining > 0; index = (index + 1) % raw.length) {
    counts[raw[index].difficulty] += 1;
    remaining -= 1;
  }
  return counts;
}
