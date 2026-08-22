# Đối chiếu baseline navigation

## Ảnh tham chiếu

Ảnh `pasted_file_W9RHpq_image.png` có kích thước **646 × 70 px**. Ảnh được kiểm tra theo hai lát ngang có overlap, theo đúng thứ tự trái sang phải.

## Kết quả quan sát

Năm nhãn **Giới thiệu về chúng tôi**, **Khám phá**, **Bảng giá**, **Blog** và **Hỗ trợ khách hàng** có cùng vị trí đỉnh, đáy glyph và cùng baseline thị giác. Hai chevron sau Khám phá và Hỗ trợ khách hàng nằm giữa theo trục dọc với chữ. Không có nhãn nào được dịch dọc độc lập.

## Hướng xử lý

Header cần ép mọi link, trigger dropdown và icon chevron vào cùng một hàng flex `items-center`; từng nhãn dùng `inline-flex items-center` với cùng `line-height: 20px`. Không được giữ padding hoặc transform dọc riêng trên một mục navigation.
