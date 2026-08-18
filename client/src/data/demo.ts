export type ShowcaseQuiz = {
  id: number;
  title: string;
  summary: string;
  category: string;
  subject: string;
  lesson: string;
  difficulty: "Dễ" | "Trung bình" | "Nâng cao";
  mode: "Ôn tập" | "Kiểm tra";
  questionCount: number;
  duration: string;
  points: number;
  reward: number;
  tier: "Basic" | "Pro" | "Premium";
  accent: string;
};

export const showcaseQuizzes: ShowcaseQuiz[] = [
  {
    id: 101,
    title: "Nền tảng Python: Tư duy & Cú pháp",
    summary: "Củng cố tư duy lập trình, biến, kiểu dữ liệu và cấu trúc điều khiển qua tình huống thực tế.",
    category: "Công nghệ", subject: "Lập trình Python", lesson: "Chương 01", difficulty: "Dễ", mode: "Ôn tập", questionCount: 20, duration: "25 phút", points: 0, reward: 30, tier: "Basic", accent: "#4299e1",
  },
  {
    id: 102,
    title: "Data Literacy: Đọc hiểu dữ liệu",
    summary: "Rèn kỹ năng đọc biểu đồ, xác định xu hướng và kiểm tra các suy luận thường gặp từ dữ liệu.",
    category: "Công nghệ", subject: "Phân tích dữ liệu", lesson: "Chương 02", difficulty: "Trung bình", mode: "Kiểm tra", questionCount: 30, duration: "35 phút", points: 50, reward: 80, tier: "Pro", accent: "#3182ce",
  },
  {
    id: 103,
    title: "Academic Writing: Coherence",
    summary: "Ôn tập chiến lược liên kết ý, phát triển luận điểm và sử dụng tín hiệu diễn ngôn trong bài viết học thuật.",
    category: "Ngoại ngữ", subject: "IELTS Writing", lesson: "Bài 05", difficulty: "Trung bình", mode: "Ôn tập", questionCount: 24, duration: "30 phút", points: 0, reward: 40, tier: "Basic", accent: "#2a4365",
  },
  {
    id: 104,
    title: "Tư duy phản biện: Lập luận tốt",
    summary: "Phân biệt giả định, bằng chứng, ngụy biện và cách xây dựng một lập luận có trách nhiệm.",
    category: "Kỹ năng", subject: "Tư duy phản biện", lesson: "Bài 03", difficulty: "Nâng cao", mode: "Kiểm tra", questionCount: 25, duration: "40 phút", points: 75, reward: 120, tier: "Premium", accent: "#6ba8dc",
  },
];

export const progressPreview = [
  { label: "Lập trình Python", value: 72, accent: "#4299e1" },
  { label: "IELTS Writing", value: 46, accent: "#3182ce" },
  { label: "Tư duy phản biện", value: 31, accent: "#2a4365" },
];

export const pricingPlans = [
  { name: "Basic", price: "0đ", description: "Khởi đầu với thư viện ôn tập thiết yếu.", features: ["Bộ đề Basic", "Theo dõi tiến độ", "Ví Point cá nhân"], highlighted: false },
  { name: "Pro", price: "149.000đ", description: "Nâng tốc độ học với kho đề chuyên sâu.", features: ["Mở khóa bài Pro", "Giảm phí kiểm tra", "Phân tích điểm số nâng cao"], highlighted: true },
  { name: "Premium", price: "349.000đ", description: "Trải nghiệm không giới hạn cho mục tiêu nghiêm túc.", features: ["Kho đề Premium", "Ưu đãi Point", "Gợi ý học tập AI"], highlighted: false },
];
