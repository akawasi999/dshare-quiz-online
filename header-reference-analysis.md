# Đối chiếu Navigation Header

Ảnh tham chiếu `pasted_file_RE4ybn_image.png` có kích thước **728 × 69 px**. Hai lát ngang được đọc theo thứ tự trái sang phải, với vùng overlap lớn để xác nhận nhãn không bị cắt.

Các nhãn được xác nhận lần lượt là: **Giới thiệu về chúng tôi**, **Khám phá** (có chevron), **Bảng giá**, **Blog**, và **Hỗ trợ khách hàng** (có chevron). Toàn bộ nhãn dùng cùng một cấp chữ thị giác, trọng lượng medium/semi-bold vừa phải, baseline thẳng hàng giữa thanh cao 69px. Khoảng trắng ngang giữa các nhóm tương đối rộng và đều; Bảng giá, Blog không đậm/lớn hơn các mục kế cận.

Điều chỉnh cần áp dụng: dùng một cấp chữ 14px với `font-medium`, line-height 20px, letter spacing mặc định hoặc rất nhẹ; tránh tracking âm và `font-semibold` gây cảm giác đặc/nặng không đồng đều. Nhịp gap desktop mục tiêu là 32px, padding nội bộ tối giản để khoảng cách nhận thức bám mẫu.

## Kết quả áp dụng

Navigation desktop đã dùng `text-sm` (14px), `font-medium`, `leading-5` và tracking mặc định cho mọi liên kết và trigger. Khoảng cách desktop tăng tới 32px ở breakpoint `xl`; các liên kết bỏ padding ngang thừa để khoảng trắng giữa nhãn là yếu tố điều tiết chính, giống mẫu. CTA và vùng tài khoản được giữ ở cùng cấp chữ để không còn cảm giác to/nhỏ lẫn lộn.
