import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShowcaseQuiz } from "@/data/demo";
import { ArrowUpRight, Award, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function QuizCard({ quiz, compact = false }: { quiz: ShowcaseQuiz; compact?: boolean }) {
  const isTesting = quiz.mode === "Kiểm tra";
  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-[#17334a]/10 bg-[#fffdf8] p-5 shadow-[0_12px_34px_rgba(22,43,62,.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(22,43,62,.11)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-serif font-bold" style={{ backgroundColor: `${quiz.accent}1f`, color: quiz.accent }}>{quiz.subject.slice(0, 1)}</span>
          <div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-[#8a7d67]">{quiz.category} · {quiz.lesson}</p><p className="mt-1 text-xs font-semibold text-[#1d3a50]">{quiz.subject}</p></div>
        </div>
        <Badge className={isTesting ? "border-0 bg-[#17364c] px-2.5 py-1 text-[10px] text-[#f8edcf]" : "border-0 bg-[#eaf0e6] px-2.5 py-1 text-[10px] text-[#486148]"}>{quiz.mode}</Badge>
      </div>
      <h3 className="font-serif text-[22px] font-semibold leading-[1.15] tracking-[-.035em] text-[#18344a]">{quiz.title}</h3>
      {!compact && <p className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#697685]">{quiz.summary}</p>}
      <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium text-[#506577]">
        <span className="rounded-full bg-[#f2f2ed] px-2.5 py-1">{quiz.difficulty}</span>
        <span className="flex items-center gap-1 rounded-full bg-[#f2f2ed] px-2.5 py-1"><Clock3 size={12} /> {quiz.duration}</span>
        <span className="rounded-full bg-[#f2f2ed] px-2.5 py-1">{quiz.questionCount} câu</span>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#17334a]/8 pt-4">
        <div>{isTesting ? <p className="flex items-center gap-1 text-xs font-bold text-[#9b7130]"><Sparkles size={13} /> {quiz.points} Point</p> : <p className="flex items-center gap-1 text-xs font-bold text-[#547453]"><Award size={13} /> Thưởng {quiz.reward} Point</p>}<p className="mt-1 flex items-center gap-1 text-[10px] text-[#78818a]">{quiz.tier !== "Basic" && <LockKeyhole size={10} />}{quiz.tier}</p></div>
        <Button asChild variant="ghost" className="h-9 rounded-full px-3 text-xs font-bold text-[#1e3d54] hover:bg-[#e9edf0]"><Link href={`/quiz/${quiz.id}`} aria-label={`Mở ${quiz.title}`}>Làm bài <ArrowUpRight size={15} /></Link></Button>
      </div>
    </article>
  );
}
