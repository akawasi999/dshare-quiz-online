# Rà soát chất lượng route — 18/08/2026

## Phạm vi đã xác minh

Các route học viên gồm Trang chủ, Thư viện bộ đề, Bảng xếp hạng, Bảng giá, Hồ sơ, Ví Point, Giới thiệu bạn, Nạp Point, Luyện tập, chuẩn bị Quiz, Kết quả Quiz và trạng thái thanh toán đã được rà soát ở các ngữ cảnh tải/trống/lỗi phù hợp. Khu vực Dashboard quản trị cũng đã được kiểm tra trên màn hình nhỏ.

| Nhóm | Trạng thái xác minh | Điểm kiểm tra chính |
|---|---|---|
| Thư viện và xếp hạng | Hoàn tất | Tìm kiếm, bộ lọc, retry lỗi, empty state, `aria-pressed`. |
| Luyện tập và kết quả | Hoàn tất | Sáu dạng câu hỏi trong kiểm thử component; trạng thái không có câu cần ôn/kết quả; CTA quay lại. |
| Hồ sơ, Ví, Nạp Point | Hoàn tất | Tải, lỗi, trống, retry; quota tháng hiển thị tại hồ sơ. |
| Quiz và thanh toán | Hoàn tất | Chuẩn bị quiz, kết quả trống, trạng thái chờ webhook PayOS. |
| Admin | Hoàn tất cho responsive cơ bản | Dashboard hiển thị phù hợp trên mobile; endpoint quản trị vẫn được RBAC bảo vệ. |

## Kiểm thử tự động

`pnpm check` và `pnpm test` đang đạt. Bộ test có 31 tệp với 70 ca, bao phủ router quota, quy tắc quota UTC, trạng thái component Practice, Thư viện bộ đề, Bảng xếp hạng, Nạp Point và trợ lý AI.

## Phạm vi có chủ đích chưa mở rộng

Kiểm thử trình duyệt với người dùng thật chưa thực hiện theo chỉ đạo trước đó là bỏ qua kiểm thử thực tế. Các quyền lợi hiển thị nhưng chưa có mô-đun tương ứng — Phân tích Leads, Live Monitoring, hỗ trợ ưu tiên và tùy chỉnh thương hiệu — vẫn phải có feature gate riêng trước khi được công bố là chức năng vận hành.
