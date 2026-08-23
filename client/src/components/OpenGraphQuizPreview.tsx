import { ExternalLink, Link2, RefreshCw, Share2 } from "lucide-react";

const siteOrigin = "https://dsharequiz-jxleeaps.manus.space";
const defaultCoverUrl = "/manus-storage/dshare-default-quiz-cover_d96ff2fa.png";
const titleLimit = 70;
const descriptionLimit = 200;

export type OpenGraphQuiz = { id: number; title: string; summary?: string | null; coverImageUrl?: string | null; status?: string };

function CharacterCounter({ label, value, limit }: { label: string; value: string; limit: number }) {
  const status = value.length > limit ? "over" : value.length >= Math.round(limit * 0.9) ? "near" : "good";
  const tone = status === "over" ? "text-danger" : status === "near" ? "text-warning" : "text-text-muted";
  const note = status === "over" ? `Vượt ${value.length - limit} ký tự; mạng xã hội có thể cắt bớt.` : status === "near" ? "Gần giới hạn hiển thị khuyến nghị." : "Trong giới hạn hiển thị khuyến nghị.";
  return <div className="rounded-[var(--radius-sm-token)] border border-border bg-surface px-3 py-2"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-text-secondary">{label}</span><output className={`font-mono text-[10px] font-bold ${tone}`}>{value.length}/{limit}</output></div><p className={`mt-1 text-[10px] leading-4 ${tone}`}>{note}</p></div>;
}

export default function OpenGraphQuizPreview({ quiz }: { quiz: OpenGraphQuiz }) {
  const url = `${siteOrigin}/quiz/${quiz.id}`;
  const imageUrl = quiz.coverImageUrl || defaultCoverUrl;
  const socialTitle = `${quiz.title} · Dshare Quiz Online`;
  const socialDescription = quiz.summary?.trim() || "Làm Quiz và ôn tập trực tuyến trên Dshare Quiz Online.";
  const facebookDebuggerUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`;
  const linkedInInspectorUrl = `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`;
  return <section className="overflow-hidden rounded-[var(--radius-md-token)] border border-border bg-muted/45"><div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3"><div className="flex items-center gap-2"><Share2 size={15} className="text-primary" /><div><p className="text-xs font-semibold text-foreground">Xem trước Open Graph</p><p className="mt-0.5 text-[10px] text-text-muted">Thẻ chia sẻ cho URL công khai của Quiz</p></div></div><a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-primary hover:bg-primary-light"><ExternalLink size={13} />Mở</a></div><div className="grid gap-4 p-4 sm:grid-cols-[170px_minmax(0,1fr)]"><div className="grid aspect-[1.91/1] place-items-center overflow-hidden rounded-[var(--radius-sm-token)] bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white"><img src={imageUrl} alt={`Ảnh chia sẻ ${quiz.title}`} className="size-full object-cover" /></div><div className="min-w-0"><p className="truncate text-[10px] font-semibold text-text-muted">dsharequiz-jxleeaps.manus.space</p><h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-foreground">{socialTitle}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{socialDescription}</p><p className="mt-3 flex items-center gap-1 truncate font-mono text-[10px] text-text-muted"><Link2 size={12} />{url}</p>{!quiz.coverImageUrl ? <p className="mt-2 text-[10px] text-primary">Đang dùng ảnh bìa mặc định của Dshare cho thẻ chia sẻ.</p> : null}</div></div><div className="grid gap-2 border-t border-border bg-muted/40 px-4 py-3 sm:grid-cols-2"><CharacterCounter label="Tiêu đề Open Graph" value={socialTitle} limit={titleLimit} /><CharacterCounter label="Mô tả Open Graph" value={socialDescription} limit={descriptionLimit} /></div><div className="flex flex-wrap gap-2 border-t border-border bg-surface px-4 py-3"><a href={facebookDebuggerUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light" aria-label="Làm mới cache Facebook cho Quiz này"><RefreshCw size={13} />Làm mới Facebook</a><a href={linkedInInspectorUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light" aria-label="Làm mới cache LinkedIn cho Quiz này"><RefreshCw size={13} />Làm mới LinkedIn</a><p className="basis-full text-[10px] leading-4 text-text-muted">Các công cụ chính thức sẽ mở trong tab mới để yêu cầu mạng xã hội thu thập lại metadata của URL này.</p></div></section>;
}
