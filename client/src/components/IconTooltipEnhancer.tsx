import { useEffect } from "react";

const interactiveSelector = 'button[aria-label], a[aria-label], [role="button"][aria-label]';

const fallbackLabels: Record<string, string> = {
  "lucide-x": "Đóng",
  "lucide-trash-2": "Xóa",
  "lucide-trash": "Xóa",
  "lucide-pencil": "Chỉnh sửa",
  "lucide-edit-3": "Chỉnh sửa",
  "lucide-eye": "Xem trước",
  "lucide-download": "Tải xuống",
  "lucide-upload": "Tải lên",
  "lucide-plus": "Thêm mới",
  "lucide-minus": "Thu gọn",
  "lucide-chevron-left": "Trước",
  "lucide-chevron-right": "Tiếp theo",
  "lucide-arrow-left": "Quay lại",
  "lucide-arrow-right": "Tiếp tục",
  "lucide-more-horizontal": "Thêm thao tác",
  "lucide-grip-vertical": "Kéo để sắp xếp",
  "lucide-copy": "Sao chép",
  "lucide-check": "Xác nhận",
  "lucide-refresh-cw": "Làm mới",
  "lucide-rotate-ccw": "Hoàn tác",
};

const allInteractiveSelector = 'button, a, [role="button"]';

export function isIconOnlyControl(element: Element) {
  const visibleText = Array.from(element.childNodes).map(node => node.nodeType === Node.TEXT_NODE ? node.textContent : node instanceof Element && !node.matches("svg, [aria-hidden='true']") ? node.textContent : "").join("").trim();
  return !visibleText && Boolean(element.querySelector("svg"));
}

export function annotateIconTooltips(root: ParentNode = document) {
  root.querySelectorAll(allInteractiveSelector).forEach(element => {
    const iconClass = Array.from(element.querySelector("svg")?.classList ?? []).find(className => className.startsWith("lucide-"));
    const label = element.getAttribute("aria-label")?.trim() ?? (iconClass ? fallbackLabels[iconClass] : undefined);
    if (!label || element.hasAttribute("data-tooltip-skip") || !isIconOnlyControl(element)) return;
    if (!element.getAttribute("aria-label")) element.setAttribute("aria-label", label);
    element.setAttribute("data-icon-tooltip", label);
  });
}

/** Gắn tooltip cho icon-only control được render động, không tác động icon trang trí. */
export default function IconTooltipEnhancer() {
  useEffect(() => {
    annotateIconTooltips();
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node instanceof Element) {
          if (node.matches(allInteractiveSelector)) annotateIconTooltips(node.parentNode ?? document);
          annotateIconTooltips(node);
        }
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
