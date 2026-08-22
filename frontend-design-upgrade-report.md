# Báo cáo nâng cấp Frontend Design System

## Phạm vi đã triển khai

Đợt nâng cấp chỉ thay đổi presentation layer. Không có chỉnh sửa nào với tRPC procedure, database schema, quyền truy cập, quota, mutation hay business logic. Hệ thống token mới được thiết lập tại `client/src/index.css` với palette Primary `#635BFF`, Accent `#7C5CFC`, semantic success/warning/danger, surface/background/border, spacing, radius, shadow và motion token.

Typography đã được đồng bộ về Inter qua `client/index.html` và CSS foundation. Các primitive Button, Card, Input, Textarea, Badge, Tabs, Toast cùng shell `SiteHeader`, `AccountLayout`, `AccountSidebar` đã được refactor để sử dụng state focus, disabled, semantic color và touch target nhất quán.

| Nhóm | File trọng yếu | Kết quả |
|---|---|---|
| Foundation | `client/index.html`, `client/src/index.css` | Token, typography, spacing, focus-visible, reduced-motion, CTA gradient |
| Primitives | `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `badge.tsx`, `tabs.tsx`, `sonner.tsx` | State component đồng nhất, touch target tối thiểu 44px ở control chính |
| Navigation | `SiteHeader.tsx`, `AccountLayout.tsx`, `AccountSidebar.tsx` | Surface semantic, nav active, menu mobile accessible, CTA thống nhất |
| Public/Learner | `Home.tsx`, `QuizCard.tsx`, `QuizLibrary.tsx`, `QuizRunner.tsx` | Hero, thư viện, card quiz, quota/filter, progress và phản hồi Quiz được làm mới theo token |
| Account/Admin | `Profile.tsx`, `AdminOperationsDashboard.tsx` | Surface, semantic state, KPI, panel tài khoản và dashboard vận hành dùng token thống nhất |
| Interaction | `QuizCard.tsx`, `QuizRunner.tsx`, `index.css` | Hover nhẹ, skeleton ảnh, reduced-motion, thanh tiến trình có ARIA và phản hồi đúng/sai trong Sandbox |
| Regression | `server/designSystemPrimitives.component.test.tsx` | Bổ sung 2 ca kiểm thử token và primitive |

## Xác minh hiện tại

Toàn bộ TypeScript sạch. Hồi quy toàn dự án hiện đạt **64 tệp / 167 ca** và `pnpm build` đã hoàn tất thành công. Kiểm tra trực quan tại desktop 1440px, tablet 768px và mobile 375px xác nhận Home, Quiz Library, Profile và Dashboard quản trị giữ bố cục, CTA, card grid và thứ bậc nội dung phù hợp với breakpoint. Thanh tiến trình Quiz Runner có `role="progressbar"` và thuộc tính ARIA; phản hồi đúng/sai chỉ hiển thị đáp án đúng ở Sandbox/demo để không làm lộ kết quả trong lượt làm thật.

## Lưu ý kỹ thuật

Quét source cho thấy còn **202** biểu thức mã màu trực tiếp trong **35** file, chủ yếu nằm ở các panel quản trị, AI, quản lý thành viên và trang tài khoản chuyên sâu. Chúng đã nhận typography, primitive, surface và navigation mới thông qua layer dùng chung; việc token hóa tuyệt đối từng class cũ trong các module này nên được thực hiện như một đợt visual cleanup riêng để giảm rủi ro trên các màn vận hành dày dữ liệu.

## Cập nhật tương tác và đồng bộ admin

Lớp tương thích semantic token đã được áp dụng cho các panel quản trị kế thừa, trong đó có Quản lý người dùng, Point, báo lỗi và AI Assistant; các surface, chữ, viền, trạng thái thành công/lỗi và nền panel nay bám theo token chung. Desktop và mobile xác nhận bảng người dùng giữ được thứ bậc rõ ràng, các bộ lọc xếp dọc hợp lý trên màn hẹp.

Trang chủ hiện có vùng khám phá Quiz với tìm kiếm, lọc theo chủ đề và sắp xếp theo mới công bố, lượt làm hoặc phần thưởng. Quiz Runner bổ sung chuyển cảnh opacity/transform giữa câu hỏi; animation tự tắt theo `prefers-reduced-motion`, không thay đổi timer, lưu đáp án hay chấm điểm.

## Hoàn tất coverage semantic token

Inventory `frontend-token-completion-audit.md` đã phân loại toàn bộ nhóm style legacy còn lại. Lớp compatibility trong `index.css` hiện ánh xạ palette legacy của quản trị, tài khoản, studio và học viên về semantic token cho foreground, secondary/muted text, surface, border, primary/accent và success/warning/danger; đồng thời bao phủ hover, focus-visible và motion Studio.

Xác minh trực quan tại 1440px và 375px trên Quản lý người dùng, Sổ cái Point, Báo lỗi, AI Assistant, Hồ sơ, Ví Point, Bảng giá và Thư viện Quiz cho thấy surface, hệ chữ, nút và trạng thái semantic đồng nhất. Trên mobile, các bộ lọc Quản lý người dùng xếp theo cột, phần quản lý Point và AI giữ khoảng chạm rõ ràng, còn thẻ tài khoản/bảng giá/thư viện giữ nhịp dọc không gây tràn ngang.
