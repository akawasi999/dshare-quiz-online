import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { invokeLLM, listLLMModels } from "./_core/llm";

export type AiAssistantProvider = "manus" | "gemini";
export type AssistantMessage = { role: "user" | "assistant"; content: string };

const encryptionKey = () => createHash("sha256").update(process.env.JWT_SECRET || "dshare-ai-assistant-config").digest();

export function encryptAiAssistantApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptAiAssistantApiKey(ciphertext: string) {
  const [version, ivValue, tagValue, encryptedValue] = ciphertext.split(":");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Cấu hình khóa AI không hợp lệ.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}

export function buildDshareAssistantMessages(messages: AssistantMessage[]) {
  return [
    {
      role: "system" as const,
      content: "Bạn là Dshare AI Assistant, trợ lý học tập tiếng Việt của Dshare Quiz Online. Hãy trả lời thân thiện, chính xác, cô đọng và có cấu trúc Markdown dễ đọc. Bạn có thể giải thích kiến thức, lập kế hoạch ôn tập, tạo ví dụ, gợi ý cách học và phản hồi về Quiz. Không bịa nguồn, số liệu hay liên kết. Không hỗ trợ gian lận trong bài kiểm tra đang diễn ra; thay vào đó hãy hướng dẫn phương pháp suy nghĩ. Nếu thiếu ngữ cảnh, hãy hỏi lại một câu làm rõ.",
    },
    ...messages.map(message => ({ role: message.role, content: message.content })),
  ];
}

function textFromResponse(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.filter((item: any) => item?.type === "text").map((item: any) => item.text).join("\n").trim();
  return "";
}

async function callManus(model: string, messages: AssistantMessage[]) {
  const catalog = await listLLMModels();
  const resolvedModel = catalog.data.find(item => item.id === model)?.id ?? catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  if (!resolvedModel) throw new Error("Manus AI hiện chưa có mô hình khả dụng.");
  const response = await invokeLLM({ model: resolvedModel, messages: buildDshareAssistantMessages(messages), maxTokens: 900 });
  return textFromResponse(response.choices[0]?.message.content);
}

async function callGemini(apiKey: string, model: string, messages: AssistantMessage[]) {
  const contents = buildDshareAssistantMessages(messages).map(message => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.55, maxOutputTokens: 900 } }),
  });
  const payload = await response.json().catch(() => ({})) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `Gemini trả về lỗi ${response.status}.`);
  return payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("\n").trim() ?? "";
}

export async function generateAiAssistantReply(input: { provider: AiAssistantProvider; model: string; apiKeyCiphertext: string | null; messages: AssistantMessage[] }) {
  const reply = input.provider === "manus"
    ? await callManus(input.model, input.messages)
    : await callGemini(decryptAiAssistantApiKey(input.apiKeyCiphertext || ""), input.model, input.messages);
  if (!reply) throw new Error("AI Assistant chưa thể tạo phản hồi. Vui lòng thử lại sau.");
  return reply;
}
