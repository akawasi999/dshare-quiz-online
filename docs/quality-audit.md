# Quality Audit — Dshare Quiz Online

> **Phạm vi audit:** trải nghiệm hiển thị, phản hồi trạng thái và hồi quy tự động của các route đã triển khai. Kiểm thử end-to-end với người dùng thật hoặc giao dịch PayOS thật vẫn không thuộc phạm vi, theo chỉ đạo đã xác nhận.

## Tiêu chí áp dụng

Mỗi route có dữ liệu động phải thể hiện ít nhất một trạng thái tải, không có dữ liệu hoặc lỗi phù hợp với ngữ cảnh. Những thao tác ghi dữ liệu phải khóa nút trong lúc gửi khi cần thiết, công bố thành công/thất bại rõ ràng và làm mới dữ liệu liên quan sau khi thành công. Các trang có hành động cần được vận hành bằng bàn phím và các trạng thái quan trọng dùng `role="status"`, `role="alert"` hoặc nhãn mô tả tương ứng.

## Coverage theo route

| Nhóm route | Route hoặc màn hình | Tải / trống / lỗi | Điều hướng và khả năng truy cập |
|---|---|---|---|
| Công khai | `/` Trang chủ | Catalog lỗi có cảnh báo và nút **Thử lại**; tìm kiếm không có kết quả có nút đặt lại. | CTA đi tới thư viện, hồ sơ và bảng giá; nút là phần tử tương tác có nhãn rõ. |
| Công khai | `/bang-gia` | Dữ liệu gói là catalog hiển thị ổn định; luồng chọn gói dẫn tới nạp Point. | Card gói, CTA và liên kết điều hướng có thể focus. |
| Thư viện | `/kham-pha` | Skeleton/tải, trạng thái danh mục trống, lỗi catalog có retry. | Tìm kiếm, lọc, chip phạm vi và sidebar tài khoản dùng nhãn phù hợp. |
| Làm bài | `/quiz/:id` | Truy vấn chi tiết có trạng thái tải; lỗi catalog có cảnh báo, **Thử lại** và lối ra thư viện; nút bắt đầu có pending. | Đồng hồ, lưới câu hỏi, nộp bài và guard phiên có trạng thái rõ ràng. |
| Kết quả & luyện tập | `/ket-qua/:id`, `/luyen-tap` | Không có dữ liệu/kết quả, lỗi mutation và hoàn tất luyện tập đều có phản hồi riêng. | CTA quay lại, làm thêm và xem thư viện đã được kiểm thử component. |
| Tài khoản | `/ho-so`, `/vi`, `/gioi-thieu`, `/nap-point`, `/tao-quiz` | Hồ sơ, ví, referral, catalog nạp Point, danh sách quiz riêng và quota có tải/trống/lỗi; các truy vấn lỗi có thể retry. | Toàn bộ route dùng `AccountLayout`/sidebar chung ở desktop; menu mobile mở qua header. |
| Thanh toán | `/thanh-toan` | Mã đơn thiếu/không hợp lệ có trang giải thích; lỗi tra cứu có cảnh báo và **Thử lại**; đơn pending tự làm mới. | CTA trở lại nạp Point hoặc mở ví tùy trạng thái đơn. |
| Xếp hạng | `/bang-xep-hang` | Tải catalog/bảng xếp hạng, không có dữ liệu và retry lỗi. | Phạm vi xếp hạng biểu đạt bằng `aria-pressed`; sidebar nhất quán. |
| Quản trị | `/quan-tri/*` | Các panel hiện có tải/trống/lỗi theo truy vấn; mutation cốt lõi báo toast thành công hoặc thất bại. | RBAC chặn non-admin; DashboardLayout cung cấp lối ra và điều hướng mô-đun. |

## Coverage theo mutation

| Miền chức năng | Mutation | Phản hồi giao diện đã có |
|---|---|---|
| Hồ sơ | `learner.updateProfile` | Khóa nút khi lưu, toast thành công/lỗi, refetch summary. |
| Referral | `learner.applyReferralCode` | Toast thành công/lỗi, làm mới mã và lịch sử referral. |
| Thanh toán | `payment.createLink` | Chuyển tiếp sau khi tạo link; lỗi được công bố; trạng thái đơn có retry riêng. |
| Kết quả | `discussion.create`, `reports.submit` | Thành công/thất bại hiển thị bằng phản hồi cục bộ/toast; chỉ mở sau điều kiện nghiệp vụ. |
| Làm bài | `quiz.start`, `quiz.saveAnswer`, `quiz.submit`, `quiz.securityEvent` | Pending ở bước bắt đầu/nộp, thông báo khi nộp thất bại và bảo vệ phiên. |
| Creator | `creator.createQuiz` | Pending, toast thành công/lỗi và làm mới danh sách quiz riêng. |
| Quản trị nội dung | `saveContentNode`, `saveQuiz`, `saveQuestion`, `importQuestions` | Toast thành công/lỗi; truy vấn cây nội dung được làm mới sau khi ghi thành công. |
| Quản trị người dùng | `updateUserTier`, `updateUserStatus`, `adjustPoints` | Toast thành công/lỗi và refetch danh sách người dùng. |
| Quản trị kiểm duyệt | `reviewReport` | Toast thành công/lỗi và refetch báo lỗi/tổng quan. |
| AI | Trợ lý AI và tạo câu hỏi AI | Pending, kiểm tra quota, phản hồi lỗi đầu ra và preview trước khi duyệt lưu. |

## Kiểm thử tự động và xác minh hiển thị

`pnpm check` hoàn tất không có lỗi TypeScript. `pnpm test` đạt **40 tệp test, 83 ca test**, bao phủ logic quota, PayOS mô phỏng/idempotency, quyền admin, ngân hàng câu hỏi, Practice sáu dạng câu hỏi, sidebar/các route học viên và các regression cho lỗi catalog trang chủ, tra cứu/tạo liên kết thanh toán, lưu hồ sơ, áp dụng referral, đăng thảo luận, gửi báo lỗi câu hỏi, thay đổi hạng thành viên, chi tiết bộ đề và danh sách quiz riêng.

Xác minh preview đã được thực hiện ở desktop và mobile đối với các route trọng yếu sau: Trang chủ, Hồ sơ, Thư viện, Ví Point, Referral, Nạp Point, thanh toán và menu tài khoản. Mục tiêu của bước này là phát hiện lỗi bố cục hoặc header/sidebar lặp; nó không thay thế kiểm thử end-to-end với dữ liệu thật.

## Ranh giới đã xác nhận

Giao dịch PayOS thật, đăng ký webhook production và thử nghiệm với người dùng thật không được thực hiện trong phạm vi dự án hiện tại. Các kết quả thanh toán trong test là mô phỏng, với kiểm tra chữ ký, idempotency, sổ cái Point và cập nhật tier ở tầng máy chủ. Nội dung IC3 ngoài bộ Training 01 tiếp tục ở trạng thái tạm dừng import theo chỉ đạo.
