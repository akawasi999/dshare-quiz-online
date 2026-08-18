import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Download, Loader2, Upload } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = ["lessonId", "prompt", "type", "difficulty", "tags", "options"];

export default function QuestionTransferPanel() {
  const [lessonId, setLessonId] = useState("");
  const [csv, setCsv] = useState("");
  const exportQuery = trpc.admin.exportQuestions.useQuery({ lessonId: lessonId ? Number(lessonId) : undefined }, { enabled: false });
  const importMutation = trpc.admin.importQuestions.useMutation({
    onSuccess: result => toast.success(`Đã nhập ${result.created} câu hỏi.`, { description: result.failed ? `${result.failed} dòng cần kiểm tra lại.` : "Dữ liệu hợp lệ." }),
  });
  const downloadExcel = async () => {
    const response = await exportQuery.refetch();
    if (!response.data) return;
    const source = XLSX.read(response.data.csv, { type: "string" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, source.Sheets[source.SheetNames[0]], "Questions");
    XLSX.writeFile(workbook, response.data.filename.replace(/\.csv$/, ".xlsx"));
  };
  const selectExcel = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "array" });
        const sheet = workbook.Sheets.Questions;
        if (!sheet) throw new Error("Thiếu sheet Questions.");
        const table = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
        const header = (table[0] ?? []).map(String);
        const missing = REQUIRED_COLUMNS.filter(column => !header.includes(column));
        if (missing.length) throw new Error(`Thiếu cột: ${missing.join(", ")}.`);
        setCsv(XLSX.utils.sheet_to_csv(sheet));
        toast.success("Đã đọc sheet Questions", { description: "Bạn có thể kiểm tra dữ liệu rồi nhấn Nhập." });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể đọc tệp Excel.");
      } finally { event.target.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };
  return <div className="mx-auto max-w-5xl"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#f59e0b]">Dshare / Quản trị / Import & Export</p><h1 className="mt-2 font-serif text-[36px] font-semibold tracking-[-.045em] text-[#172554]">Trao đổi ngân hàng câu hỏi</h1><p className="mt-2 text-sm text-[#617786]">Xuất và nhập theo một sheet <strong>Questions</strong>; mỗi dòng là một câu hỏi, dùng cùng các cột cho CSV và Excel.</p><div className="mt-7 grid gap-5 lg:grid-cols-2"><section className="rounded-[25px] bg-[#172554] p-6 text-white"><Download className="text-[#fbbf24]" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-[#fbbf24]">Bước 1 · Export Excel</p><h2 className="mt-2 font-serif text-[27px] font-semibold">Tải sheet Questions</h2><p className="mt-3 text-xs leading-5 text-[#eef4ff]">Workbook .xlsx chứa một sheet Questions, gồm lessonId, nội dung, loại, độ khó, tags, lời giải, cấu hình và phương án dạng JSON.</p><Label className="mt-6 block text-[#eef4ff]">ID Bài học <span className="font-normal">(để trống nếu export tất cả)</span></Label><Input value={lessonId} onChange={event => setLessonId(event.target.value)} type="number" placeholder="Ví dụ: 12" className="mt-2 border-white/15 bg-white/10 text-white placeholder:text-[#617786]" /><Button onClick={downloadExcel} disabled={exportQuery.isFetching} className="mt-5 rounded-full bg-[#fbbf24] text-[#172554] hover:bg-[#fbbf24]">{exportQuery.isFetching ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />} Tải Excel</Button></section><section className="rounded-[25px] border border-[#172554]/9 bg-white p-6"><Upload className="text-[#f59e0b]" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-[#f59e0b]">Bước 2 · Import</p><h2 className="mt-2 font-serif text-[27px] font-semibold text-[#172554]">Chọn tệp Excel hoặc dán CSV</h2><p className="mt-3 text-xs leading-5 text-[#617786]">Tệp Excel phải có sheet tên Questions và các cột bắt buộc. Dòng lỗi sẽ được báo sau khi nhập.</p><Label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#fff7e6] px-4 py-2 text-xs font-bold text-[#172554] hover:bg-[#fbbf24]"><Upload size={14} /> Chọn tệp Excel<input type="file" accept=".xlsx,.xls" onChange={selectExcel} className="sr-only" /></Label><Textarea value={csv} onChange={event => setCsv(event.target.value)} className="mt-4 min-h-36 font-mono text-[11px]" placeholder="Dữ liệu CSV sẽ hiển thị ở đây sau khi chọn Excel…" /><Button onClick={() => importMutation.mutate({ csv })} disabled={importMutation.isPending || csv.length < 20} className="mt-4 rounded-full bg-[#172554]">{importMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Upload size={15} />} Nhập dữ liệu</Button>{importMutation.data?.errors.length ? <div className="mt-4 rounded-xl bg-[#f7e7e2] p-3 text-[11px] leading-5 text-[#617786]">{importMutation.data.errors.map(error => <p key={error.row}>Dòng {error.row}: {error.message}</p>)}</div> : null}</section></div></div>;
}
