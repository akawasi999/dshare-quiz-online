import CoverImageCropper from "@/components/CoverImageCropper";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { validateQuizCoverFile } from "@shared/quizCover";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CategoryCoverSettings() {
  const content = trpc.admin.contentTree.useQuery();
  const upload = trpc.admin.uploadCategoryCover.useMutation();
  const update = trpc.admin.updateCategoryCover.useMutation({
    onSuccess: () => { content.refetch(); toast.success("Đã lưu ảnh bìa mặc định cho chủ đề."); },
    onError: error => toast.error("Không thể cập nhật ảnh chủ đề", { description: error.message }),
  });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const busy = isReading || upload.isPending || update.isPending;

  const chooseFile = (file: File | undefined, categoryId: number) => {
    if (!file) return;
    const validationError = validateQuizCoverFile(file);
    if (validationError) { toast.error(validationError); return; }
    setTargetCategoryId(categoryId);
    setPendingFile(file);
  };

  const uploadCroppedCover = (file: File) => {
    if (!targetCategoryId) return;
    const categoryId = targetCategoryId;
    const reader = new FileReader();
    setPendingFile(null);
    setIsReading(true);
    reader.onerror = () => { setIsReading(false); toast.error("Không thể đọc ảnh đã cắt."); };
    reader.onload = () => upload.mutate({ fileName: `category-${categoryId}-${Date.now()}.jpg`, mimeType: "image/jpeg", base64: String(reader.result) }, {
      onSuccess: result => update.mutate({ categoryId, coverImageUrl: result.url }),
      onError: error => toast.error("Không thể tải ảnh chủ đề", { description: error.message }),
      onSettled: () => { setIsReading(false); setTargetCategoryId(null); },
    });
    reader.readAsDataURL(file);
  };

  return <section className="mt-5 rounded-[25px] border border-[#172554]/9 bg-white p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#065be5]">Ảnh chủ đề</p><h2 className="mt-2 font-serif text-[26px] font-semibold text-[#172554]">Ảnh bìa mặc định</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#617786]">Ảnh này được tự động dùng cho mọi bộ đề công khai chưa có ảnh bìa riêng. Mỗi ảnh được cắt về tỷ lệ 16:9 trước khi lưu.</p></div><span className="w-fit rounded-full bg-[#e8f6fd] px-3 py-2 text-[10px] font-bold text-[#007453]">Áp dụng theo chủ đề</span></div>{content.isLoading ? <p className="mt-5 text-sm text-[#617786]">Đang tải chủ đề…</p> : content.error ? <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-xs text-[#de1264]">Không thể tải chủ đề: {content.error.message}</div> : content.data?.categories.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{content.data.categories.map(category => <article key={category.id} className="overflow-hidden rounded-2xl border border-[#172554]/10 bg-[#ebf4ff]"><div className="relative h-28 bg-gradient-to-br from-[#cfe4ff] to-white">{category.coverImageUrl ? <img src={category.coverImageUrl} alt={`Ảnh bìa mặc định ${category.title}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[11px] font-bold text-[#617786]">Chưa đặt ảnh mặc định</div>}</div><div className="p-4"><p className="truncate text-sm font-bold text-[#172554]">{category.title}</p><p className="mt-1 text-[11px] text-[#617786]">Chủ đề #{category.id}</p><div className="mt-4 flex flex-wrap gap-2"><label htmlFor={`category-cover-${category.id}`} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#065be5] hover:bg-[#dbeafe]"><ImagePlus size={13} /> {category.coverImageUrl ? "Thay ảnh" : "Đặt ảnh"}</label><input id={`category-cover-${category.id}`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={event => { chooseFile(event.target.files?.[0], category.id); event.currentTarget.value = ""; }} />{category.coverImageUrl ? <Button type="button" variant="ghost" disabled={busy} onClick={() => update.mutate({ categoryId: category.id, coverImageUrl: null })} className="h-auto rounded-full px-3 py-2 text-[11px] text-[#de1264] hover:bg-red-50 hover:text-[#de1264]"><Trash2 size={13} /> Bỏ ảnh</Button> : null}</div></div></article>)}</div> : <p className="mt-5 rounded-2xl bg-[#eef4ff] p-5 text-sm text-[#617786]">Chưa có chủ đề để đặt ảnh bìa mặc định.</p>}{pendingFile ? <CoverImageCropper file={pendingFile} onCancel={() => { setPendingFile(null); setTargetCategoryId(null); }} onConfirm={uploadCroppedCover} /> : null}</section>;
}
