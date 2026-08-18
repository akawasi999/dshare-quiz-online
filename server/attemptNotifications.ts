export type AttemptMilestoneInput = {
  learnerName: string;
  quizTitle: string;
  scorePercent: number;
  passed: boolean;
  isFirstCompletion: boolean;
  isQuizRecord: boolean;
  isPersonalRecord: boolean;
};

export function buildAttemptMilestoneAlert(input: AttemptMilestoneInput) {
  const outcome = input.passed ? "Đạt" : "Chưa đạt";
  if (input.isFirstCompletion) return {
    kind: "first_completion" as const,
    title: "Dshare Quiz: học viên vừa hoàn thành bài đầu tiên",
    content: `${input.learnerName} vừa hoàn thành lượt làm bài đầu tiên: “${input.quizTitle}” với ${input.scorePercent}% (${outcome}).`,
  };
  if (input.isQuizRecord) return {
    kind: "quiz_record" as const,
    title: "Dshare Quiz: kỷ lục bộ đề mới",
    content: `${input.learnerName} vừa phá kỷ lục của bộ đề “${input.quizTitle}” với ${input.scorePercent}% (${outcome}).`,
  };
  if (input.isPersonalRecord) return {
    kind: "personal_record" as const,
    title: "Dshare Quiz: kỷ lục cá nhân mới",
    content: `${input.learnerName} vừa lập kỷ lục cá nhân ở “${input.quizTitle}” với ${input.scorePercent}% (${outcome}).`,
  };
  if (input.scorePercent >= 90) return {
    kind: "high_score" as const,
    title: "Dshare Quiz: kết quả cao mới",
    content: `${input.learnerName} vừa hoàn thành “${input.quizTitle}” với kết quả cao ${input.scorePercent}% (${outcome}).`,
  };
  return {
    kind: "completion" as const,
    title: "Dshare Quiz: lượt hoàn thành mới",
    content: `${input.learnerName} vừa hoàn thành “${input.quizTitle}” với ${input.scorePercent}% (${outcome}).`,
  };
}
