# Authentication & Authorization Audit

## Phạm vi kiểm kê ban đầu

| Khu vực | Hiện trạng | Phân loại mục tiêu | Điểm cần chuẩn hóa |
|---|---|---|---|
| Route công khai | Trang chủ, bảng giá, pháp lý, hỗ trợ, catalog và Quiz công khai đã có route riêng | Public | Duy trì truy cập guest; Quiz private phải tiếp tục chỉ cho owner. |
| Route học viên | Hồ sơ, thông tin cá nhân, nhiệm vụ, thành tích, ví, giới thiệu, thanh toán, luyện tập, Quiz của tôi, Studio và AI | Authenticated + permission khi phù hợp | Chưa có metadata/route guard chung ở `App.tsx`; nhiều trang chỉ dựa vào tRPC protected sau khi đã render. |
| Route quản trị | Toàn bộ `/admin/*` và legacy `/quan-tri/*` | Admin | UI có kiểm tra role cục bộ; cần metadata route thống nhất, trong khi API admin đã dùng `adminProcedure`. |
| API tRPC | `protectedProcedure` trả UNAUTHORIZED; `adminProcedure` trả FORBIDDEN | Authenticated / Admin | Cần procedure permission dùng chung và guard ownership rõ ràng cho mọi thao tác tài nguyên theo ID. |
| Quyền nhóm/gói | Có `canCreateQuiz`, `canUseAi`, xuất dữ liệu, báo cáo và hỗ trợ | Permission theo gói | Cần ánh xạ tập trung từ permission nghiệp vụ sang kiểm tra hiện hữu, không phá vỡ quota/gói. |
| Ownership | Nhiều Creator procedure đã lọc `creatorUserId` hoặc `userId` | Owner | Một số thao tác attempt theo ID cần xác nhận owner ở server, không chỉ `protectedProcedure`. |

## Phát hiện ưu tiên

1. Người dùng hiện chỉ có role `user` hoặc `admin`; chưa có trạng thái tài khoản chuyên biệt. Cần thêm trạng thái server-side để từ chối tài khoản không hoạt động.
2. `App.tsx` chưa có route metadata/guard chung cho learner và admin routes. Guest có thể render trang cá nhân trước khi tRPC trả lỗi.
3. Cơ chế popup xác thực đang nằm trong Header. Cần tách thành Auth Gate dùng chung để route và hành động có thể mở chính popup đó, giữ `returnTo` an toàn.
4. `catalog.detail` đã bảo vệ Quiz private theo owner; Creator procedures chủ yếu đã dùng user ID từ context. Các procedure attempt cần bổ sung ownership khi lưu đáp án/sự kiện bảo mật.
5. `adminProcedure` đã bảo vệ API admin. Các route admin và các entry point frontend cần dùng chung policy để chống truy cập trực tiếp bằng URL.
