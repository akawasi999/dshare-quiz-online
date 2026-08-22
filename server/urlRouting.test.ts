import { describe, expect, it } from "vitest";
import { LEGACY_ROUTE_MAP, ROUTES } from "../client/src/lib/routes";

describe("URL routing", () => {
  it("công bố các URL chính bằng tiếng Anh", () => {
    expect(ROUTES.explore).toBe("/explore");
    expect(ROUTES.quizBuilder).toBe("/quiz/create");
    expect(ROUTES.account).toBe("/account");
    expect(ROUTES.paymentStatus).toBe("/payment-status");
    expect(ROUTES.adminTopics).toBe("/admin/learning/topics");
  });

  it("giữ ánh xạ tương thích từ URL tiếng Việt sang URL tiếng Anh", () => {
    expect(LEGACY_ROUTE_MAP["/kham-pha"]).toBe(ROUTES.explore);
    expect(LEGACY_ROUTE_MAP["/tao-quiz"]).toBe(ROUTES.quizBuilder);
    expect(LEGACY_ROUTE_MAP["/thanh-toan"]).toBe(ROUTES.paymentStatus);
    expect(LEGACY_ROUTE_MAP["/quan-tri/nhom-nguoi-dung"]).toBe(ROUTES.adminUserGroups);
  });
});
