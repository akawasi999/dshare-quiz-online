import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { validateQuestionConfiguration, type QuestionValidationType } from "@shared/questionValidation";
import { CirclePlus, Loader2, Save, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type OptionDraft = { body: string; isCorrect: boolean };
type PairDraft = { left: string; right: string };

const typeDescriptions: Record<QuestionValidationType, string> = {
  single: "Chọn đúng một phương án.",
  multiple: "Chọn tất cả phương án đúng.",
  true_false: "Chọn một trong hai kết luận Đúng hoặc Sai.",
  fill_blank: "So khớp đáp án nhập theo các biến thể được chấp nhận.",
  image: "Quan sát hình minh họa rồi chọn một phương án.",
  matching: "Ghép các cặp trái–phải trong chế độ luyện tập.",
};

const emptyOptions = (): OptionDraft[] => [{ body: "", isCorrect: true }, { body: "", isCorrect: false }];

export default function QuestionEditorPanel() {
  const [lessonId, setLessonId] = useState("");
  const [quizId, setQuizId] = useState("");
  const [type, setType] = useState<QuestionValidationType>("single");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>(emptyOptions);
  const [acceptedAnswers, setAcceptedAnswers] = useState("");
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<"Đúng" | "Sai">("Đúng");
  const [pairs, setPairs] = useState<PairDraft[]>([{ left: "", right: "" }, { left: "", right: "" }]);
  const save = trpc.admin.saveQuestion.useMutation({ onSuccess: () => toast.success("Đã lưu câu hỏi vào ngân hàng.") });
  const answerConfig = useMemo(() => type === "fill_blank" ? { acceptedAnswers: acceptedAnswers.split("|").map(answer => answer.trim()).filter(Boolean) } : type === "matching" ? { pairs: pairs.map(pair => ({ left: pair.left.trim(), right: pair.right.trim() })) } : {}, [acceptedAnswers, pairs, type]);
  const submittedOptions = useMemo(() => type === "true_false" ? [{ body: "Đúng", isCorrect: trueFalseAnswer === "Đúng" }, { body: "Sai", isCorrect: trueFalseAnswer === "Sai" }] : ["fill_blank", "matching"].includes(type) ? [] : options.map(option => ({ body: option.body.trim(), isCorrect: option.isCorrect })), [options, trueFalseAnswer, type]);

  const setQuestionType = (nextType: QuestionValidationType) => {
    setType(nextType);
    if (["single", "multiple", "image"].includes(nextType) && !options.length) setOptions(emptyOptions());
  };
  const updateOption = (index: number, update: Partial<OptionDraft>) => setOptions(values => values.map((option, optionIndex) => optionIndex === index ? { ...option, ...update } : option));
  const chooseSingleCorrect = (index: number) => setOptions(values => values.map((option, optionIndex) => ({ ...option, isCorrect: optionIndex === index })));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const error = validateQuestionConfiguration({ type, options: submittedOptions, answerConfig, imageUrl });
    if (error) { toast.error("Chưa thể lưu câu hỏi", { description: error }); return; }
    save.mutate({ lessonId: Number(lessonId), quizId: quizId ? Number(quizId) : undefined, prompt, explanation, type, difficulty: "medium", tags: ["Chưa phân loại"], imageUrl, options: submittedOptions, answerConfig });
  };

  return <div className="mx-auto max-w-4xl"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#f59e0b]">Dshare / Quản trị / Câu hỏi</p><h1 className="mt-2 font-serif text-[36px] font-semibold tracking-[-.045em] text-[#172554]">Ngân hàng câu hỏi đa dạng</h1><p className="mt-2 text-sm text-[#617786]">Chọn loại câu hỏi, cấu hình đáp án và để hệ thống kiểm tra các quy tắc riêng trước khi lưu.</p><form onSubmit={submit} className="mt-7 rounded-[26px] border border-[#172554]/9 bg-white p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-3"><div><Label>ID Bài học</Label><Input value={lessonId} onChange={event => setLessonId(event.target.value)} required type="number" className="mt-2" /></div><div><Label>ID Bộ đề <span className="font-normal text-[#617786]">(tùy chọn)</span></Label><Input value={quizId} onChange={event => setQuizId(event.target.value)} type="number" className="mt-2" /></div><div><Label>Loại câu hỏi</Label><select value={type} onChange={event => setQuestionType(event.target.value as QuestionValidationType)} className="mt-2 h-10 w-full rounded-md border border-[#172554]/10 bg-[#fff7e6] px-3 text-xs"><option value="single">Một đáp án</option><option value="multiple">Nhiều đáp án</option><option value="true_false">Đúng / Sai</option><option value="fill_blank">Điền từ</option><option value="image">Có hình ảnh</option><option value="matching">Ghép nối</option></select></div></div><p className="mt-3 rounded-xl bg-[#fff7e6] px-3 py-2 text-[11px] leading-5 text-[#d97706]">{typeDescriptions[type]}</p><div className="mt-5"><Label>Nội dung câu hỏi</Label><Textarea value={prompt} onChange={event => setPrompt(event.target.value)} required className="mt-2 min-h-24" placeholder="Nhập câu hỏi rõ ràng, đủ ngữ cảnh…" /></div>{type === "image" ? <div className="mt-4"><Label>URL hình ảnh minh họa</Label><Input value={imageUrl} onChange={event => setImageUrl(event.target.value)} required type="url" className="mt-2" placeholder="https://…" /></div> : null}{["single", "multiple", "image"].includes(type) ? <OptionEditor type={type} options={options} onUpdate={updateOption} onChooseSingle={chooseSingleCorrect} onToggleMultiple={index => updateOption(index, { isCorrect: !options[index]?.isCorrect })} onAdd={() => setOptions(values => [...values, { body: "", isCorrect: false }])} onRemove={index => setOptions(values => values.length > 2 ? values.filter((_, optionIndex) => optionIndex !== index) : values)} /> : null}{type === "true_false" ? <div className="mt-5"><Label>Đáp án đúng</Label><div className="mt-2 grid grid-cols-2 gap-3">{(["Đúng", "Sai"] as const).map(answer => <button key={answer} type="button" onClick={() => setTrueFalseAnswer(answer)} className={`rounded-xl border px-4 py-3 text-sm font-bold ${trueFalseAnswer === answer ? "border-[#f59e0b] bg-[#fff7e6] text-[#d97706]" : "border-[#172554]/10 bg-[#fff7e6] text-[#617786]"}`}>{answer}</button>)}</div></div> : null}{type === "fill_blank" ? <div className="mt-5"><Label>Đáp án được chấp nhận</Label><Input value={acceptedAnswers} onChange={event => setAcceptedAnswers(event.target.value)} className="mt-2" placeholder="Ví dụ: JavaScript|JS|Javascript" /><p className="mt-2 text-[11px] text-[#617786]">Dùng ký tự <strong>|</strong> để phân tách các cách trả lời hợp lệ.</p></div> : null}{type === "matching" ? <PairEditor pairs={pairs} onChange={setPairs} /> : null}<div className="mt-5"><Label>Lời giải sau khi nộp bài</Label><Textarea value={explanation} onChange={event => setExplanation(event.target.value)} className="mt-2 min-h-20" placeholder="Giải thích vì sao đáp án phù hợp…" /></div><Button disabled={save.isPending} className="mt-6 rounded-full bg-[#172554]">{save.isPending ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Lưu câu hỏi</Button></form></div>;
}

function OptionEditor({ type, options, onUpdate, onChooseSingle, onToggleMultiple, onAdd, onRemove }: { type: QuestionValidationType; options: OptionDraft[]; onUpdate: (index: number, update: Partial<OptionDraft>) => void; onChooseSingle: (index: number) => void; onToggleMultiple: (index: number) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  const multiple = type === "multiple";
  return <div className="mt-5"><div className="flex items-end justify-between gap-3"><div><Label>Phương án trả lời</Label><p className="mt-1 text-[11px] text-[#617786]">{multiple ? "Chọn toàn bộ đáp án đúng." : "Chọn duy nhất một đáp án đúng."}</p></div><Button type="button" variant="outline" onClick={onAdd} className="h-8 rounded-full px-3 text-[11px]"><CirclePlus size={14} /> Thêm phương án</Button></div><div className="mt-3 space-y-2">{options.map((option, index) => <div key={index} className="flex items-center gap-2"><button type="button" onClick={() => multiple ? onToggleMultiple(index) : onChooseSingle(index)} className={`grid h-9 w-9 shrink-0 place-items-center border text-xs font-bold ${multiple ? "rounded-md" : "rounded-full"} ${option.isCorrect ? "border-[#f59e0b] bg-[#f59e0b] text-white" : "border-[#172554]/12 bg-[#fff7e6] text-[#617786]"}`}>{option.isCorrect ? "✓" : String.fromCharCode(65 + index)}</button><Input value={option.body} onChange={event => onUpdate(index, { body: event.target.value })} required placeholder={`Phương án ${String.fromCharCode(65 + index)}`} /><button type="button" disabled={options.length <= 2} onClick={() => onRemove(index)} className="grid h-9 w-9 place-items-center rounded-lg text-[#617786] hover:bg-[#f8eae6] disabled:opacity-30" aria-label="Xóa phương án"><Trash2 size={15} /></button></div>)}</div></div>;
}

function PairEditor({ pairs, onChange }: { pairs: PairDraft[]; onChange: (pairs: PairDraft[]) => void }) {
  const updatePair = (index: number, key: keyof PairDraft, value: string) => onChange(pairs.map((pair, pairIndex) => pairIndex === index ? { ...pair, [key]: value } : pair));
  return <div className="mt-5"><div className="flex items-end justify-between gap-3"><div><Label>Các cặp ghép nối</Label><p className="mt-1 text-[11px] text-[#617786]">Mỗi hàng là một cặp trái–phải. Người học sẽ thấy cột phải được xáo trộn khi luyện tập.</p></div><Button type="button" variant="outline" onClick={() => onChange([...pairs, { left: "", right: "" }])} className="h-8 rounded-full px-3 text-[11px]"><CirclePlus size={14} /> Thêm cặp</Button></div><div className="mt-3 space-y-2">{pairs.map((pair, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_36px]"><Input value={pair.left} onChange={event => updatePair(index, "left", event.target.value)} required placeholder="Vế trái" /><Input value={pair.right} onChange={event => updatePair(index, "right", event.target.value)} required placeholder="Vế phải" /><button type="button" disabled={pairs.length <= 2} onClick={() => onChange(pairs.filter((_, pairIndex) => pairIndex !== index))} className="grid h-10 place-items-center rounded-lg text-[#617786] hover:bg-[#f8eae6] disabled:opacity-30" aria-label="Xóa cặp ghép"><Trash2 size={15} /></button></div>)}</div></div>;
}
