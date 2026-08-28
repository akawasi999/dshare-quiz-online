# Ghi chú đặc tả AI Quiz 3 Question Types

- Nguồn: `/home/ubuntu/upload/AI_Quiz_3_Question_Types_Spec.pdf`.
- Mục tiêu của tài liệu: AI Chat trong Quiz Studio phải tự khởi tạo nội dung để form bên trái hiển thị đúng **3 dạng giao diện** là **Nhận định Có/Không**, **Ghép nối**, và **Sắp xếp thứ tự**.
- Dữ liệu khởi tạo mong muốn:
  - **Nhận định Có/Không** dùng mảng `statements`, mỗi phần tử có `id`, `text`, `answer` (Có hoặc Không).
  - **Ghép nối** dùng mảng `pairs`, mỗi phần tử có `id`, `left`, `right`.
  - **Sắp xếp thứ tự** dùng mảng `steps` hoặc cấu trúc tương đương cho các bước tuần tự.
- Tool calling của AI cần hướng model tạo đúng mảng theo từng loại thay vì trả về cấu trúc mơ hồ.
- Phần hiển thị UI bên trái cần render riêng theo từng loại:
  - Nhận định Có/Không: bảng nhiều dòng với cột nội dung và lựa chọn Có/Không.
  - Ghép nối: cặp `left -> right`.
  - Sắp xếp thứ tự: danh sách các bước có đánh số.
- Kết quả đầu ra mong muốn: khi người dùng nhờ AI tạo câu hỏi thuộc một trong ba loại trên, dữ liệu AI trả về phải được ánh xạ trực tiếp sang cấu trúc Studio hiện có để giao diện hiển thị đúng ngay, không cần sửa tay thêm.
