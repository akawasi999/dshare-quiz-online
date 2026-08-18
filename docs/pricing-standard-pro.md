# Đặc tả gói học Dshare

## Nguồn yêu cầu

Đặc tả này phản ánh bảng tham chiếu do chủ dự án cung cấp ngày 18/08/2026. Trong giao diện tham chiếu, **Standard ánh xạ hạng kỹ thuật `Pro`** và **Gói PRO ánh xạ hạng kỹ thuật `Premium`**.

| Gói hiển thị | Hạng kỹ thuật | Giá/tháng | Giá lần mua đầu | Point khi kích hoạt | AI Credits | Lượt thi | Số Quiz |
|---|---:|---:|---:|---:|---:|---|---|
| Gói Miễn phí | `basic` | Miễn phí | Không áp dụng | 0 | 20 | 100/tháng | 5 |
| Standard | `pro` | 50.000đ | 25.000đ | 150 | 200 | Vô hạn | Vô hạn |
| Gói PRO | `premium` | 100.000đ | 50.000đ | 1.000 | 500 | Vô hạn | Vô hạn |

## Quyền lợi hiển thị

Standard và Gói PRO hiển thị quyền truy cập vào Phân tích Leads, tải báo cáo, upload câu hỏi bằng AI, Live Monitoring, hỗ trợ ưu tiên và tùy chỉnh thương hiệu. Gói Miễn phí hiển thị các quyền này là không bao gồm.

> Các quyền lợi trên được hiển thị trong bảng giá. Việc thực thi quota và feature gate riêng cần được triển khai trước khi công bố từng năng lực như một tính năng vận hành thực tế.

## Quy tắc PayOS

Hai gói thành viên áp dụng giảm 50% khi người học chưa có giao dịch `paid` trước đó **cho chính mã gói đó**. Point thưởng và quyền hạng chỉ được ghi nhận sau webhook PayOS vượt qua kiểm tra chữ ký, số tiền và mã đơn.
