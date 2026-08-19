import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calculateCoverCropBounds, defaultCoverCropFocus, type CoverCropFocus } from "@shared/coverCrop";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CoverImageCropperProps = {
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

const outputWidth = 1600;
const outputHeight = 900;

export default function CoverImageCropper({ file, onCancel, onConfirm }: CoverImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [crop, setCrop] = useState<CoverCropFocus>(defaultCoverCropFocus);

  useEffect(() => {
    if (!file) { setSourceUrl(""); return; }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setCrop(defaultCoverCropFocus);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!sourceUrl) return;
    const image = new Image();
    image.onload = () => { imageRef.current = image; drawPreview(image, crop, canvasRef.current); };
    image.src = sourceUrl;
  }, [sourceUrl]);

  useEffect(() => {
    if (imageRef.current) drawPreview(imageRef.current, crop, canvasRef.current);
  }, [crop]);

  if (!file) return null;

  const updateCrop = (key: keyof CoverCropFocus, value: number) => setCrop(current => ({ ...current, [key]: value }));
  const confirmCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsLoading(true);
    canvas.toBlob(blob => {
      setIsLoading(false);
      if (!blob) return;
      onConfirm(new File([blob], `cover-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141432]/65 p-4" role="dialog" aria-modal="true" aria-labelledby="cover-crop-title">
    <div className="w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-[#141432]/10 px-5 py-4 sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#065be5]">Ảnh bìa 16:9</p><h2 id="cover-crop-title" className="mt-1 font-serif text-2xl font-semibold text-[#141432]">Cắt ảnh trước khi tải lên</h2><p className="mt-1 text-xs text-[#6c6c7a]">Điều chỉnh vùng hiển thị; ảnh xuất ra ở kích thước 1600 × 900 px.</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-full text-[#6c6c7a] hover:bg-[#ebf4ff]" aria-label="Đóng công cụ cắt ảnh"><X size={18} /></button></div>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_260px]">
        <div className="overflow-hidden rounded-2xl bg-[#141432]"><canvas ref={canvasRef} width={outputWidth} height={outputHeight} className="aspect-video h-auto w-full" aria-label="Bản xem trước ảnh bìa đã cắt" /></div>
        <div className="space-y-5"><div><div className="flex items-center justify-between"><Label htmlFor="crop-zoom">Phóng to</Label><span className="text-xs font-bold text-[#065be5]">{crop.zoom.toFixed(1)}×</span></div><input id="crop-zoom" type="range" min="1" max="3" step="0.1" value={crop.zoom} onChange={event => updateCrop("zoom", Number(event.target.value))} className="mt-3 w-full accent-[#065be5]" /></div><div><div className="flex items-center justify-between"><Label htmlFor="crop-x">Tâm ngang</Label><span className="text-xs text-[#6c6c7a]">{crop.focusX === 0 ? "Giữa" : crop.focusX < 0 ? "Trái" : "Phải"}</span></div><input id="crop-x" type="range" min="-1" max="1" step="0.05" value={crop.focusX} onChange={event => updateCrop("focusX", Number(event.target.value))} className="mt-3 w-full accent-[#065be5]" /></div><div><div className="flex items-center justify-between"><Label htmlFor="crop-y">Tâm dọc</Label><span className="text-xs text-[#6c6c7a]">{crop.focusY === 0 ? "Giữa" : crop.focusY < 0 ? "Trên" : "Dưới"}</span></div><input id="crop-y" type="range" min="-1" max="1" step="0.05" value={crop.focusY} onChange={event => updateCrop("focusY", Number(event.target.value))} className="mt-3 w-full accent-[#065be5]" /></div><Button type="button" variant="outline" onClick={() => setCrop(defaultCoverCropFocus)} className="w-full rounded-full"><RotateCcw size={15} /> Đặt lại vùng cắt</Button></div>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-[#141432]/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-full">Hủy</Button><Button type="button" onClick={confirmCrop} disabled={isLoading || !sourceUrl} className="cta-gradient rounded-full">{isLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Dùng ảnh đã cắt</Button></div>
    </div>
  </div>;
}

function drawPreview(image: HTMLImageElement, crop: CoverCropFocus, canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const bounds = calculateCoverCropBounds(image.naturalWidth, image.naturalHeight, crop);
  context.clearRect(0, 0, outputWidth, outputHeight);
  context.drawImage(image, bounds.sourceX, bounds.sourceY, bounds.sourceWidth, bounds.sourceHeight, 0, 0, outputWidth, outputHeight);
}
