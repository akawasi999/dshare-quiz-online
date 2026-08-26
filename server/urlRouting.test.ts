import { describe, expect, it } from "vitest";
import { ROUTES } from "../client/src/lib/routes";

describe("URL routing", () => {
  it("công bố các URL chính bằng tiếng Anh", () => {
    expect(ROUTES.explore).toBe("/quiz");
    expect(ROUTES.quizBuilder).toBe("/build");
    expect(ROUTES.practice).toBe("/practice");
    expect(ROUTES.practiceReview).toBe("/practice/review");
    expect(ROUTES.account).toBe("/account");
    expect(ROUTES.dashboard).toBe("/dashboard");
    expect(ROUTES.paymentStatus).toBe("/payment-status");
    expect(ROUTES.adminTopics).toBe("/admin/learning/topics");
  });

  it("không công bố URL điều hướng cũ", () => {
    const routes = Object.values(ROUTES);
    expect(routes).not.toContain("/explore");
    expect(routes).not.toContain("/kham-pha");
    expect(routes).not.toContain("/ho-so");
    expect(routes).not.toContain("/quan-tri");
  });
});
