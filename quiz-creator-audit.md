# Báo cáo Audit — Trang Tạo Quiz

**Phạm vi rà soát:** UI Studio Tạo Quiz, component chat AI, API tRPC `creator`, validator xuất bản, schema Quiz/Câu hỏi và luồng làm bài của học viên. Báo cáo này phản ánh mã nguồn hiện tại trước khi triển khai bổ sung.

## Kết luận nhanh

Studio đã có nền tảng tốt cho việc tạo, tự lưu và xuất bản Quiz. Các luồng quan trọng như tạo câu hỏi thủ công, AI chat, nhập tài liệu, lưu nháp máy chủ, lịch sử phiên bản và ghi Quiz xuống cơ sở dữ liệu đều đã tồn tại. Tuy nhiên, một số control hiện chỉ là giao diện hoặc chỉ lưu trong state cục bộ; đặc biệt là media, xem trước, cài đặt riêng tư/xáo trộn/số lần làm và một số thao tác toolbar.

| Nhóm | Trạng thái | Đánh giá |
|---|---:|---|
| Câu hỏi thủ công và AI | Có nền tảng | Cần đồng bộ validation và hoàn thiện kéo-thả/toolbar |
| Media | Thiếu kết nối | API ảnh bìa có sẵn nhưng UI chưa dùng; không có audio/video |
| Cấu hình Quiz | Một phần | Nhiều toggle chưa đi đến runtime người học |
| Dữ liệu nháp và xuất bản | Hoạt động | Cần thêm preview, luồng trạng thái và điều hướng sau xuất bản |
| Chất lượng mã | Cần dọn dẹp | Có JSX không thể chạy sau `return` trong `CompactQuestionRail` |

## 1. Các phần đã hoạt động và đã kết nối

| Luồng | Hiện trạng | Bằng chứng kỹ thuật |
|---|---|---|
| Thêm, nhân bản, xóa câu hỏi | Hoạt động | State `questions`; handler thêm/nhân bản/xóa; API lưu lúc xuất bản |
| Các dạng câu hỏi | Hoạt động cơ bản | Một đáp án, nhiều đáp án, đúng/sai, điền từ, ghép nối và tự luận có state/UI soạn trong editor thường |
| Đáp án đúng, lời giải, độ khó, điểm | Hoạt động | `QuestionCard` cập nhật option, explanation, difficulty, points; backend lưu `quizQuestions.points` |
| Thời lượng Quiz | Hoạt động | `durationMinutes` chuyển thành `durationSeconds`; Quiz Runner dùng `response.quiz.durationSeconds` để đếm giờ |
| Lưu nháp | Hoạt động | Tự lưu sau 5 giây lên localStorage và `creator.saveDraft`; có trạng thái lưu và lịch sử tối đa 20 phiên bản |
| Khôi phục nháp | Hoạt động | `listDraftVersions` và `restoreDraftVersion` có kiểm soát theo chủ sở hữu |
| Xuất bản vào cơ sở dữ liệu | Hoạt động | `createQuiz`/`updateQuiz` validate dữ liệu, kiểm tra quota/quyền, ghi Quiz/câu hỏi/đáp án |
| AI Studio | Hoạt động | Chat AI, tệp PDF/Word, Excel, URL web/YouTube có mutation, quota và toast lỗi/thành công |
| Liên kết chia sẻ | Hoạt động | QR, sao chép link, Facebook, Zalo và Email sau xuất bản |

## 2. Chức năng cần hoàn thiện hoặc chưa nối API

### A. Luồng tạo và quản lý câu hỏi

| Mức ưu tiên | Vị trí | Phát hiện audit | Cần hoàn thiện |
|---:|---|---|---|
| P0 | `questionError()` ở Studio | Validation phía client chỉ kiểm tra prompt và nhóm trắc nghiệm cơ bản. Nó không kiểm tra điền từ, ghép nối, tự luận; câu nhiều đáp án cũng không bắt buộc 2 đáp án đúng như backend. | Dùng chung quy tắc validation cho từng loại; hiển thị lỗi cạnh card và chặn xuất bản với thông báo chính xác. |
| P0 | `QuestionCard` (editor thường) | Biểu tượng kéo-thả chỉ mang tính trực quan; không có `draggable`/drop handler trong editor thường. | Thêm kéo-thả sắp xếp thật và thông báo thứ tự đã cập nhật. |
| P1 | Tab Câu hỏi khi mở AI | Card thu gọn chỉ hiển thị tối đa 3 đáp án; các loại điền từ/ghép nối/tự luận chỉ có nhãn loại thay vì form chỉnh sửa. | Hiển thị editor tối giản phù hợp từng loại hoặc nút mở nhanh editor đầy đủ. |
| P1 | Toolbar phải | **Chọn tất cả** chỉ hiện toast, không tạo selection state. **Công cụ** chỉ báo “đang được chuẩn bị”. | Hoàn thiện chọn hàng loạt, xóa/đổi loại hàng loạt hoặc thay bằng menu thao tác thực tế. |
| P2 | AI Enhance | API `enhanceQuestionAI` và component `QuizDraftAiTools` tồn tại nhưng chưa được gắn vào `QuestionCard`. | Đặt công cụ tạo lời giải, diễn đạt lại và chuẩn hóa LaTeX cạnh từng câu hỏi. |

### B. Media và đa phương tiện

| Mức ưu tiên | Vị trí | Phát hiện audit | Cần hoàn thiện |
|---:|---|---|---|
| P0 | Cài đặt ảnh bìa | Nút **Đổi ảnh** không có handler. API `creator.uploadCover` và `updateCover` đã tồn tại nhưng không được Studio gọi. | Thêm chọn tệp, kiểm tra JPEG/PNG/WEBP, tải S3 qua API, preview/crop và toast trạng thái. |
| P0 | Câu hỏi | Model/API có `imageUrl`, nhưng UI không có trường chèn ảnh hay nút upload cho câu hỏi. | Thêm ảnh minh họa cho câu hỏi, upload S3, thay/xóa ảnh, alt text và preview. |
| P1 | Đáp án | `questionOptions` chỉ có body/isCorrect; không có schema/UI cho media đáp án. | Mở rộng schema/API để mỗi đáp án có ảnh tùy chọn hoặc một cấu trúc media chung. |
| P1 | Audio/video | Không có field schema, UI upload hay trình phát cho câu hỏi/đáp án. | Thiết kế `questionMedia` hoặc JSON media metadata, upload S3, preview player, giới hạn định dạng/dung lượng. |
| P1 | Chat AI | Khung chat chỉ chấp nhận PDF/Word/Excel; không nhận ảnh để AI phân tích. | Nếu cần, thêm JPEG/PNG/WEBP bằng vision API và attachment preview. |

### C. Cấu hình Quiz và thực thi khi người học làm bài

| Mức ưu tiên | Vị trí | Phát hiện audit | Cần hoàn thiện |
|---:|---|---|---|
| P0 | Xáo trộn câu hỏi/đáp án | Toggle có trong UI nhưng payload xuất bản không gửi `shuffleQuestions`/`shuffleAnswers`; bảng Quiz dùng `randomizeQuestions`/`randomizeOptions`, và Quiz Runner chỉ đọc hai cột này. | Map toggle sang cột DB và cập nhật create/update; test thứ tự ở Quiz Runner. |
| P0 | Số lần làm tối đa | `maxAttempts` được lưu trong `creatorSettings`, nhưng `quiz.start` không đếm các lần đã làm. | Kiểm tra attempt lịch sử trước khi khởi tạo; `0` là không giới hạn; báo toast/message rõ ràng. |
| P0 | Thời hạn Quiz | `expiresAt` được lưu trong JSON cài đặt nhưng không được kiểm tra trong `quiz.start`. | Từ chối bắt đầu/tiếp tục Quiz quá hạn và hiển thị trạng thái ở trang giới thiệu Quiz. |
| P0 | Công khai/riêng tư | Studio luôn gửi `isPublished: true` lúc bấm xuất bản. `hideFromExplore` chỉ ở local state, không có trong API và không lọc thư viện. | Thêm trạng thái Draft/Private/Public, lưu DB, lọc catalog và quyết định link truy cập phù hợp. |
| P1 | Quay lại/chuyển khi sai | `allowBacktrack` được lưu, nhưng Runner luôn hiển thị nút Quay lại. `allowIncorrectContinue` không được truyền và chưa có cơ chế chấm ngay. | Tôn trọng cấu hình ở Runner; bổ sung chấm ngay nếu bật. |
| P1 | Công cụ học tập | `enableAiTranslation`, `enableStudyMaterials`, `mapThemeId` chỉ nằm trong state hiện tại và không được gửi/runtime dùng. | Lưu settings, hiển thị theo điều kiện ở Runner, hoặc ẩn các toggle chưa hỗ trợ. |
| P1 | Anti-cheat/Live monitoring | Setting được lưu nhưng không điều khiển guard hay dashboard monitoring; `QuizSecurityGuard` đang hoạt động độc lập. | Liên kết setting với hành vi guard, logging và màn hình giám sát. |

### D. Lưu dữ liệu, preview và xuất bản

| Mức ưu tiên | Vị trí | Phát hiện audit | Cần hoàn thiện |
|---:|---|---|---|
| P0 | Preview | Không có entry point Preview trong Studio hiện tại dù icon `Eye` đã được import. | Thêm preview an toàn ở chế độ học viên, không tạo attempt thật; cho phép quay lại chỉnh sửa. |
| P1 | Xuất bản | Xuất bản DB và QR hoạt động, nhưng không chuyển về **Quiz của tôi** như luồng UX mong muốn sau khi người dùng hoàn tất chia sẻ. | Thêm lựa chọn “Xem Quiz của tôi”/tự điều hướng sau khi đóng hộp chia sẻ. |
| P1 | Lịch sử nguồn | API `sourceHistory` đã có nhưng Studio không gọi/không hiển thị. | Thêm panel nguồn gần đây để tái tạo Quiz nhanh. |
| P2 | Export offline | Không có hành động/API xuất Quiz thành Word/PDF trong Studio hiện tại. | Sinh file server-side và có menu tải xuống. |

## 3. Vấn đề cấu trúc và chất lượng mã cần xử lý

| Mức ưu tiên | Vị trí | Phát hiện audit | Hành động đề xuất |
|---:|---|---|---|
| P0 | `CompactQuestionRail` | Có hai khối JSX `return` không thể chạy sau `return <QuestionRailLayout ...>`. | Xóa dead code và tách các component card/header thành file nhỏ, có type props rõ ràng. |
| P1 | `UserQuizCreator.tsx` | Trang gom state, API, editor, settings, history, publish dialog và layout vào một file dài. | Tách `quizCreator.types`, `useQuizCreatorDraft`, `QuestionEditor`, `QuizSettings`, `PublishFlow`. |
| P1 | Validation | Client và server có hai bộ quy tắc khác nhau. | Chia sẻ `validateQuestionConfiguration`/adapter để lỗi hiển thị đồng nhất trước publish. |

## 4. Lộ trình triển khai đề xuất

| Đợt | Phạm vi | Kết quả mong đợi |
|---:|---|---|
| Đợt 1 — Nền tảng P0 | Validation đồng nhất, kéo-thả editor thường, ảnh bìa/câu hỏi, xáo trộn, giới hạn lần làm, thời hạn và Public/Private | Tất cả control chính có API, DB và hành vi runtime thực tế. |
| Đợt 2 — Trải nghiệm P1 | Preview, các dạng câu trong tab AI, chọn hàng loạt, source history, Runner tôn trọng navigation/chấm ngay, audio/video | Quy trình biên soạn hoàn chỉnh hơn và ít dead-end. |
| Đợt 3 — Tối ưu P2 | AI Enhance, xuất Word/PDF, tái cấu trúc component và mở rộng media đáp án | Dễ bảo trì, giàu công cụ biên soạn. |

## Quyết định cần xác nhận

Để không thay đổi các quy tắc sản phẩm đang dùng ngoài ý muốn, cần xác nhận ba điểm trước khi viết code: **(1)** định nghĩa Private: chỉ người tạo xem hay ai có link vẫn vào được; **(2)** audio/video được lưu bằng S3 và giới hạn dung lượng/định dạng nào; **(3)** Preview chỉ mô phỏng tại client hay dùng cùng API Quiz Runner nhưng không tạo attempt.
