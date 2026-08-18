# Phân tích file câu hỏi mẫu IC3GS6SPARKLV3GM1.docx

## Nguồn

- Tệp: `/home/ubuntu/upload/IC3GS6SPARKLV3GM1.docx`

## Nhận định cấu trúc ban đầu

Tài liệu chứa khoảng 30 câu hỏi tiếng Việt về kỹ năng số/công nghệ thông tin cơ bản.

Các nhóm định dạng quan sát được gồm:

1. **Câu 1–24**: phần lớn là câu **một đáp án đúng** với 4 lựa chọn.
2. **Câu 25, 27, 28, 29**: câu **ghép nối / matching**.
3. **Câu 26, 30**: câu dạng **Có / Không** cho nhiều phát biểu; có thể ánh xạ sang `true_false` nhiều dòng hoặc `matching` tùy thiết kế import.

## Phát hiện quan trọng

- Bản trích xuất văn bản hiện **không thể hiện đáp án đúng** dưới dạng đánh dấu rõ ràng.
- Khi xem trực quan các trang đầu, chưa thấy ký hiệu hiển nhiên như tô màu, gạch chân, dấu tick hoặc ký tự khác biệt đủ tin cậy để xác định đáp án đúng tự động.
- Vì vậy, tài liệu hiện **chưa đủ dữ liệu chắc chắn** để nhập an toàn vào Dshare nếu không có đáp án chuẩn hoặc quy ước đáp án từ người dùng.

## Hướng chuẩn hóa dự kiến

- Tách tài liệu thành các bản ghi câu hỏi theo định dạng import của Dshare.
- Gắn loại câu hỏi thành `single`, `matching`, và có thể `true_false` cho các bảng Có/Không.
- Chỉ nhập các câu khi xác định được đầy đủ: nội dung, loại câu, lựa chọn/cặp ghép, và **đáp án đúng**.

## Bước tiếp theo cần xác nhận

- Hỏi người dùng liệu file này có đáp án ở phần khác, hoặc có đáp án chuẩn riêng hay không.
- Nếu không có đáp án chuẩn, chỉ có thể dùng tài liệu này như **nguồn nội dung thô** để chuẩn hóa thủ công, chưa thể import trực tiếp cho kiểm thử chấm điểm.

## Bổ sung: File IC3_GS6_SPARK_LV2_TRAINING.docx

Tài liệu thứ hai là bộ bài luyện IC3 lớn hơn, gồm tối thiểu các phần `TRAINING 01` và `TRAINING 02`. Nó chứa câu một/nhiều đáp án, đúng/sai, ghép nối và điền lựa chọn.

Một số câu thể hiện đáp án bằng quy ước định dạng, ví dụ dấu `●` thay cho `○`, ô `☑` thay cho `□`, hoặc ký tự `x` trong bảng Đúng/Sai. Chẳng hạn trong phần `TRAINING 01`, câu 34 đánh dấu lựa chọn **Tác giả**, câu 36 đánh dấu **Google** và **Bing**. Điều này xác nhận tài liệu có thể chứa đáp án nhưng cần trích xuất cả cấu trúc/định dạng, không chỉ văn bản thuần.

Tuy nhiên, nhiều câu đầu vẫn dùng cùng ký hiệu bullet `•` cho toàn bộ lựa chọn; chưa thể coi toàn bộ đáp án là đã có đánh dấu rõ ràng nếu không tiếp tục đối chiếu định dạng trang và các phần tiếp theo.

Qua kiểm tra trực quan 5 trang đầu, quy ước nổi bật hơn là **đáp án đúng được in đậm** trong nhiều câu single/multiple. Ví dụ: câu 1 in đậm **Bộ nhớ**; câu 3 in đậm **Màn hình cảm ứng** và **Bút cảm ứng**; câu 6 in đậm phương án mô tả đúng dữ liệu di động; câu 16 dùng bảng với dấu `x` ở cột Đúng/Sai; câu 21 và 27 dùng mũi tên nối ghép; các câu 23–26 in đậm trực tiếp đáp án đúng. Như vậy, file thứ hai đủ cơ sở để trích xuất đáp án chuẩn nếu xử lý được thông tin định dạng.

## Phạm vi nội dung đã chuẩn hóa từ nguồn IC3

Từ `TRAINING 01 (OT426)`, đã xác định và chuẩn hóa 8 câu có đáp án rõ ràng để đại diện các dạng câu Dshare hỗ trợ: một đáp án, nhiều đáp án, đúng/sai, điền từ và ghép nối. Nội dung được đặt trong hệ phân cấp thực tế **Chứng chỉ IC3 → GS6 Spark → Training 01** và gắn với bộ đề công khai **IC3 GS6 Spark – Training 01**.

Nguồn đáp án được xác nhận trực tiếp từ quy ước in đậm/bảng dấu `x`/mũi tên của file `IC3_GS6_SPARK_LV2_TRAINING.docx`; không sử dụng dữ liệu bịa hoặc đáp án suy đoán.

## Kết quả đối chiếu với file mẫu đầu tiên

Hai tài liệu cùng chủ đề kỹ năng số nhưng **không phải cùng một bộ câu hỏi**. File mẫu đầu tiên gồm các câu về accessibility, quyền riêng tư, URL, công dân số và các cặp ghép khác; phần `TRAINING 01` của file thứ hai có hệ thống câu khác về bộ nhớ, lưu trữ đám mây, dấu chân số, phép xã giao số và duyệt web. Các chủ đề có giao nhau nhưng không tạo đủ tương ứng một–một để chuyển đáp án từ tài liệu thứ hai sang tài liệu mẫu đầu tiên.

Vì vậy, 8 câu đã nhập thuộc riêng `TRAINING 01` của file thứ hai. File mẫu đầu tiên vẫn cần **đáp án chuẩn riêng** hoặc xác nhận rõ từ người dùng trước khi nhập; không suy đoán đáp án cho mục đích chấm điểm.
