# Đặc tả gói học Dshare

## Nguồn yêu cầu

Đặc tả này phản ánh bảng tham chiếu do chủ dự án cung cấp ngày 18/08/2026. Trong giao diện hiện tại, **Gói PRO ánh xạ hạng kỹ thuật `Pro`** và **Gói PREMIUM ánh xạ hạng kỹ thuật `Premium`**.

| Gói hiển thị | Hạng kỹ thuật | Giá/tháng | Giá lần mua đầu | Point khi kích hoạt | AI Credits | Lượt thi | Số Quiz |
|---|---:|---:|---:|---:|---:|---|---|
| Gói Miễn phí | `basic` | Miễn phí | Không áp dụng | 0 | 20 | 20/tháng | 2 |
| Gói PRO | `pro` | 50.000đ | 25.000đ | 150 | 40 | 40/tháng | 20 |
| Gói PREMIUM | `premium` | 100.000đ | 50.000đ | 1.000 | 50 | Vô hạn | 50 |

## Quyền lợi hiển thị

Phân tích, xuất báo cáo, upload câu hỏi bằng AI, Live Monitoring, hỗ trợ ưu tiên và tùy chỉnh thương hiệu hiện được ghi rõ là **chưa kích hoạt** trên bảng giá. Các quyền lợi này chỉ được công bố khi đã có mô-đun vận hành cùng feature gate tại máy chủ.

> Quota **lượt thi**, **số quiz tạo** và **AI Credits** đã được kiểm soát ở máy chủ theo chu kỳ tháng UTC. AI Credits được tính bằng số lần gọi trợ lý AI trong tháng, không trừ trực tiếp số dư Ví Point.

## Quy tắc PayOS

Hai gói thành viên áp dụng giảm 50% khi người học chưa có giao dịch `paid` trước đó **cho chính mã gói đó**. Point thưởng và quyền hạng chỉ được ghi nhận sau webhook PayOS vượt qua kiểm tra chữ ký, số tiền và mã đơn.
