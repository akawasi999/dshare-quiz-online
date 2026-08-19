import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShowcaseQuiz } from "@/data/demo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPublicationDateTime, formatRelativePublicationTime, isQuizNew } from "@shared/quizFreshness";
import { ArrowUpRight, Award, Clock3, LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import { Link } from "wouter";

export default function QuizCard({ quiz, compact = false }: { quiz: ShowcaseQuiz; compact?: boolean }) {
  const isTesting = quiz.mode === "Kiểm tra";
  const isNew = isQuizNew(quiz.createdAt);
  const relativePublicationTime = formatRelativePublicationTime(quiz.createdAt);
  const publicationDateTime = formatPublicationDateTime(quiz.createdAt);
  const newBadge = isNew ? <Tooltip><TooltipTrigger asChild><span tabIndex={0} className="cursor-help rounded-full bg-[#de1264] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white/90">Mới</span></TooltipTrigger><TooltipContent side="top" sideOffset={7} className="max-w-60 bg-[#141432] text-white">Công bố lúc {publicationDateTime}</TooltipContent></Tooltip> : null;
  return (
    <article className="group overflow-hidden rounded-[26px] border border-[#172554]/10 bg-[#fff7e6] shadow-[0_12px_34px_rgba(22,43,62,.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(22,43,62,.11)]">
      {quiz.coverImage ? <div className="relative h-32 overflow-hidden bg-[#ebf4ff]"><img src={quiz.coverImage} alt={`Ảnh bìa ${quiz.title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#141432]/55 via-transparent to-transparent" />{isNew ? <div className="absolute left-3 top-3">{newBadge}</div> : null}<div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3"><p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-white">{quiz.category} · {quiz.lesson}</p><Badge className={isTesting ? "shrink-0 border-0 bg-[#141432] px-2.5 py-1 text-[10px] text-white" : "shrink-0 border-0 bg-white/90 px-2.5 py-1 text-[10px] text-[#141432]"}>{quiz.mode}</Badge></div></div> : null}
      <div className="p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-serif font-bold" style={{ backgroundColor: `${quiz.accent}1f`, color: quiz.accent }}>{quiz.subject.slice(0, 1)}</span>
          <div className="min-w-0">{!quiz.coverImage && <p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-[#f59e0b]">{quiz.category} · {quiz.lesson}</p>}<p className={quiz.coverImage ? "text-xs font-semibold text-[#172554]" : "mt-1 text-xs font-semibold text-[#172554]"}>{quiz.subject}</p></div>
        </div>
        {!quiz.coverImage && <div className="flex shrink-0 items-center gap-1.5">{newBadge}<Badge className={isTesting ? "border-0 bg-[#172554] px-2.5 py-1 text-[10px] text-[#fff7e6]" : "border-0 bg-[#eaf0e6] px-2.5 py-1 text-[10px] text-[#172554]"}>{quiz.mode}</Badge></div>}
      </div>
      <h3 className="font-serif text-[22px] font-semibold leading-[1.15] tracking-[-.035em] text-[#172554]">{quiz.title}</h3>
      {!compact && <p className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#617786]">{quiz.summary}</p>}
      <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium text-[#617786]">
        <span className="rounded-full bg-[#fff7e6] px-2.5 py-1">{quiz.difficulty}</span>
        <span className="flex items-center gap-1 rounded-full bg-[#fff7e6] px-2.5 py-1"><Clock3 size={12} /> {quiz.duration}</span>
        <span className="rounded-full bg-[#fff7e6] px-2.5 py-1">{quiz.questionCount} câu</span>
        <span className="flex items-center gap-1 rounded-full bg-[#fff7e6] px-2.5 py-1"><UsersRound size={12} /> {typeof quiz.attemptCount === "number" ? `${quiz.attemptCount.toLocaleString("vi-VN")} lượt làm` : "Mới phát hành"}</span>
        {relativePublicationTime ? <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 font-semibold text-[#065be5]">{relativePublicationTime}</span> : null}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#172554]/8 pt-4">
        <div><p className="inline-flex items-center gap-1 rounded-full bg-[#e8f6fd] px-3 py-1.5 text-xs font-bold text-[#007453]"><Award size={13} /> {isTesting ? `Phí vào ${quiz.points} Point` : `Thưởng ${quiz.reward} Point`}</p><p className="mt-2 flex items-center gap-1 text-[10px] text-[#617786]">{quiz.tier !== "Basic" && <LockKeyhole size={10} />}{quiz.tier}</p></div>
        <Button asChild variant="ghost" className="h-9 rounded-full px-3 text-xs font-bold text-[#172554] hover:bg-[#eef4ff]"><Link href={`/quiz/${quiz.id}`} aria-label={`Mở ${quiz.title}`}>Làm bài <ArrowUpRight size={15} /></Link></Button>
      </div>
      </div>
    </article>
  );
}
