import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  getPracticeTransition,
  getPracticeMatchingPairs,
  haveSameSelectedOptions,
  isPracticeMatchingPairCorrect,
  isPracticeOptionAnswerCorrect,
  isPracticeTextAnswerCorrect,
  practiceCompletionDestination,
  shufflePracticeOptions,
} from "@/lib/practiceUtils";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, CircleAlert, GripVertical, ImageIcon, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type MatchingResponse = { optionId: string; answer: string; isCorrect: boolean };

const typeLabels = {
  single: "Chọn một đáp án",
  multiple: "Chọn các đáp án đúng",
  true_false: "Đúng hoặc Sai",
  fill_blank: "Điền đáp án",
  image: "Quan sát hình ảnh",
  matching: "Ghép nối",
} as const;

export default function Practice() {
  const practice = trpc.quiz.practiceWrong.useQuery();
  const completePractice = trpc.quiz.completePractice.useMutation();
  const [index, setIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [matchingIndex, setMatchingIndex] = useState(0);
  const [matchingResponses, setMatchingResponses] = useState<Record<number, MatchingResponse>>({});
  const [matchingCandidateId, setMatchingCandidateId] = useState<string | null>(null);
  const [matchingOptions, setMatchingOptions] = useState<Array<{ id: string; body: string }>>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedCategory, setCompletedCategory] = useState<string | null>(null);
  const item = practice.data?.[index];
  const matchingPairs = useMemo(
    () => getPracticeMatchingPairs(item?.question.answerConfig),
    [item?.question.answerConfig],
  );

  useEffect(() => {
    setSelectedOptionIds([]);
    setTextAnswer("");
    setChecked(false);
    setMatchingIndex(0);
    setMatchingResponses({});
    setMatchingCandidateId(null);
    setMatchingOptions(shufflePracticeOptions(matchingPairs.map((pair, pairIndex) => ({
      id: `${item?.question.id ?? "practice"}-${pairIndex}`,
      body: pair.right,
    }))));
  }, [item?.question.id]);

  if (practice.isLoading) return <PracticeShell><p role="status" aria-live="polite" className="container py-20 text-sm text-[#617786]">Đang chuẩn bị các câu cần ôn…</p></PracticeShell>;
  if (practice.isError) return <PracticeShell><MessageCard icon="error" title="Chưa tải được phiên luyện tập" description="Vui lòng kiểm tra kết nối rồi thử lại. Dữ liệu câu cần ôn của bạn vẫn được giữ an toàn." action={<Button onClick={() => practice.refetch()} className="mt-6 rounded-full bg-[#172554]">Thử lại</Button>} /></PracticeShell>;
  if (sessionCompleted) return <PracticeShell><MessageCard icon="success" title="Bạn đã hoàn thành phiên luyện tập" description={completedCategory ? `Danh mục “${completedCategory}” đã được ghi nhận làm gợi ý cho lần khám phá tiếp theo.` : "Tiến độ luyện tập của bạn đã được ghi nhận."} action={<div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={() => { setIndex(0); setSessionCompleted(false); practice.refetch(); }} className="rounded-full">Luyện thêm <RotateCcw size={15} /></Button><Button asChild className="rounded-full bg-[#172554]"><Link href={practiceCompletionDestination}>Khám phá bộ đề <ArrowRight size={15} /></Link></Button></div>} /></PracticeShell>;
  if (!item) return <PracticeShell><MessageCard icon="success" title="Chưa có câu cần ôn" description="Hãy hoàn thành một bộ đề; các câu chưa đúng sẽ xuất hiện tại đây để bạn luyện lại." action={<Button asChild className="mt-6 rounded-full bg-[#172554]"><Link href="/kham-pha">Khám phá bộ đề</Link></Button>} /></PracticeShell>;

  const correctOptionIds = item.options.filter(option => option.isCorrect).map(option => option.id);
  const optionAnswerCorrect = isPracticeOptionAnswerCorrect(selectedOptionIds, correctOptionIds);
  const textAnswerCorrect = isPracticeTextAnswerCorrect(item.question.answerConfig, textAnswer);
  const activeMatchingPair = matchingPairs[matchingIndex];
  const activeMatchingResponse = matchingResponses[matchingIndex];
  const advanceQuestion = () => {
    if (getPracticeTransition({ questionIndex: index, questionCount: practice.data?.length ?? 0 }) === "next-question") {
      setIndex(value => value + 1);
      return;
    }
    completePractice.mutate({ questionId: item.question.id }, {
      onSuccess: result => {
        setCompletedCategory(result.category.categoryTitle);
        setSessionCompleted(true);
      },
      onError: () => toast.error("Không thể ghi nhận phiên luyện tập. Vui lòng thử lại."),
    });
  };
  const selectSingleOption = (optionId: number) => {
    if (checked) return;
    setSelectedOptionIds([optionId]);
    setChecked(true);
  };
  const toggleMultipleOption = (optionId: number) => {
    if (checked) return;
    setSelectedOptionIds(values => values.includes(optionId) ? values.filter(value => value !== optionId) : [...values, optionId]);
  };
  const submitMatchingChoice = (optionId: string) => {
    if (!activeMatchingPair || activeMatchingResponse) return;
    const option = matchingOptions.find(candidate => candidate.id === optionId);
    if (!option) return;
    const isCorrect = isPracticeMatchingPairCorrect(option.body, activeMatchingPair.right);
    setMatchingResponses(values => ({ ...values, [matchingIndex]: { optionId, answer: option.body, isCorrect } }));
    setMatchingCandidateId(null);
  };
  const advanceMatching = () => {
    if (!activeMatchingResponse) return;
    if (getPracticeTransition({ questionIndex: index, questionCount: practice.data?.length ?? 0, matchingIndex, matchingCount: matchingPairs.length }) === "next-matching-pair") {
      setMatchingIndex(value => value + 1);
      return;
    }
    advanceQuestion();
  };
  const typeLabel = typeLabels[item.question.type];

  return <PracticeShell>
    <main className="container max-w-4xl py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#f59e0b]">Luyện tập cá nhân hóa · {index + 1}/{practice.data?.length}</p><h1 className="mt-2 font-serif text-[38px] font-semibold tracking-[-.04em] text-[#172554]">Làm lại câu chưa đúng</h1></div>
        <span className="w-fit rounded-full bg-[#eef4ff] px-3 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#617786]">{typeLabel}</span>
      </div>
      <section className="mt-7 rounded-[28px] border border-[#172554]/9 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#fff7e6] px-3 py-1 text-[10px] font-bold uppercase text-[#617786]">{item.question.difficulty}</span><span className="rounded-full bg-[#fff7e6] px-3 py-1 text-[10px] font-medium text-[#617786]">{item.category.title}</span></div>
        <p className="mt-6 font-serif text-[28px] font-semibold leading-tight text-[#172554]">{item.question.prompt}</p>
        {item.question.type === "image" && item.question.imageUrl ? <div className="mt-6 overflow-hidden rounded-2xl border border-[#172554]/10 bg-[#fff7e6]"><img src={item.question.imageUrl} alt="Minh họa cho câu hỏi luyện tập" className="max-h-[380px] w-full object-contain" /><p className="flex items-center gap-2 px-4 py-3 text-[11px] text-[#617786]"><ImageIcon size={14} /> Hình ảnh minh họa cho câu hỏi.</p></div> : null}

        {item.question.type === "matching" ? <MatchingPractice
          pairs={matchingPairs}
          activeIndex={matchingIndex}
          responses={matchingResponses}
          options={matchingOptions}
          candidateId={matchingCandidateId}
          onPickCandidate={setMatchingCandidateId}
          onDrop={submitMatchingChoice}
        /> : item.question.type === "fill_blank" ? <div className="mt-7"><label className="text-xs font-bold text-[#617786]" htmlFor="practice-fill-answer">Câu trả lời của bạn</label><input id="practice-fill-answer" value={textAnswer} disabled={checked} onChange={event => setTextAnswer(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && textAnswer.trim()) setChecked(true); }} className="mt-3 h-12 w-full rounded-2xl border border-[#172554]/12 bg-[#fff7e6] px-4 text-sm text-[#172554] outline-none transition focus:border-[#f59e0b] focus:ring-2 focus:ring-[#fbbf24]/45 disabled:opacity-70" placeholder="Nhập đáp án ngắn gọn…" />{!checked ? <Button onClick={() => setChecked(true)} disabled={!textAnswer.trim()} className="mt-4 rounded-full bg-[#172554]">Kiểm tra đáp án</Button> : <FeedbackCard correct={textAnswerCorrect} explanation={item.question.explanation} correctAnswer={getAcceptedAnswers(item.question.answerConfig).join(" · ")} />}</div> : <div className="mt-7 space-y-3">{item.options.map(option => {
          const selected = selectedOptionIds.includes(option.id);
          const showCorrect = checked && option.isCorrect;
          const showIncorrect = checked && selected && !option.isCorrect;
          return <button key={option.id} type="button" disabled={checked} aria-pressed={selected} onClick={() => item.question.type === "multiple" ? toggleMultipleOption(option.id) : selectSingleOption(option.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition ${showCorrect ? "border-[#617786] bg-[#edf5eb] text-[#38613b]" : showIncorrect ? "border-[#c77463] bg-[#f8eae6] text-[#914d43]" : selected ? "border-[#f59e0b] bg-[#fff7e6] text-[#d97706]" : "border-[#172554]/10 text-[#172554] hover:border-[#f59e0b]"}`}><span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center border text-[10px] font-bold ${item.question.type === "multiple" ? "rounded-md" : "rounded-full"} ${showCorrect ? "border-[#617786] bg-[#617786] text-white" : showIncorrect ? "border-[#c77463] bg-[#c77463] text-white" : selected ? "border-[#f59e0b] bg-[#f59e0b] text-white" : "border-[#172554]/15 text-[#617786]"}`}>{showCorrect ? "✓" : showIncorrect ? "×" : selected ? "✓" : ""}</span>{option.body}</button>;
        })}{item.question.type === "multiple" && !checked ? <Button onClick={() => setChecked(true)} disabled={!selectedOptionIds.length} className="mt-3 rounded-full bg-[#172554]">Kiểm tra đáp án</Button> : null}{checked ? <FeedbackCard correct={optionAnswerCorrect} explanation={item.question.explanation} correctAnswer={item.options.filter(option => option.isCorrect).map(option => option.body).join(" · ")} /> : null}</div>}

        {item.question.type === "matching" ? <div className="mt-7"><FeedbackCard correct={activeMatchingResponse?.isCorrect ?? false} explanation={item.question.explanation} correctAnswer={activeMatchingPair?.right ?? ""} hidden={!activeMatchingResponse} /><Button onClick={matchingPairs.length ? advanceMatching : advanceQuestion} disabled={completePractice.isPending || (matchingPairs.length > 0 && !activeMatchingResponse)} className="mt-5 rounded-full bg-[#172554]">{matchingPairs.length === 0 ? "Bỏ qua câu thiếu cấu hình" : matchingIndex < matchingPairs.length - 1 ? "Cặp tiếp theo" : completePractice.isPending ? "Đang hoàn tất…" : "Hoàn tất luyện tập"} <RotateCcw size={15} /></Button></div> : <Button onClick={advanceQuestion} disabled={!checked || completePractice.isPending} className="mt-7 rounded-full bg-[#172554]">{index < (practice.data?.length ?? 0) - 1 ? "Câu tiếp theo" : completePractice.isPending ? "Đang hoàn tất…" : "Hoàn tất luyện tập"} <RotateCcw size={15} /></Button>}
      </section>
    </main>
  </PracticeShell>;
}

function MatchingPractice({ pairs, activeIndex, responses, options, candidateId, onPickCandidate, onDrop }: { pairs: ReturnType<typeof getPracticeMatchingPairs>; activeIndex: number; responses: Record<number, MatchingResponse>; options: Array<{ id: string; body: string }>; candidateId: string | null; onPickCandidate: (id: string | null) => void; onDrop: (id: string) => void }) {
  if (!pairs.length) return <div className="mt-7 rounded-2xl bg-[#f8eae6] p-4 text-sm leading-6 text-[#914d43]"><CircleAlert className="mb-2" size={18} /><strong>Thiếu cấu hình ghép nối.</strong><p className="mt-1">Câu hỏi này chưa có các cặp dữ liệu hợp lệ. Bạn có thể chuyển sang câu tiếp theo.</p></div>;
  const candidate = options.find(option => option.id === candidateId);
  return <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
    <div className="space-y-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#f59e0b]">Cột trái · thả phương án tương ứng</p>{pairs.map((pair, pairIndex) => {
      const response = responses[pairIndex];
      const isActive = pairIndex === activeIndex && !response;
      return <div key={`${pair.left}-${pair.right}`} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${response?.isCorrect ? "border-[#617786] bg-[#f1f8ef]" : response ? "border-[#d68a7a] bg-[#fcf0ec]" : isActive ? "border-[#fbbf24] bg-[#fff7e6]" : "border-[#172554]/8 bg-[#fff7e6] opacity-60"}`}><p className="text-sm font-bold leading-6 text-[#172554]">{pair.left}</p>{response ? <div className="text-xs leading-5"><p className={`font-bold ${response.isCorrect ? "text-[#38613b]" : "text-[#914d43]"}`}>{response.isCorrect ? "✓ Ghép đúng" : "× Chưa đúng"}: {response.answer}</p>{!response.isCorrect ? <p className="mt-1 text-[#617786]">Đáp án đúng: <strong>{pair.right}</strong></p> : null}</div> : <button type="button" disabled={!isActive || !candidate} onDragOver={event => { if (isActive) event.preventDefault(); }} onDrop={event => { event.preventDefault(); onDrop(event.dataTransfer.getData("text/plain")); }} onClick={() => candidateId && onDrop(candidateId)} className={`min-h-11 rounded-xl border border-dashed px-3 text-left text-xs font-semibold transition ${isActive ? "border-[#f59e0b] bg-white text-[#d97706] hover:bg-[#fff7e6]" : "border-[#172554]/10 text-[#617786]"}`}>{candidate ? `Ghép “${candidate.body}” vào hàng này` : isActive ? "Kéo phương án từ cột phải vào đây" : "Chờ đến lượt ghép"}</button>}</div>;
    })}</div>
    <div className="rounded-2xl bg-[#172554] p-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#fbbf24]">Cột phải · phương án đã xáo trộn</p><p className="mt-2 text-xs leading-5 text-[#eef4ff]">Kéo một phương án vào hàng đang sáng. Bạn cũng có thể chọn phương án rồi chạm vào vùng thả để thao tác bằng bàn phím hoặc trên thiết bị cảm ứng.</p><div className="mt-4 space-y-2">{options.map(option => { const used = Object.values(responses).some(response => response.optionId === option.id); return <button key={option.id} type="button" draggable={!used} disabled={used} onDragStart={event => event.dataTransfer.setData("text/plain", option.id)} onClick={() => onPickCandidate(candidateId === option.id ? null : option.id)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${used ? "cursor-not-allowed border-white/5 bg-white/5 text-white/35 line-through" : candidateId === option.id ? "border-[#fbbf24] bg-[#fbbf24] text-[#172554]" : "border-white/15 bg-white/8 text-white hover:border-[#fbbf24]/70"}`}><GripVertical size={14} className="shrink-0 opacity-70" />{option.body}</button>; })}</div></div>
  </div>;
}

function FeedbackCard({ correct, explanation, correctAnswer, hidden = false }: { correct: boolean; explanation: string | null; correctAnswer: string; hidden?: boolean }) {
  if (hidden) return null;
  return <div role="status" aria-live="polite" className={`mt-6 rounded-2xl p-4 text-sm leading-6 ${correct ? "bg-[#edf5eb] text-[#3b653e]" : "bg-[#f8eae6] text-[#617786]"}`}>{correct ? <CheckCircle2 aria-hidden="true" className="mb-2" size={18} /> : <CircleAlert aria-hidden="true" className="mb-2" size={18} />}<strong>{correct ? "Chính xác." : "Chưa đúng."}</strong>{!correct && correctAnswer ? <p className="mt-1">Đáp án đúng: <strong>{correctAnswer}</strong></p> : null}<p className="mt-1">{explanation ?? "Hãy đọc lại kiến thức liên quan và thử diễn giải đáp án đúng theo cách của bạn."}</p></div>;
}

function MessageCard({ icon, title, description, action }: { icon: "success" | "error"; title: string; description: string; action: React.ReactNode }) {
  const Icon = icon === "success" ? CheckCircle2 : CircleAlert;
  return <main className="container grid min-h-[70vh] place-items-center py-12"><div role="status" aria-live="polite" className="max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm"><Icon aria-hidden="true" className={`mx-auto ${icon === "success" ? "text-[#617786]" : "text-[#b76b5e]"}`} size={32} /><h1 className="mt-5 font-serif text-3xl font-semibold text-[#172554]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#617786]">{description}</p>{action}</div></main>;
}

function PracticeShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#fff7e6]"><SiteHeader />{children}</div>;
}

function getAcceptedAnswers(answerConfig: Record<string, unknown> | null | undefined) {
  const rawAnswers = answerConfig?.acceptedAnswers ?? answerConfig?.correctAnswer;
  return (Array.isArray(rawAnswers) ? rawAnswers : rawAnswers ? [rawAnswers] : []).filter((answer): answer is string => typeof answer === "string");
}
