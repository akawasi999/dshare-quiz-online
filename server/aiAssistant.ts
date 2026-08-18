export type QuizAssistantIntent = "explain" | "resources" | "follow_up";

export function buildQuizAssistantMessages(input: {
  intent: QuizAssistantIntent;
  prompt: string;
  explanation: string | null;
  options: Array<{ body: string; isCorrect: boolean }>;
  followUp?: string;
}) {
  const correctAnswers = input.options.filter(option => option.isCorrect).map(option => option.body);
  const intentInstruction = input.intent === "resources"
    ? "Đề xuất cách tự học, dạng tài liệu nên tìm và 3–5 từ khóa tìm kiếm. Không nêu đường dẫn, trích dẫn hay tên nguồn nếu không chắc chắn."
    : input.intent === "follow_up"
      ? "Trả lời trực tiếp câu hỏi tiếp nối của người học, chỉ dựa trên ngữ cảnh bên dưới. Nếu câu hỏi nằm ngoài ngữ cảnh, nói rõ giới hạn và hướng người học quay lại trọng tâm."
      : "Giải thích theo từng bước suy luận, chỉ ra vì sao đáp án đúng phù hợp và vì sao cách hiểu phổ biến có thể sai.";
  return [
    {
      role: "system" as const,
      content: "Bạn là Trợ lý học tập Dshare. Trả lời bằng tiếng Việt rõ ràng, thân thiện và súc tích. Chỉ dùng ngữ cảnh quiz được cung cấp; không bịa thông tin, nguồn tham khảo, liên kết hoặc dữ kiện bên ngoài. Không làm hộ bài thi đang diễn ra. Dùng tiêu đề Markdown ngắn và gạch đầu dòng khi giúp người học dễ theo dõi.",
    },
    {
      role: "user" as const,
      content: `${intentInstruction}\n\nNội dung câu hỏi: ${input.prompt}\nCác phương án: ${input.options.map(option => option.body).join(" | ") || "Không có phương án"}\nĐáp án đúng do hệ thống xác nhận: ${correctAnswers.join(" | ") || "Xem lời giải"}\nLời giải biên soạn: ${input.explanation ?? "Chưa có lời giải biên soạn."}${input.followUp ? `\nCâu hỏi tiếp nối của người học: ${input.followUp}` : ""}`,
    },
  ];
}
