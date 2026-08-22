# Inventory Hoàn tất Semantic Token

## Mục tiêu

Đợt chuẩn hóa này chỉ thay đổi presentation layer. Các query, mutation, quyền, quota, thanh toán và luồng học tập giữ nguyên. Nguồn legacy hiện tập trung ở các utility màu Tailwind arbitrary, chủ yếu là navy, blue, muted blue, success/error và các surface cũ.

| Nhóm | Vị trí còn style legacy | Cách xử lý |
|---|---|---|
| Quản trị | User Management, Point, Báo lỗi, AI, Nhóm quyền, Random Quiz, Live Monitoring, Brand | Ánh xạ về `foreground`, `text-secondary`, `surface`, `muted`, `primary`, semantic state |
| Tài khoản/học viên | My Quizzes, Wallet, Top Up, Payment, Referral, Pricing, Practice, Result, Leaderboard | Giữ layout và hành vi, thay surface/chữ/CTA/trạng thái sang token |
| Studio/AI | Creator, Settings, Draft, Chat, Source History, Question tools | Giữ workspace và màu thông báo ngữ cảnh, chuẩn hóa nền/card/viền/text/focus |
| Compatibility | Hover/focus, legacy semantic colors, dark mode | Hoàn thiện lớp ánh xạ token để các module kế thừa render nhất quán trong khi refactor dần source |

## Kết luận kiểm kê

Các màu xuất hiện nhiều nhất là `#172554`, `#617786`, `#71838D`, `#EEF4FF`, `#065BE5`, `#2563EB`, `#7057E8` và các sắc độ semantic cũ. Chúng được gom vào nhóm token nền, chữ, primary/accent, success/warning/danger trong `client/src/index.css`. Việc chuẩn hóa sẽ kiểm chứng bằng hồi quy component, TypeScript, build production và ảnh responsive.
