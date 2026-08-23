import SiteHeader from "@/components/SiteHeader";

type LegalDocument = "terms" | "privacy";

const copy: Record<LegalDocument, { eyebrow: string; title: string; intro: string; sections: Array<{ title: string; body: string }> }> = {
  terms: {
    eyebrow: "Thông tin pháp lý",
    title: "Điều khoản sử dụng",
    intro: "Các nguyên tắc chung khi sử dụng nền tảng Dshare Quiz Online.",
    sections: [
      { title: "Sử dụng nền tảng", body: "Người dùng có trách nhiệm cung cấp thông tin chính xác, bảo vệ tài khoản và sử dụng nội dung học tập theo mục đích phù hợp." },
      { title: "Nội dung và quyền sở hữu", body: "Nội dung do người dùng tạo vẫn thuộc trách nhiệm của người tạo. Không đăng tải hoặc sử dụng nội dung vi phạm quyền của bên thứ ba." },
      { title: "Liên hệ", body: "Nếu cần làm rõ một nội dung liên quan đến việc sử dụng dịch vụ, vui lòng liên hệ đội ngũ hỗ trợ qua các kênh chính thức của Dshare." },
    ],
  },
  privacy: {
    eyebrow: "Thông tin pháp lý",
    title: "Chính sách bảo mật",
    intro: "Cách Dshare Quiz Online xử lý thông tin cần thiết để vận hành trải nghiệm học tập.",
    sections: [
      { title: "Thông tin được sử dụng", body: "Thông tin tài khoản và dữ liệu học tập được sử dụng để cung cấp chức năng, lưu tiến độ và cải thiện trải nghiệm trên nền tảng." },
      { title: "Bảo vệ dữ liệu", body: "Dshare áp dụng các biện pháp kỹ thuật phù hợp trong phạm vi hệ thống để bảo vệ dữ liệu và giới hạn quyền truy cập theo vai trò." },
      { title: "Quyền kiểm soát", body: "Bạn có thể xem và cập nhật thông tin hồ sơ của mình trong khu vực tài khoản. Với yêu cầu khác, hãy liên hệ đội ngũ hỗ trợ." },
    ],
  },
};

export default function Legal({ document }: { document: LegalDocument }) {
  const page = copy[document];
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main className="container py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">{page.eyebrow}</p><h1 className="mt-4 font-sans text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">{page.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">{page.intro}</p><div className="mt-10 space-y-4">{page.sections.map(section => <section key={section.title} className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6 sm:p-7"><h2 className="text-lg font-bold text-foreground">{section.title}</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{section.body}</p></section>)}</div></div></main></div>;
}
