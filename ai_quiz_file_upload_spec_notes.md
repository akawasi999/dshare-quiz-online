# AI Quiz File Upload — Ghi chú triển khai

Nguồn: `AI_Quiz_File_Upload_Spec.pdf` do người dùng cung cấp, trang 1–5.

## Mục tiêu

- Hỗ trợ tải `.docx`, `.pdf`, `.pptx` và `.txt` từ Quiz Studio để AI trích xuất toàn bộ văn bản, tóm lược trong giới hạn an toàn, rồi sinh câu hỏi có cấu trúc.
- Cung cấp API tại `/api/generate-from-file` và Modal kéo-thả/chọn tệp với bộ đếm số câu hỏi.
- Đưa kết quả vào Studio ngay, hỗ trợ các giao diện Trắc nghiệm, Nhận định Có/Không, Ghép nối và Sắp xếp.

## Quyết định tương thích kiến trúc Dshare

- Dự án Express + tRPC, không dùng Next.js Route Handler của ví dụ. Endpoint Express sẽ triển khai đúng đường dẫn `/api/generate-from-file`; Modal sẽ gọi mutation tRPC dùng cùng service để giữ hợp đồng giao tiếp hiện có.
- Tái sử dụng quota AI, kiểm tra quyền, lưu trữ S3, giới hạn 15 MB và `invokeLLM` phía máy chủ. Không để API key hay xử lý AI ở trình duyệt.
- `pdf-parse` và `mammoth` đã hiện diện. Cài thêm `officeparser` để lấy văn bản từ `.pptx`; `.txt` được giải mã UTF-8 sau khi kiểm tra MIME/đuôi tệp.
- Chuẩn hóa đầu ra về `QuizQuestion` canonical: `single` qua `options`, `true_false_statements` qua `answerConfig.statements`, `matching` qua `answerConfig.pairs`, `ordering` qua `answerConfig.orderingItems`.

## Hành vi Modal

- Nhận kéo-thả hoặc chọn tệp, hiển thị tên/kích thước/tình trạng, giới hạn số câu 1–20 và lỗi định dạng/dung lượng rõ ràng.
- Trong lúc AI xử lý, vô hiệu hóa các thao tác gửi lặp và thông báo tiến trình. Khi thành công, thêm câu hỏi hợp lệ vào Studio và đóng Modal; khi lỗi, giữ tệp để người dùng thử lại hoặc đổi tệp.
