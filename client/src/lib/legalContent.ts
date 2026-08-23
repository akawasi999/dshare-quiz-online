export const defaultTermsContent = "Người dùng có trách nhiệm cung cấp thông tin chính xác, bảo vệ tài khoản và sử dụng nội dung học tập theo mục đích phù hợp.\n\nNội dung do người dùng tạo vẫn thuộc trách nhiệm của người tạo. Không đăng tải hoặc sử dụng nội dung vi phạm quyền của bên thứ ba.\n\nNếu cần làm rõ nội dung liên quan đến việc sử dụng dịch vụ, vui lòng liên hệ đội ngũ hỗ trợ qua các kênh chính thức của Dshare.";
export const defaultPrivacyContent = "Thông tin tài khoản và dữ liệu học tập được sử dụng để cung cấp chức năng, lưu tiến độ và cải thiện trải nghiệm trên nền tảng.\n\nDshare áp dụng các biện pháp kỹ thuật phù hợp trong phạm vi hệ thống để bảo vệ dữ liệu và giới hạn quyền truy cập theo vai trò.\n\nBạn có thể xem và cập nhật thông tin hồ sơ trong khu vực tài khoản. Với yêu cầu khác, hãy liên hệ đội ngũ hỗ trợ.";
export const defaultSupport = { title: "Liên hệ & Hỗ trợ", description: "Đội ngũ Dshare sẵn sàng hỗ trợ các câu hỏi về tài khoản, Quiz và trải nghiệm học tập.", email: "", phone: "", hours: "Thứ Hai – Thứ Sáu, 08:30 – 17:30" };

export function formatUpdatedAt(value: Date | string | null | undefined) {
  if (!value) return "Chưa có lần cập nhật riêng";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}
