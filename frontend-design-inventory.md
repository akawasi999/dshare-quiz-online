# Frontend Design System Inventory

## Phạm vi và ràng buộc

Đợt nâng cấp này chỉ chạm vào **frontend presentation**: tokens, typography, spacing, component state và responsive. Các router tRPC, database schema, mutation, quyền truy cập và business logic được giữ nguyên. Inventory được lập từ route map, toàn bộ cây `client/src/pages`, `client/src/components`, thư viện `components/ui`, stylesheet toàn cục và các luồng có tác động thị giác lớn.

## Route và page

| Nhóm | Page | Vai trò UI | Ưu tiên nâng cấp |
|---|---|---|---|
| Public | `Home.tsx` | Landing page, hero, thư viện nổi bật, footer | P0 |
| Public | `Pricing.tsx`, `PaymentStatus.tsx` | Bảng giá và trạng thái thanh toán | P1 |
| Learner | `QuizLibrary.tsx` | Khám phá quiz, quota, filters, cards, empty/loading/error | P0 |
| Learner | `QuizRunner.tsx`, `QuizResult.tsx`, `Practice.tsx` | Luồng bắt đầu, làm bài, kết quả và luyện tập | P0 |
| Learner | `Profile.tsx`, `Wallet.tsx`, `TopUp.tsx`, `Referral.tsx` | Không gian tài khoản và Point | P1 |
| Learner | `Leaderboard.tsx`, `AIStudyAssistant.tsx` | Xếp hạng và trợ lý AI | P1 |
| Creator | `MyQuizzes.tsx`, `UserQuizCreator.tsx` | Danh sách quiz và Studio tạo quiz | P0 |
| Admin | `Admin.tsx` | Entry point cho dashboard và các mô-đun quản trị | P1 |
| Support | `NotFound.tsx`, `ComponentShowcase.tsx` | Trạng thái lỗi và thư viện tham chiếu | P2 |

## Component và layout dùng chung

| Nhóm | Thành phần | Nhận định inventory | Hướng refactor |
|---|---|---|---|
| Public shell | `SiteHeader`, `BrandLogo` | Nav desktop/mobile, account CTA, theme toggle; còn nhiều lớp màu trực tiếp | Token hóa surface, nav active, CTA, focus và menu mobile |
| Learner shell | `AccountLayout`, `AccountSidebar` | Wrapper account/sidebar ngắn, đang hard-code nền và active state | Dùng semantic surfaces, spacing và active state chung |
| Admin shell | `DashboardLayout`, `DashboardLayoutSkeleton` | Sidebar resizable, mobile topbar, stateful navigation | Chuẩn hóa sidebar state, skeleton và breakpoint |
| Cards | `QuizCard`, `Card` | Card list và card primitive cùng tồn tại nhưng radius/shadow chưa đồng nhất | Chuẩn hóa card surface/border/hover thông qua tokens |
| Form | `Button`, `Input`, `Textarea`, `Badge`, `Tabs`, `Dialog`, `Sonner` | Có focus state từ shadcn, nhưng kích thước/radius/color chưa bám đặc tả mới | Refactor primitives trước khi thay page-level class |
| Creator | `QuizStudioAiChat`, `QuizSettingsDrawer`, `QuestionEditorPanel`, `CoverImageCropper` | Nhiều surface controls và layout desktop đặc thù | Chỉ token hóa, không đổi workflow hay API |
| Admin modules | User/Group/Point/Report/AI/Monitoring panels | Nhiều data-dense panel và table/list | Chuẩn hóa empty/loading/error/table-mobile qua primitive/layout |

## Stylesheet và token hiện tại

| Khu vực | Hiện trạng | Rủi ro / cơ hội |
|---|---|---|
| `client/src/index.css` | Semantic shadcn tokens đã có nhưng sử dụng palette xanh cũ, nhiều override theo selector chuỗi class | Là điểm đặt design tokens mới duy nhất; cần giảm dần selector override toàn cục |
| Font | Import `Be Vietnam Pro`, `DM Mono`, `Playfair Display` nhưng runtime theme khai báo `Open Sans`/`Montserrat` | Mismatch font loading có thể gây fallback/layout shift; chuẩn hóa về Inter/system sans theo đặc tả |
| Color | Page/component dùng nhiều `#172554`, `#fff7e6`, `#eef4ff`, `#2563eb`, amber và direct classes | Cần map về CSS variables, giữ semantic states đúng ý nghĩa |
| Motion | Có animation Studio và `prefers-reduced-motion` | Giữ animation workflow hiện hữu, bổ sung motion token và giới hạn transition ngắn |
| Responsive | Tailwind breakpoint được dùng rải rác; mobile header/sidebar đã tồn tại | Cần kiểm thử 360/768/1024/1440 sau từng nhóm thay đổi |

## Phát hiện trước refactor

1. **Color drift:** các hard-code màu theo từng page làm background, border, hover và semantic states không nhất quán.
2. **Typography mismatch:** font được import khác font được khai báo ở theme; heading/body không có scale thống nhất toàn cục.
3. **Primitive inconsistency:** Button, Input, Card có nền tảng tốt nhưng height, radius, hover, focus và shadow chưa khớp cùng hệ thống.
4. **Global CSS override risk:** các selector `[class*="..."]` can thiệp rộng, làm khó kiểm soát state và dark mode; đợt này sẽ ưu tiên tokens semantic thay vì mở rộng override.
5. **Accessibility opportunities:** focus ring đã có ở UI primitives; page-level clickable areas, text-muted, disabled/loading và empty state cần được đồng bộ.

## Kế hoạch áp dụng không chạm business logic

1. Thiết lập token semantic mới ở `index.css`, đồng bộ font UI, spacing, radius, shadow, focus và reduced motion.
2. Refactor Button/Card/Input/Textarea/Badge/Tabs/Dialog/Toast trước để tạo layer dùng chung.
3. Cập nhật shells (`SiteHeader`, `AccountLayout`, `AccountSidebar`, `DashboardLayout`) và responsive navigation.
4. Áp dụng design system cho Home, Quiz Library, Quiz Runner/Result, Studio và admin dashboard theo ưu tiên.
5. Sau mỗi nhóm: chạy `pnpm check`, test liên quan, screenshots desktop/mobile; sau cùng chạy toàn bộ regression.
