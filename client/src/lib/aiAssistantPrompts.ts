export type QuizPromptContext = { title: string; subjectTitle: string; lessonTitle: string };

export const defaultAiAssistantPrompts = [
  "Lập kế hoạch ôn tập 7 ngày",
  "Giải thích cách học bằng active recall",
  "Gợi ý cách xử lý một câu khó",
];

export function buildAiAssistantPrompts(input: { subject?: string; quiz?: QuizPromptContext }) {
  if (input.quiz) return [
    `Tóm tắt kiến thức trọng tâm của bộ đề ${input.quiz.title}.`,
    `Lập kế hoạch ôn ${input.quiz.subjectTitle} trước khi làm ${input.quiz.title}.`,
    `Gợi ý cách tự kiểm tra kiến thức trong ${input.quiz.lessonTitle}.`,
  ];
  if (input.subject?.trim()) return [
    `Tóm tắt các khái niệm cốt lõi của ${input.subject.trim()}.`,
    `Tạo kế hoạch ôn ${input.subject.trim()} trong 30 phút.`,
    `Đặt 3 câu hỏi tự kiểm tra về ${input.subject.trim()}.`,
  ];
  return defaultAiAssistantPrompts;
}

export function buildAiAssistantFollowUpPrompts(answer: string) {
  const topic = answer.replace(/[#*_`>[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 96);
  if (topic.length < 12) return [];
  return [
    `Bạn có thể giải thích sâu hơn phần: “${topic}” không?`,
    `Hãy cho tôi một ví dụ thực hành liên quan đến nội dung trên.`,
    `Tạo 3 câu hỏi tự kiểm tra từ nội dung vừa giải thích.`,
  ];
}
