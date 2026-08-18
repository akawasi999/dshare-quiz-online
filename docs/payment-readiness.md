# Phạm vi sẵn sàng cho nạp Point và PayOS

## Trạng thái hiện tại

Dshare hiện có **ví Point**, sổ cái giao dịch, hạng tài khoản và bảng `paymentRecords` để chuẩn bị cho giai đoạn thanh toán. Người học có thể xem số dư, nguồn biến động Point và quyền truy cập theo hạng. Chức năng tạo liên kết thanh toán, nhận webhook và đối soát giao dịch **chưa được bật**; mọi luồng trả phí hiện tại phải giữ ở trạng thái không thanh toán tự động.

| Thành phần | Trạng thái | Vai trò khi tích hợp sau |
|---|---:|---|
| `learnerProfiles.pointBalance` | Sẵn sàng | Số dư Point hiện tại của người học. |
| `walletTransactions` | Sẵn sàng | Sổ cái bất biến cho nạp tiền, phí quiz, thưởng và điều chỉnh. |
| `paymentRecords` | Sẵn sàng | Lưu mã giao dịch nhà cung cấp, số tiền, trạng thái và dữ liệu đối soát. |
| `accountTierValues` | Sẵn sàng | Phân biệt Basic, Pro và Premium để cấp quyền nội dung. |
| PayOS secret và webhook | Chưa cấu hình | Chỉ yêu cầu khi bắt đầu giai đoạn thanh toán. |

## Phạm vi triển khai ở giai đoạn PayOS

Luồng nạp Point sẽ bắt đầu từ một lựa chọn gói rõ ràng, tạo một `paymentRecord` ở trạng thái chờ, sau đó mới tạo liên kết thanh toán. Việc cộng Point hoặc thay đổi hạng tài khoản chỉ được thực hiện ở máy chủ sau khi webhook đã được xác thực, đối chiếu với bản ghi thanh toán và kiểm tra tính idempotent. Trình duyệt không được tự cộng Point dựa trên trang hoàn tất thanh toán hoặc tham số URL.

| Bước | Quy tắc bắt buộc | Kết quả mong đợi |
|---|---|---|
| Tạo đơn | Gắn người dùng, gói, số tiền và mã tham chiếu duy nhất. | Bản ghi chờ thanh toán. |
| Tạo liên kết | Dùng cấu hình máy chủ; không để lộ secret sang client. | Người học được chuyển tới trang thanh toán. |
| Nhận webhook | Xác minh chữ ký, tra cứu bản ghi, chống xử lý trùng. | Thanh toán được xác nhận đáng tin cậy. |
| Ghi nhận quyền lợi | Cập nhật số dư/hạng và ghi sổ cái trong cùng luồng máy chủ. | Point hoặc quyền truy cập được cấp đúng một lần. |
| Đối soát | Lưu trạng thái webhook, thời điểm và mã tham chiếu. | Admin có thể truy vết mọi biến động. |

## Điều kiện bắt đầu

Khi triển khai PayOS, cần có thông tin cấu hình của môi trường thanh toán và URL webhook HTTPS ổn định. Trước khi mở cho người học, cần bổ sung kiểm thử cho chữ ký webhook, đơn bị gửi lặp, trạng thái thất bại/hủy, hoàn tiền và chênh lệch giữa số tiền đơn hàng với thông báo nhận được. Giao diện nạp Point chỉ được bật sau khi các kiểm tra máy chủ này hoàn tất.
