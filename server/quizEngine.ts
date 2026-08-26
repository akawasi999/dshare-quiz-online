export type QuestionAnswerKey = {
  questionId: number;
  optionIds: number[];
  correctOptionIds: number[];
  type?: string;
  statementAnswers?: Record<string, boolean>;
  matchingPairs?: Array<{ left: string; right: string }>;
  acceptedAnswers?: string[];
  orderingItems?: Array<{ id: string; text: string }>;
  points: number;
};

export type SubmittedAnswer = { questionId: number; selectedOptionIds: number[]; answerPayload?: Record<string, unknown> | null };
export type ScoreSummary = { earnedPoints: number; availablePoints: number; scorePercent: number; correctCount: number; answerResults: Array<{ questionId: number; isCorrect: boolean }> };

const normalized = (values: number[]) => Array.from(new Set(values)).sort((a, b) => a - b);
const normalizeTextAnswer = (value: string) => value.trim().toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");

export function areSameSelections(left: number[], right: number[]) { const a = normalized(left); const b = normalized(right); return a.length === b.length && a.every((value, index) => value === b[index]); }
export function areSameStatementSelections(answerKey: Record<string, boolean>, answerPayload?: Record<string, unknown> | null) { const submitted = answerPayload?.statementAnswers; if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) return false; const values = submitted as Record<string, unknown>; const ids = Object.keys(answerKey); return ids.length === Object.keys(values).length && ids.every(id => values[id] === answerKey[id]); }
export function isAcceptedTextAnswer(acceptedAnswers: string[], answerPayload?: Record<string, unknown> | null) { const submitted = answerPayload?.textAnswer; return typeof submitted === "string" && Boolean(submitted.trim()) && acceptedAnswers.some(answer => normalizeTextAnswer(answer) === normalizeTextAnswer(submitted)); }
export function areSameMatchingSelections(answerKey: Array<{ left: string; right: string }>, answerPayload?: Record<string, unknown> | null) { const submitted = answerPayload?.matchingAnswers; if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) return false; const values = submitted as Record<string, unknown>; return answerKey.length > 0 && answerKey.every((pair, index) => values[String(index)] === pair.right); }
export function areSameOrderingSelections(answerKey: Array<{ id: string }>, answerPayload?: Record<string, unknown> | null) { const submitted = answerPayload?.orderingIds; return Array.isArray(submitted) && submitted.every(value => typeof value === "string") && answerKey.length > 1 && answerKey.length === submitted.length && answerKey.every((item, index) => item.id === submitted[index]); }
export function scoreQuiz(answerKey: QuestionAnswerKey[], submittedAnswers: SubmittedAnswer[]): ScoreSummary {
  const submittedMap = new Map(submittedAnswers.map(answer => [answer.questionId, answer.selectedOptionIds]));
  const submittedPayloadMap = new Map(submittedAnswers.map(answer => [answer.questionId, answer.answerPayload]));
  let earnedPoints = 0; let correctCount = 0;
  const answerResults = answerKey.map(question => {
    const payload = submittedPayloadMap.get(question.questionId);
    const isCorrect = question.type === "true_false_statements" ? areSameStatementSelections(question.statementAnswers ?? {}, payload)
      : question.type === "matching" ? areSameMatchingSelections(question.matchingPairs ?? [], payload)
        : question.type === "ordering" ? areSameOrderingSelections(question.orderingItems ?? [], payload)
          : question.type === "fill_blank" ? isAcceptedTextAnswer(question.acceptedAnswers ?? [], payload)
            : question.type === "essay" ? false
              : areSameSelections(submittedMap.get(question.questionId) ?? [], question.correctOptionIds);
    if (isCorrect) { earnedPoints += question.points; correctCount += 1; }
    return { questionId: question.questionId, isCorrect };
  });
  const availablePoints = answerKey.reduce((sum, question) => sum + question.points, 0);
  return { earnedPoints, availablePoints, scorePercent: availablePoints === 0 ? 0 : Math.round((earnedPoints / availablePoints) * 100), correctCount, answerResults };
}

/** Deterministic Fisher-Yates shuffle so a saved attempt keeps one stable order. */
export function shuffledForAttempt<T>(items: T[], seed: number): T[] { const result = [...items]; let state = Math.abs(seed) || 1; const random = () => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; }; for (let index = result.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [result[index], result[target]] = [result[target], result[index]]; } return result; }
