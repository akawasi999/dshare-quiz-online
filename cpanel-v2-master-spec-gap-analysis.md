# Ma trận chênh lệch — DShare CPanel v2.0 Master Specification

## Kết luận audit

Đặc tả mới thay đổi kiến trúc Learning theo hướng **rút gọn phân hệ nhưng tăng chiều sâu vận hành**. CPanel hiện có shell, sidebar nhóm, command palette, Users, Point, Analytics, Monitoring, AI và Appearance ở mức nền tảng; tuy nhiên Learning vẫn vận hành theo mô hình cũ **Nội dung → Ngân hàng câu hỏi → Tạo đề ngẫu nhiên → Import/Export**. Vì vậy, triển khai cần ưu tiên chuyển đổi có tương thích: không xóa dữ liệu cũ đang được Quiz/attempt sử dụng, nhưng gỡ các điểm truy cập CPanel cũ và xây Topic/Quiz System mới bên trên schema an toàn.

| Hạng mục đặc tả | Hiện trạng xác minh | Chênh lệch | Quyết định triển khai |
|---|---|---|---|
| Learning IA | Sidebar và route vẫn có Nội dung, Ngân hàng câu hỏi, Tạo đề ngẫu nhiên, Import/Export | Không đúng mô hình Learning hai phân hệ | Chuyển sidebar, command palette, route chính và quick action về **Chủ đề** + **Quiz System**; redirect URL cũ về điểm đến an toàn |
| Topic tree | Có `categories`, `subjects`, `lessons` ba cấp cố định | Không có self-reference, path, depth, status, soft delete, version | Thêm bảng `topics` phân cấp cha–con với lifecycle và audit |
| Quiz taxonomy/lifecycle | `quizzes` bắt buộc `lessonId`, chỉ có `isPublished`; creator hiện hữu | Thiếu topic, author độc lập, status, publishedAt, lock, delete/version | Mở rộng `quizzes` tương thích để dùng `topicId`, `authorId`, lifecycle fields; giữ `lessonId` dữ liệu cũ nullable trong giai đoạn chuyển đổi |
| Quiz list | Có catalog/bộ đề và creator riêng, chưa có admin list contract 20 item | Thiếu pagination cố định, URL state, filter/sort, cột workflow | Bổ sung procedure admin `topicSystem` và `quizSystem` theo pagination 20 item/trang |
| Câu hỏi | Có `questions` toàn cục và liên kết `quizQuestions` | Spec không cho Question Bank xuất hiện trong Learning | Giữ dữ liệu/quan hệ hiện hữu nhưng chỉ quản trị câu hỏi từ Quiz Editor/Quiz detail; gỡ route UI cũ |
| Mutation safety | Audit log chỉ có metadata, không có version/idempotency | Thiếu before/after, reason, optimistic locking | Mở rộng audit metadata chuẩn hóa và thêm version cho Topic/Quiz; idempotency/outbox là P2 sau khi P0/P1 dữ liệu ổn định |
| Dashboard/analytics | Đã có Learning Intelligence và charts nền tảng | KPI/quick action còn tham chiếu nội dung bốn cấp | Chuyển KPI sang Topic/Quiz, giữ dữ liệu thật và nêu rõ telemetry/XP chưa có domain |
| Users, groups, Point, moderation, system | Đã có panel chức năng nền | Cần thêm depth, workflow/audit/export thực | Triển khai theo phase sau Learning core, không làm giả số liệu telemetry/XP |

## Quy tắc tương thích và an toàn

Migration không xóa `categories`, `subjects`, `lessons`, `questions`, `quizQuestions` hoặc lịch sử attempts. Các Quiz cũ vẫn đọc được trong learner flow; cột `lessonId` chỉ được chuyển từ bắt buộc sang nullable để Quiz mới có thể theo Topic taxonomy. Dữ liệu mapping cũ sang Topic chỉ thực hiện khi có quy tắc nghiệp vụ xác nhận, không tự gán Quiz vào một Topic mặc định.

## Phạm vi P0 bắt đầu ngay

P0 gồm navigation/route Learning mới, schema Topic và lifecycle Quiz, procedure tree/list cơ bản, Topic CRUD có chống cycle, Quiz list 20 item/trang với URL state, thao tác Draft/Publish/Lock/Archive có audit và các trạng thái UX bắt buộc. Các migration được áp dụng theo thứ tự dependency và có test riêng trước khi loại bỏ các đường dẫn CPanel cũ.
