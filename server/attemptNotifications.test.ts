import { describe, expect, it } from "vitest";
import { buildAttemptMilestoneAlert } from "./attemptNotifications";

const base = { learnerName: "Minh", quizTitle: "Python cơ bản", scorePercent: 82, passed: true, isFirstCompletion: false, isQuizRecord: false, isPersonalRecord: false };

describe("attempt milestone alerts", () => {
  it("ưu tiên thông báo hoàn thành đầu tiên", () => {
    expect(buildAttemptMilestoneAlert({ ...base, isFirstCompletion: true, isQuizRecord: true, isPersonalRecord: true }).kind).toBe("first_completion");
  });

  it("ưu tiên kỷ lục bộ đề, sau đó là kỷ lục cá nhân, điểm cao và hoàn thành thông thường", () => {
    expect(buildAttemptMilestoneAlert({ ...base, isQuizRecord: true, isPersonalRecord: true, scorePercent: 94 }).kind).toBe("quiz_record");
    expect(buildAttemptMilestoneAlert({ ...base, isPersonalRecord: true }).kind).toBe("personal_record");
    expect(buildAttemptMilestoneAlert({ ...base, scorePercent: 94 }).kind).toBe("high_score");
    expect(buildAttemptMilestoneAlert(base).kind).toBe("completion");
  });
});
