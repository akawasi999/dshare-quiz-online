import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transcript: vi.fn(), lookup: vi.fn() }));

vi.mock("youtube-transcript", () => ({ fetchTranscript: mocks.transcript }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));

import { extractRemoteQuizSource } from "./remoteQuizExtraction";

describe("remoteQuizExtraction", () => {
  afterEach(() => { vi.unstubAllGlobals(); mocks.transcript.mockReset(); mocks.lookup.mockReset(); });

  it("chặn URL nội bộ trước khi gửi yêu cầu trích xuất", async () => {
    await expect(extractRemoteQuizSource("http://127.0.0.1/private")).rejects.toThrow("địa chỉ nội bộ");
  });

  it("chuẩn hóa phụ đề YouTube thành nguồn văn bản Quiz", async () => {
    mocks.lookup.mockResolvedValue([{ address: "142.250.72.206", family: 4 }]);
    mocks.transcript.mockResolvedValue([{ text: "Nội dung bài học về hệ mặt trời và các hành tinh chuyển động quanh Mặt Trời.", duration: 5, offset: 0 }, { text: "Trái Đất là hành tinh thứ ba tính từ Mặt Trời.", duration: 4, offset: 5 }]);
    const source = await extractRemoteQuizSource("https://www.youtube.com/watch?v=abcdef12345");
    expect(source.sourceType).toBe("youtube");
    expect(source.sourceName).toContain("abcdef12345");
    expect(source.text).toContain("Trái Đất");
  });

  it("đọc văn bản trang web công khai và loại bỏ phần script", async () => {
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html><head><title>Bài học sinh học</title><script>secret()</script></head><body><article>" + "Nội dung sinh học về tế bào. ".repeat(12) + "</article></body></html>", { headers: { "content-type": "text/html", "content-length": "700" } })));
    const source = await extractRemoteQuizSource("https://example.com/sinh-hoc");
    expect(source.sourceType).toBe("web");
    expect(source.sourceName).toBe("Bài học sinh học");
    expect(source.text).not.toContain("secret");
  });

  it("chặn chuyển hướng đến địa chỉ nội bộ trước khi tải nội dung", async () => {
    mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 302, headers: { location: "http://127.0.0.1/private" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(extractRemoteQuizSource("https://example.com/redirect")).rejects.toThrow("địa chỉ nội bộ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
