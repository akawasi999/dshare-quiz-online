// @vitest-environment jsdom
import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
}));

const procedures = {
  learner: { summary: { invalidate: mocks.invalidate }, quota: { invalidate: mocks.invalidate }, wallet: { invalidate: mocks.invalidate }, history: { invalidate: mocks.invalidate } },
  creator: { myQuizzes: { invalidate: mocks.invalidate } },
  catalog: { list: { invalidate: mocks.invalidate }, categories: { invalidate: mocks.invalidate }, topics: { invalidate: mocks.invalidate }, detail: { invalidate: mocks.invalidate }, membershipPlans: { invalidate: mocks.invalidate } },
  payment: { offers: { invalidate: mocks.invalidate } },
};

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => procedures } }));

import SharedDataSyncBridge from "../client/src/components/SharedDataSyncBridge";
import { announceSharedDataChange } from "../client/src/lib/sharedDataSync";

describe("SharedDataSyncBridge", () => {
  afterEach(() => { cleanup(); mocks.invalidate.mockClear(); });

  it("làm mới các contract user-facing khi CPanel phát tín hiệu thay đổi dữ liệu", async () => {
    render(<SharedDataSyncBridge />);
    announceSharedDataChange("account");
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledTimes(11));
  });
});
