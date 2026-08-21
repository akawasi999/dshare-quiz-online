# Báo cáo nâng cấp Frontend Design System

## Phạm vi đã triển khai

Đợt nâng cấp chỉ thay đổi presentation layer. Không có chỉnh sửa nào với tRPC procedure, database schema, quyền truy cập, quota, mutation hay business logic. Hệ thống token mới được thiết lập tại `client/src/index.css` với palette Primary `#635BFF`, Accent `#7C5CFC`, semantic success/warning/danger, surface/background/border, spacing, radius, shadow và motion token.

Typography đã được đồng bộ về Inter qua `client/index.html` và CSS foundation. Các primitive Button, Card, Input, Textarea, Badge, Tabs, Toast cùng shell `SiteHeader`, `AccountLayout`, `AccountSidebar` đã được refactor để sử dụng state focus, disabled, semantic color và touch target nhất quán.

| Nhóm | File trọng yếu | Kết quả |
|---|---|---|
| Foundation | `client/index.html`, `client/src/index.css` | Token, typography, spacing, focus-visible, reduced-motion, CTA gradient |
| Primitives | `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `badge.tsx`, `tabs.tsx`, `sonner.tsx` | State component đồng nhất, touch target tối thiểu 44px ở control chính |
| Navigation | `SiteHeader.tsx`, `AccountLayout.tsx`, `AccountSidebar.tsx` | Surface semantic, nav active, menu mobile accessible, CTA thống nhất |
| Public/Learner | `Home.tsx`, `QuizCard.tsx`, `QuizLibrary.tsx`, `QuizRunner.tsx` | Hero, thư viện, card quiz, quota/filter và luồng Quiz được làm mới theo token |
| Regression | `server/designSystemPrimitives.component.test.tsx` | Bổ sung 2 ca kiểm thử token và primitive |

## Xác minh hiện tại

Toàn bộ TypeScript sạch. Hồi quy toàn dự án hiện đạt **64 tệp / 167 ca** và `pnpm build` đã hoàn tất thành công. Các ảnh kiểm tra tại desktop 1440px, tablet 768px và mobile 375px xác nhận Home, Quiz Library và Quiz Runner giữ bố cục, CTA và card grid phù hợp với breakpoint. Việc mở `/quiz/101` trên môi trường kiểm tra trả về `404 Không tìm thấy bộ đề` từ dữ liệu server cho ID này; đây là dữ liệu route không tồn tại, không phải lỗi presentation layer.

## Lưu ý kỹ thuật

Quét source cho thấy còn **202** biểu thức mã màu trực tiếp trong **35** file, chủ yếu nằm ở các panel quản trị, AI, quản lý thành viên và trang tài khoản chuyên sâu. Chúng đã nhận typography, primitive, surface và navigation mới thông qua layer dùng chung; việc token hóa tuyệt đối từng class cũ trong các module này nên được thực hiện như một đợt visual cleanup riêng để giảm rủi ro trên các màn vận hành dày dữ liệu.
