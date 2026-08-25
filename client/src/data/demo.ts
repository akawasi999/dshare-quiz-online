export type ShowcaseQuiz = {
  id: number;
  title: string;
  summary: string;
  category: string;
  subject: string;
  lesson: string;
  topicPath?: string;
  difficulty: "Dễ" | "Trung bình" | "Nâng cao";
  mode: "Ôn tập" | "Kiểm tra";
  questionCount: number;
  duration: string;
  points: number;
  reward: number;
  attemptCount?: number;
  recentAttemptCount?: number;
  isTrending?: boolean;
  createdAt?: Date;
  coverImage?: string;
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
  { name: "Gói Miễn phí", tier: "Basic", price: "Miễn phí", description: "", benefits: [{ label: "AI Credits mỗi tháng", value: "20" }, { label: "Lượt thi tối đa/tháng", value: "20" }, { label: "Số Quiz được tạo/tháng", value: "2" }, { label: "Phân tích, báo cáo & upload AI", value: "Chưa kích hoạt" }, { label: "Live Monitoring", value: "Chưa kích hoạt" }, { label: "Hỗ trợ ưu tiên & tùy chỉnh thương hiệu", value: "Chưa kích hoạt" }], highlighted: false },
  { name: "Gói PRO", tier: "Pro", price: "50.000đ", description: "", benefits: [{ label: "AI Credits mỗi tháng", value: "40" }, { label: "Lượt thi tối đa/tháng", value: "40" }, { label: "Số Quiz được tạo/tháng", value: "20" }, { label: "Phân tích, báo cáo & upload AI", value: "Chưa kích hoạt" }, { label: "Live Monitoring", value: "Chưa kích hoạt" }, { label: "Hỗ trợ ưu tiên & tùy chỉnh thương hiệu", value: "Chưa kích hoạt" }], highlighted: true },
  { name: "Gói PREMIUM", tier: "Premium", price: "100.000đ", description: "", benefits: [{ label: "AI Credits mỗi tháng", value: "50" }, { label: "Lượt thi tối đa/tháng", value: "Vô hạn" }, { label: "Số Quiz được tạo/tháng", value: "50" }, { label: "Phân tích, báo cáo & upload AI", value: "Chưa kích hoạt" }, { label: "Live Monitoring", value: "Chưa kích hoạt" }, { label: "Hỗ trợ ưu tiên & tùy chỉnh thương hiệu", value: "Chưa kích hoạt" }], highlighted: false },
];
