# Ghi chú tích hợp PayOS từ tài liệu chính thức

Nguồn tham chiếu chính thức: [Bắt đầu](https://payos.vn/docs/), [API tạo liên kết thanh toán](https://payos.vn/docs/api/#tag/payment-request/operation/payment-request), [Webhook thanh toán](https://payos.vn/docs/du-lieu-tra-ve/webhook/) và [Kiểm tra dữ liệu với signature](https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/).

| Hạng mục | Điểm cần áp dụng cho Dshare |
|---|---|
| Tạo liên kết | PayOS công bố `POST /v2/payment-requests`; payload cơ bản có `orderCode`, `amount`, `description`, `cancelUrl` và `returnUrl`. Xác thực API dùng `x-client-id` và `x-api-key`. |
| Webhook | PayOS gửi `code`, `desc`, `success`, `data` và `signature`; endpoint merchant phản hồi mã 2XX khi đã nhận thành công. |
| Xác minh | Với payment requests, tài liệu nêu HMAC-SHA256 trên chuỗi `key=value` sắp xếp alphabet bằng checksum key của kênh thanh toán. Dữ liệu không qua xác minh chữ ký không được cấp Point hay quyền truy cập. |
| Điều kiện vận hành | Merchant cần tài khoản PayOS, xác thực tổ chức/cá nhân và một kênh thanh toán trên my.payos.vn trước khi nhận webhook production. |

> **Nguyên tắc Dshare:** `returnUrl` và `cancelUrl` chỉ dùng để hiển thị trạng thái cho người học. Chỉ webhook đã qua kiểm tra chữ ký, đối chiếu `orderCode`/số tiền và xử lý idempotent mới được ghi sổ cái, cộng Point hoặc thay đổi hạng tài khoản.
