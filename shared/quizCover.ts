export const quizCoverAcceptedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const quizCoverMaxFileSize = 5_000_000;

export function validateQuizCoverFile(file: { type: string; size: number }) {
  if (!quizCoverAcceptedMimeTypes.includes(file.type as (typeof quizCoverAcceptedMimeTypes)[number])) {
    return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.";
  }
  if (file.size > quizCoverMaxFileSize) {
    return "Ảnh bìa cần nhỏ hơn 5 MB.";
  }
  return null;
}
