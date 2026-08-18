# Đặc tả gói học Dshare

## Nguồn yêu cầu

Đặc tả này phản ánh bảng tham chiếu do chủ dự án cung cấp ngày 18/08/2026. Trong giao diện hiện tại, **Gói PRO ánh xạ hạng kỹ thuật `Pro`** và **Gói PREMIUM ánh xạ hạng kỹ thuật `Premium`**.

| Gói hiển thị | Hạng kỹ thuật | Giá/tháng | Giá lần mua đầu | Point khi kích hoạt | AI Credits | Lượt thi | Số Quiz |
|---|---:|---:|---:|---:|---:|---|---|
| Gói Miễn phí | `basic` | Miễn phí | Không áp dụng | 0 | 20 | 20/tháng | 2 |
| Gói PRO | `pro` | 50.000đ | 25.000đ | 150 | 200 | 40/tháng | 20 |
| Gói PREMIUM | `premium` | 100.000đ | 50.000đ | 1.000 | 500 | Vô hạn | 50 |

## Quyền lợi hiển thị

Gói PRO và Gói PREMIUM hiển thị quyền truy cập vào Phân tích Leads, tải báo cáo, upload câu hỏi bằng AI, Live Monitoring, hỗ trợ ưu tiên và tùy chỉnh thương hiệu. Gói Miễn phí hiển thị các quyền này là không bao gồm.

> Quota **lượt thi**, **số quiz tạo** và **AI Credits** đã được kiểm soát ở máy chủ theo chu kỳ tháng UTC. AI Credits được tính bằng số lần gọi trợ lý AI trong tháng, không trừ trực tiếp số dư Ví Point. Các quyền lợi còn lại trong bảng giá cần feature gate riêng trước khi được công bố là năng lực vận hành thực tế.

## Quy tắc PayOS

Hai gói thành viên áp dụng giảm 50% khi người học chưa có giao dịch `paid` trước đó **cho chính mã gói đó**. Point thưởng và quyền hạng chỉ được ghi nhận sau webhook PayOS vượt qua kiểm tra chữ ký, số tiền và mã đơn.
