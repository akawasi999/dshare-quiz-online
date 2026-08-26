# Permission Matrix — Tóm tắt đặc tả

Nguồn: `QuizAI_Permission_System_Basic_Pro_Premium_Manus_Spec.docx` do người dùng cung cấp.

## Nguyên tắc triển khai

- Permission Registry và Plan-Permission Matrix là nguồn cấu hình trung tâm; không rải điều kiện tên gói trong giao diện.
- Quyền gồm `boolean`, `limit` và `quota`; override cá nhân có hạn dùng được ưu tiên hơn matrix gói.
- Backend phải xác thực các API có tính năng nâng cao. Frontend chỉ hiển thị trạng thái PermissionGuard/Locked Feature và CTA nâng cấp phù hợp.
- CPanel cần quản lý Registry, Plan Matrix, giới hạn/quota và audit log.

## Matrix mặc định cần seed

| Nhóm | Basic | Pro | Premium |
|---|---:|---:|---:|
| AI nhập chủ đề, tệp, YouTube | Khóa | Bật | Bật |
| AI câu tương tự, đáp án, dịch | Khóa | Khóa | Bật |
| Quiz riêng tư, tặng Zelly | Khóa | Bật | Bật |
| Lưu bảng tính, tiếp tục bài thi | Khóa | Khóa | Bật |
| Thống kê học sinh | Bật | Bật | Bật |
| Thống kê câu hỏi, tổng quan | Khóa | Khóa | Bật |
| Người dùng đồng thời | 10 | 200 | 200 |
| Bản đồ/dạng câu hỏi nâng cao | Giới hạn | Mở rộng | Không giới hạn thực tế |

## Xác minh trực quan

Permission Matrix hiển thị tại `/admin/users/groups` trong CPanel. Bố cục desktop có cột Basic (xám), PRO (turquoise) và PREMIUM (tím); từng hàng thể hiện trạng thái khóa/mở, tooltip mô tả và ô limit cho quyền có giới hạn.
