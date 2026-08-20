import { invokeLLM, listLLMModels } from "./_core/llm";
import { buildDshareAssistantMessages, decryptAiAssistantApiKey, type AiAssistantProvider, type StudyContext } from "./aiAssistantService";

function textFromResponse(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.filter((item: any) => item?.type === "text").map((item: any) => item.text).join("\n").trim();
  return "";
}

async function resolveManusModel(model: string) {
  const catalog = await listLLMModels();
  const resolved = catalog.data.find(item => item.id === model)?.id ?? catalog.data.find(item => item.id === "gemini-3-flash-preview")?.id ?? catalog.data.find(item => item.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
  if (!resolved) throw new Error("Manus AI hiện chưa có mô hình khả dụng.");
  return resolved;
}

export async function analyzeAiAssistantImage(input: { provider: AiAssistantProvider; model: string; apiKeyCiphertext: string | null; dataUrl: string; instruction: string; studyContext?: StudyContext }) {
  const system = buildDshareAssistantMessages([], { ...input.studyContext, mode: "socratic" }).map(message => message.content).join("\n\n");
  const guidance = `${input.instruction}\nHãy đọc kỹ ảnh, giải thích từng bước theo phong cách Socratic và không suy diễn chi tiết không thấy rõ.`;
  if (input.provider === "manus") {
    const response = await invokeLLM({ model: await resolveManusModel(input.model), messages: [{ role: "system", content: system }, { role: "user", content: [{ type: "text", text: guidance }, { type: "image_url", image_url: { url: input.dataUrl, detail: "auto" } }] }] as any, maxTokens: 1_200 });
    const reply = textFromResponse(response.choices[0]?.message.content);
    if (!reply) throw new Error("AI chưa thể phân tích ảnh. Vui lòng thử lại với ảnh rõ hơn.");
    return reply;
  }
  const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Định dạng ảnh không hợp lệ.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": decryptAiAssistantApiKey(input.apiKeyCiphertext || "") }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: guidance }, { inlineData: { mimeType: match[1], data: match[2] } }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 1_200 } }) });
  const payload = await response.json().catch(() => ({})) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Gemini chưa thể phân tích ảnh.");
  const reply = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("\n").trim();
  if (!reply) throw new Error("AI chưa thể phân tích ảnh. Vui lòng thử lại với ảnh rõ hơn.");
  return reply;
}
