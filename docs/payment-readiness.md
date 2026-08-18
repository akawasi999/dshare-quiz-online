# Phạm vi sẵn sàng cho nạp Point và PayOS

## Trạng thái hiện tại

Dshare hiện có **ví Point**, sổ cái giao dịch, hạng tài khoản và bảng `paymentRecords` mở rộng cho PayOS. Người học có thể chọn gói, tạo liên kết PayOS và xem trạng thái quay lại; Point hoặc quyền truy cập chỉ được thay đổi từ webhook đã xác minh, không từ trình duyệt.

| Thành phần | Trạng thái | Vai trò khi tích hợp sau |
|---|---:|---|
| `learnerProfiles.pointBalance` | Sẵn sàng | Số dư Point hiện tại của người học. |
| `walletTransactions` | Sẵn sàng | Sổ cái bất biến cho nạp tiền, phí quiz, thưởng và điều chỉnh. |
| `paymentRecords` | Sẵn sàng | Lưu mã giao dịch nhà cung cấp, số tiền, trạng thái và dữ liệu đối soát. |
| `accountTierValues` | Sẵn sàng | Phân biệt Basic, Pro và Premium để cấp quyền nội dung. |
| PayOS secret và webhook | Đã tích hợp | Khóa ở máy chủ; webhook xác minh chữ ký và xử lý idempotent. |

## Cấu hình PayOS đã triển khai

Endpoint cần khai báo tại kênh thanh toán PayOS là:

```
https://<ten-mien-da-xuat-ban>/api/payments/payos/webhook
```

Khi xuất bản, thay `<ten-mien-da-xuat-ban>` bằng tên miền HTTPS thực tế của Dshare. Không sử dụng URL preview tạm thời làm webhook production. `returnUrl` và `cancelUrl` được tạo tự động tại `/thanh-toan`; chúng chỉ hiển thị trạng thái, còn webhook là nguồn duy nhất có quyền ghi sổ cái Point và thay đổi hạng.

| Danh mục | Giá sau ưu đãi lần đầu | Giá thông thường | Quyền lợi khi webhook thành công |
|---|---:|---:|---|
| 150 Point | 30.000đ | 30.000đ | +150 Point |
| 250 Point | 47.000đ | 47.000đ | +250 Point |
| 500 Point | 89.000đ | 89.000đ | +500 Point |
| 1.000 Point | 169.000đ | 169.000đ | +1.000 Point |
| Gói PRO, 1 tháng | 25.000đ | 50.000đ | Hạng Pro 1 tháng, +150 Point |
| Gói PREMIUM, 1 tháng | 50.000đ | 100.000đ | Hạng Premium 1 tháng, +1.000 Point |

> Giảm giá 50% được kiểm tra dựa trên giao dịch PayOS đã thanh toán thành công của chính mã gói; giao dịch hủy, lỗi hoặc đang chờ không làm mất quyền ưu đãi.

## Luồng PayOS

Luồng nạp Point sẽ bắt đầu từ một lựa chọn gói rõ ràng, tạo một `paymentRecord` ở trạng thái chờ, sau đó mới tạo liên kết thanh toán. Việc cộng Point hoặc thay đổi hạng tài khoản chỉ được thực hiện ở máy chủ sau khi webhook đã được xác thực, đối chiếu với bản ghi thanh toán và kiểm tra tính idempotent. Trình duyệt không được tự cộng Point dựa trên trang hoàn tất thanh toán hoặc tham số URL.

| Bước | Quy tắc bắt buộc | Kết quả mong đợi |
|---|---|---|
| Tạo đơn | Gắn người dùng, gói, số tiền và mã tham chiếu duy nhất. | Bản ghi chờ thanh toán. |
| Tạo liên kết | Dùng cấu hình máy chủ; không để lộ secret sang client. | Người học được chuyển tới trang thanh toán. |
| Nhận webhook | Xác minh chữ ký, tra cứu bản ghi, chống xử lý trùng. | Thanh toán được xác nhận đáng tin cậy. |
| Ghi nhận quyền lợi | Cập nhật số dư/hạng và ghi sổ cái trong cùng luồng máy chủ. | Point hoặc quyền truy cập được cấp đúng một lần. |
| Đối soát | Lưu trạng thái webhook, thời điểm và mã tham chiếu. | Admin có thể truy vết mọi biến động. |

## Điều kiện bắt đầu

Trước khi mở cho người học, đăng ký URL webhook HTTPS ổn định trong dashboard PayOS, tạo thử một đơn giá trị nhỏ và xác nhận HTTP 2XX. Sau đó đối chiếu đúng một dòng `walletTransactions`/một cập nhật hạng cho mỗi `paymentRecords`. Kiểm thử tự động đã bao phủ chữ ký, đơn vị tiền tệ, số tiền, mã đơn, chính sách ưu đãi và trạng thái webhook; thử nghiệm production vẫn cần thực hiện với webhook từ PayOS thật.
