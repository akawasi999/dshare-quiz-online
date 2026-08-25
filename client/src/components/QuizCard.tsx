import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AuthActionLink from "@/components/AuthActionLink";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShowcaseQuiz } from "@/data/demo";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { formatPublicationDateTime, isQuizNew } from "@shared/quizFreshness";
import { ArrowUpRight, Award, Clock3, Flame, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function QuizCard({ quiz, compact = false }: { quiz: ShowcaseQuiz; compact?: boolean }) {
  const isTesting = quiz.mode === "Kiểm tra";
  const isNew = isQuizNew(quiz.createdAt);
  const publicationDateTime = formatPublicationDateTime(quiz.createdAt);
  const [coverLoaded, setCoverLoaded] = useState(!quiz.coverImage);
  const topicPath = quiz.topicPath || [quiz.category, quiz.subject, quiz.lesson].filter(Boolean).join(" › ");
  useEffect(() => { setCoverLoaded(!quiz.coverImage); }, [quiz.coverImage]);
  const newBadge = isNew ? <Tooltip><TooltipTrigger asChild><span tabIndex={0} className="cursor-help rounded-full bg-danger px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-white shadow-[var(--shadow-sm)] outline-none focus-visible:ring-4 focus-visible:ring-danger/20">Mới</span></TooltipTrigger><TooltipContent side="top" sideOffset={7} className="max-w-60 bg-foreground text-background">Công bố lúc {publicationDateTime}</TooltipContent></Tooltip> : null;
  const trendingBadge = quiz.isTrending ? <Badge variant="warning" className="border-0 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] shadow-[var(--shadow-sm)]"><Flame size={12} /> Thịnh hành</Badge> : null;
  const tierBadge = <Badge className={cn("border-0 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] shadow-[var(--shadow-sm)]", quiz.tier === "Premium" ? "bg-[linear-gradient(135deg,#6d28d9,#a855f7)] text-white" : quiz.tier === "Pro" ? "bg-[linear-gradient(135deg,#0369a1,#0ea5e9)] text-white" : "bg-[linear-gradient(135deg,#047857,#10b981)] text-white")}>{quiz.tier}</Badge>;

  return (
    <article aria-busy={quiz.coverImage ? !coverLoaded : undefined} className="quiz-card-enter group overflow-hidden rounded-[var(--radius-xl-token)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[var(--shadow-lg)] focus-within:border-primary/45 focus-within:shadow-[var(--shadow-md)]">
      {quiz.coverImage ? <div className="relative h-32 overflow-hidden bg-muted">{!coverLoaded ? <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,var(--muted)_8%,var(--surface)_18%,var(--muted)_33%)]" /> : null}<img src={quiz.coverImage} onLoad={() => setCoverLoaded(true)} onError={() => setCoverLoaded(true)} alt={`Ảnh bìa ${quiz.title}`} className={cn("h-full w-full object-cover transition-[transform,opacity] duration-300 group-hover:scale-105", coverLoaded ? "opacity-100" : "opacity-0")} /><div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />{isNew || quiz.isTrending ? <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{newBadge}{trendingBadge}</div> : null}<div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3"><p className="truncate text-[10px] font-bold tracking-[.12em] text-white">{topicPath}</p>{tierBadge}</div></div> : null}
      <div className="p-5">
        {!quiz.coverImage ? <div className="mb-4 flex items-start justify-between gap-3"><p className="min-w-0 truncate text-[10px] font-bold tracking-[.12em] text-primary">{topicPath}</p><div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{newBadge}{trendingBadge}{tierBadge}</div></div> : null}
        <h3 className="text-xl font-bold leading-tight tracking-[-.025em] text-foreground transition-colors group-hover:text-primary">{quiz.title}</h3>
        {!compact ? <p className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-5 text-text-secondary">{quiz.summary}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium text-text-secondary"><span className="rounded-full bg-muted px-2.5 py-1">{quiz.difficulty}</span><span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock3 size={12} /> {quiz.duration}</span><span className="rounded-full bg-muted px-2.5 py-1">{quiz.questionCount} câu</span><span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><UsersRound size={12} /> {typeof quiz.attemptCount === "number" ? `${quiz.attemptCount.toLocaleString("vi-VN")} lượt làm` : "Mới phát hành"}</span></div>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-light pt-4"><p className="inline-flex items-center gap-1 rounded-full bg-success/12 px-3 py-1.5 text-xs font-bold text-success"><Award size={13} /> {isTesting ? `Phí vào ${quiz.points} Point` : `Thưởng ${quiz.reward} Point`}</p><Button asChild size="sm" className="cta-gradient shrink-0 rounded-full px-4 text-xs font-extrabold shadow-[0_8px_18px_color-mix(in_srgb,var(--primary)_28%,transparent)]"><AuthActionLink href={`${ROUTES.quiz}/${quiz.id}`} aria-label={`Làm bài: ${quiz.title}`}>Làm bài <ArrowUpRight size={15} /></AuthActionLink></Button></div>
      </div>
    </article>
  );
}
