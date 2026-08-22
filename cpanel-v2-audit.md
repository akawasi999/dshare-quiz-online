# CPanel v2.0 — Inventory và lộ trình triển khai

## Phạm vi đối chiếu

Tài liệu `DShare_CPanel_Architecture_v2.0.docx` định vị khu vực quản trị như một **Learning Control Center** theo hướng SaaS/EdTech: ưu tiên dữ liệu học tập, phân biệt nghiêm ngặt Point và XP, điều hướng theo nhóm công việc, responsive và Dark Mode chính thức. Bản audit này chỉ ghi nhận chênh lệch với hệ thống hiện hữu; không thay đổi dữ liệu hay business logic trong phase phân tích.

| Miền kiến trúc v2.0 | Hiện trạng Dshare | Chênh lệch chính | Phase xử lý |
|---|---|---|---|
| Shell, token và Dark Mode | `DashboardLayout.tsx` có sidebar co giãn, mobile header, theme toggle; token hệ thống đã tồn tại | Thiếu header desktop, breadcrumb, Command Palette và semantic token CPanel riêng theo tài liệu | Phase 1 |
| Sidebar theo nhóm | Danh sách phẳng 14 mục quản trị | Thiếu nhóm Overview/Learning/Gamification/Users/Moderation/Analytics/System/Appearance, active indicator và route model v2 | Phase 1 |
| Dashboard | `AdminOperationsDashboard.tsx` có KPI, moderation, module shortcuts và dữ liệu thực | Cần cấu trúc Greeting → KPI → Learning Intelligence → Moderation → Gamification → Activity; không hiển thị XP giả lập khi chưa có dữ liệu | Phase 1 |
| Learning | Đã có nội dung bốn cấp, ngân hàng câu hỏi, tạo đề ngẫu nhiên, import/export | Thiếu route chuẩn v2, Quiz Management table và toolbar thống nhất | Phase 2 |
| User control | Đã có danh sách, lọc, phân trang, bulk action, drawer chi tiết và nhóm người dùng | Cần User 360, nhóm Permissions rõ ràng, page template thống nhất | Phase 2 |
| Gamification | Point ledger đã vận hành | XP, Mission, Achievement, Streak, leaderboard quản trị chưa có domain/UI tương ứng; Point và XP chưa thể hiện tách biệt xuyên suốt | Phase 3 |
| Moderation & Analytics | Báo lỗi, báo cáo vận hành, Live Monitoring, activity log, AI, Appearance đã có | Thiếu khu moderation/analytics theo route v2 và permission-aware action thống nhất | Phase 3 |
| Table/form/feedback standard | Nhiều panel có search, filter, empty/error/toast | Cần chuẩn hóa toolbar, column action, responsive table và destructive confirmation theo các màn ưu tiên | Phase 2–3 |

## Route mapping hiện có

| Route v2.0 | Đường dẫn/tính năng có thể kế thừa | Ghi chú |
|---|---|---|
| `/dashboard` | `/quan-tri` | Dashboard hiện hữu là nền tảng Phase 1 |
| `/learning/content` | `/quan-tri/noi-dung` | Cần alias và page header v2 |
| `/learning/questions` | `/quan-tri/cau-hoi` | Kế thừa question editor và AI generator |
| `/learning/random-generator` | `/quan-tri/tao-de-ngau-nhien` | Có sẵn |
| `/learning/import-export` | `/quan-tri/import-xuat` | Có sẵn |
| `/users` và `/users/groups` | `/quan-tri/nguoi-dung`, `/quan-tri/nhom-nguoi-dung` | Kế thừa mô-đun hiện hữu |
| `/gamification/points` | `/quan-tri/point` | Kế thừa sổ cái Point; không ánh xạ thành XP |
| `/moderation/errors` | `/quan-tri/bao-loi` | Kế thừa hàng đợi báo lỗi |
| `/analytics` | `/quan-tri/bao-cao` | Kế thừa biểu đồ và dashboard vận hành |
| `/system/monitoring`, `/system/logs`, `/system/ai`, `/appearance/theme` | `/quan-tri/live-monitoring`, `/quan-tri/nhat-ky`, `/quan-tri/ai-assistant`, `/quan-tri/thuong-hieu` | Kế thừa từng mô-đun hiện hữu |

## Lộ trình thực thi

### Phase 1 — CPanel shell và Learning Control Center

Phase đầu tiên tạo nền tảng nhìn thấy được: token CPanel scoped cho khu quản trị, sidebar phân nhóm v2 có trạng thái active và collapsed/mobile drawer, desktop header có breadcrumb + Command Palette, alias route cho các mô-đun hiện hữu, cùng dashboard tổ chức lại bằng dữ liệu thực. Không tạo hoặc giả lập số liệu XP ở phase này.

### Phase 2 — Learning và Users

Phase thứ hai chuẩn hóa page template, toolbar và table system cho nội dung, Quiz/đề thi, question bank, import/export, quản lý người dùng, nhóm người dùng và permission. Các action chỉ dùng API hiện có hoặc sẽ được bổ sung kèm schema/migration, procedure, UI và test đầy đủ.

### Phase 3 — Gamification, moderation, analytics và system

Phase thứ ba triển khai các domain chưa có hoặc thiếu: XP riêng với Point, missions/achievements/streak, moderation đa loại, analytics theo câu hỏi vận hành, hệ thống monitoring/logs/AI/settings và Appearance manager. Mọi domain mới đều cần migration, API, UI permission-aware và regression riêng.

## Quy tắc triển khai xuyên phase

Màu, spacing, radius và states phải dùng token; không thêm mã màu/radius rải rác vào panel. Desktop dùng sidebar 280px, tablet chuyển collapsed và mobile dùng drawer. Tất cả thao tác destructive phải có xác nhận; trạng thái loading/empty/error cần rõ ràng; keyboard focus và nhãn ARIA được giữ trong mọi control.

## Phase 1 đã hoàn tất — Shell và Learning Control Center

Phase 1 đã tạo lớp `.cpanel-v2` để scope token brand, surface, border, radius và Dark Mode theo tài liệu v2 mà không thay đổi token của không gian học viên. `DashboardLayout` nay có sidebar 280px được phân nhóm theo kiến trúc Overview, Learning, Gamification, Users, Moderation, Analytics, System và Appearance; có trạng thái active, desktop header, breadcrumb, Command Palette `Ctrl/Cmd + K`, responsive drawer và alias `/admin/*` cho các mô-đun đã tồn tại.

`AdminOperationsDashboard` được tổ chức lại thành Learning Control Center theo thứ tự greeting, KPI, Learning Intelligence, Moderation, Point Economy, Quick Actions và Recent Activity. Dashboard dùng dữ liệu thực hiện có; KPI Point và XP được tách rõ, đồng thời nêu minh bạch rằng XP, mission, streak và achievement chưa có domain dữ liệu nên không hiển thị số liệu thay thế.

Regression Phase 1: TypeScript sạch, **69 tệp / 174 ca kiểm thử** đạt, build production hoàn tất. Đã xác minh trực quan desktop 1440px và mobile 375px cho dashboard, đồng thời bổ sung hồi quy cho Command Palette và nguyên tắc hiển thị Point/XP.

## Phase 2 đã hoàn tất — Learning và Users

Mô-đun Nội dung đã chuyển sang page template CPanel v2 với page header, KPI cho bốn cấp nội dung, form tạo node theo ngữ cảnh, cây nội dung có trạng thái rỗng và luồng tạo Quiz kế thừa API hiện hữu. Mô-đun Người dùng được chuẩn hóa table system với toolbar search/filter/sort, bulk action, pagination, mobile row layout và User 360°. User 360° tiếp tục bảo toàn Quiz history, Point, hoạt động quản trị, đơn thanh toán và lịch sử gửi email; những domain XP/achievement/report chưa có dữ liệu được nêu rõ thay vì hiển thị số liệu giả.

Regression Phase 2: TypeScript sạch, **70 tệp / 175 ca kiểm thử** đạt, build production hoàn tất. Đã xác minh desktop 1440px và mobile 375px cho hai mô-đun trọng yếu.
