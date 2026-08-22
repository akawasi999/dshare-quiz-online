import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Archive, ChevronDown, ChevronRight, CircleDotDashed, Edit3, FolderPlus, FolderTree, Loader2, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TopicRow = { id: number; name: string; slug: string; parentId: number | null; path: string; depth: number; sortOrder: number; status: "active" | "archived"; allowQuizCreation: boolean; requireQuizModeration: boolean; version: number; quizCount: number; childCount: number; updatedAt: Date };
type TopicForm = { name: string; slug: string; parentId: string; status: "active" | "archived"; allowQuizCreation: boolean; requireQuizModeration: boolean };

const emptyForm: TopicForm = { name: "", slug: "", parentId: "root", status: "active", allowQuizCreation: true, requireQuizModeration: false };

function topicSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TopicManagementPanel() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(() => new Set());
  const [bulkAllowQuizCreation, setBulkAllowQuizCreation] = useState(true);
  const [bulkRequireQuizModeration, setBulkRequireQuizModeration] = useState(false);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; topic?: TopicRow } | null>(null);
  const [form, setForm] = useState<TopicForm>(emptyForm);
  const [urlError, setUrlError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TopicRow | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const topics = trpc.admin.learning.topics.tree.useQuery({ status: statusFilter });
  const createTopic = trpc.admin.learning.topics.create.useMutation({ onSuccess: result => { toast.success(`Đã tạo Chủ đề “${result.name}”.`); utils.admin.learning.topics.tree.invalidate(); setDialog(null); }, onError: error => toast.error("Không thể tạo Chủ đề", { description: error.message }) });
  const updateTopic = trpc.admin.learning.topics.update.useMutation({ onSuccess: () => { toast.success("Đã cập nhật Chủ đề."); utils.admin.learning.topics.tree.invalidate(); setDialog(null); }, onError: error => toast.error("Không thể cập nhật Chủ đề", { description: error.message }) });
  const archiveTopic = trpc.admin.learning.topics.archive.useMutation({ onSuccess: () => { toast.success("Đã archive Chủ đề."); utils.admin.learning.topics.tree.invalidate(); }, onError: error => toast.error("Không thể archive Chủ đề", { description: error.message }) });
  const removeTopic = trpc.admin.learning.topics.remove.useMutation({ onSuccess: () => { toast.success("Đã chuyển Chủ đề vào lưu trữ mềm."); utils.admin.learning.topics.tree.invalidate(); setPendingDelete(null); setDeleteReason(""); }, onError: error => toast.error("Không thể xóa Chủ đề", { description: error.message }) });
  const bulkUpdateQuizPolicies = trpc.admin.learning.topics.bulkUpdateQuizPolicies.useMutation({ onSuccess: result => { toast.success(`Đã cập nhật chính sách Quiz cho ${result.affected} Chủ đề.`); utils.admin.learning.topics.tree.invalidate(); setSelectedTopics(new Set()); }, onError: error => toast.error("Không thể cập nhật hàng loạt", { description: error.message }) });

  const proposedUrl = topicSlug(form.slug || form.name);
  const urlAvailability = trpc.admin.learning.topics.checkUrl.useQuery({ url: proposedUrl, excludeTopicId: dialog?.mode === "edit" ? dialog.topic?.id : undefined }, { enabled: Boolean(dialog && proposedUrl) });
  const urlTaken = Boolean(proposedUrl && urlAvailability.data && !urlAvailability.data.available);

  const allTopics = (topics.data?.items ?? []) as TopicRow[];
  const topicByParent = useMemo(() => allTopics.reduce<Map<number | null, TopicRow[]>>((map, topic) => { const list = map.get(topic.parentId) ?? []; list.push(topic); map.set(topic.parentId, list); return map; }, new Map()), [allTopics]);
  const matchingIds = useMemo(() => {
    if (!search.trim()) return new Set(allTopics.map(topic => topic.id));
    const normalized = search.trim().toLocaleLowerCase("vi");
    const ids = new Set<number>();
    for (const topic of allTopics) if (topic.name.toLocaleLowerCase("vi").includes(normalized) || topic.slug.toLocaleLowerCase("vi").includes(normalized)) { ids.add(topic.id); for (const ancestorId of topic.path.split("/").filter(Boolean).map(Number)) ids.add(ancestorId); }
    return ids;
  }, [allTopics, search]);

  const openCreate = (parent?: TopicRow) => { setDialog({ mode: "create" }); setUrlError(""); setForm({ ...emptyForm, parentId: parent ? String(parent.id) : "root" }); };
  const openEdit = (topic: TopicRow) => { setDialog({ mode: "edit", topic }); setUrlError(""); setForm({ name: topic.name, slug: topic.slug, parentId: topic.parentId ? String(topic.parentId) : "root", status: topic.status, allowQuizCreation: topic.allowQuizCreation, requireQuizModeration: topic.requireQuizModeration }); };
  const submit = async () => {
    const name = form.name.trim();
    if (!name) return toast.error("Hãy nhập tên Chủ đề.");
    const slug = form.slug.trim() || topicSlug(name);
    const availability = await urlAvailability.refetch();
    if (!availability.data?.available) { setUrlError("URL đã có"); return; }
    const parentId = form.parentId === "root" ? null : Number(form.parentId);
    if (dialog?.mode === "create") createTopic.mutate({ name, slug, parentId, status: form.status, allowQuizCreation: form.allowQuizCreation, requireQuizModeration: form.requireQuizModeration });
    if (dialog?.mode === "edit" && dialog.topic) updateTopic.mutate({ topicId: dialog.topic.id, name, slug, parentId, status: form.status, allowQuizCreation: form.allowQuizCreation, requireQuizModeration: form.requireQuizModeration, version: dialog.topic.version, reason: "Cập nhật taxonomy từ CPanel" });
  };
  const toggleTopicSelection = (topicId: number, checked: boolean) => setSelectedTopics(current => { const next = new Set(current); if (checked) next.add(topicId); else next.delete(topicId); return next; });
  const renderNode = (topic: TopicRow) => {
    if (!matchingIds.has(topic.id)) return null;
    const children = (topicByParent.get(topic.id) ?? []).filter(child => matchingIds.has(child.id));
    const isOpen = search ? true : expanded.has(topic.id);
    return <div key={topic.id} className="relative" style={{ marginLeft: `${topic.depth * 20}px` }}>
      <div className="group flex min-h-14 items-center gap-2 rounded-[var(--radius-md-token)] px-2 py-1.5 transition-colors hover:bg-muted">
        <Checkbox checked={selectedTopics.has(topic.id)} onCheckedChange={checked => toggleTopicSelection(topic.id, checked === true)} aria-label={`Chọn Chủ đề ${topic.name}`} />
        <button type="button" onClick={() => setExpanded(current => { const next = new Set(current); if (next.has(topic.id)) next.delete(topic.id); else next.add(topic.id); return next; })} aria-label={children.length ? `${isOpen ? "Thu gọn" : "Mở rộng"} ${topic.name}` : `${topic.name} không có chủ đề con`} disabled={!children.length} className="grid size-7 shrink-0 place-items-center rounded-md text-text-secondary hover:bg-surface hover:text-primary disabled:opacity-30">{children.length ? isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} /> : <CircleDotDashed size={14} />}</button>
        <div className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm-token)] bg-primary-light text-primary"><FolderTree size={16} /></div>
        <button type="button" onClick={() => openEdit(topic)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-foreground">{topic.name}</p><p className="mt-0.5 truncate text-xs text-text-secondary">/{topic.slug} · {topic.childCount} chủ đề con · {topic.quizCount} Quiz</p></button>
        <div className="hidden flex-wrap items-center justify-end gap-1 sm:flex"><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${topic.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{topic.status === "active" ? "Hoạt động" : "Archive"}</span>{!topic.allowQuizCreation ? <span className="rounded-full bg-danger/10 px-2 py-1 text-[10px] font-bold text-danger">Tắt tạo Quiz</span> : null}{topic.requireQuizModeration ? <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning"><ShieldCheck size={11} />Duyệt Quiz</span> : null}</div>
        <div className="hidden items-center gap-1 group-hover:flex"><Button type="button" variant="ghost" size="icon" onClick={() => openCreate(topic)} aria-label={`Tạo Chủ đề con cho ${topic.name}`}><FolderPlus size={16} /></Button><Button type="button" variant="ghost" size="icon" onClick={() => openEdit(topic)} aria-label={`Sửa ${topic.name}`}><Edit3 size={16} /></Button>{topic.status === "active" ? <Button type="button" variant="ghost" size="icon" onClick={() => archiveTopic.mutate({ topicId: topic.id, version: topic.version, reason: "Archive từ CPanel" })} aria-label={`Archive ${topic.name}`}><Archive size={16} /></Button> : null}<Button type="button" variant="ghost" size="icon" onClick={() => { setPendingDelete(topic); setDeleteReason(""); }} aria-label={`Xóa ${topic.name}`} className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></Button></div>
      </div>
      {isOpen ? children.map(renderNode) : null}
    </div>;
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex justify-end"><Button onClick={() => openCreate()} className="cta-gradient"><Plus size={16} />Tạo Chủ đề</Button></div>
    {selectedTopics.size ? <section className="flex flex-col gap-4 rounded-[var(--radius-lg-token)] border border-primary/20 bg-primary-light/45 p-4 lg:flex-row lg:items-center lg:justify-between"><p className="text-sm font-semibold text-foreground">Đã chọn {selectedTopics.size} Chủ đề</p><div className="flex flex-wrap items-center gap-4"><div className="flex items-center gap-2"><Switch id="bulk-allow-quiz" checked={bulkAllowQuizCreation} onCheckedChange={setBulkAllowQuizCreation} /><Label htmlFor="bulk-allow-quiz" className="text-xs font-medium">Cho phép tạo Quiz</Label></div><div className="flex items-center gap-2"><Switch id="bulk-require-moderation" checked={bulkRequireQuizModeration} onCheckedChange={setBulkRequireQuizModeration} /><Label htmlFor="bulk-require-moderation" className="text-xs font-medium">Yêu cầu kiểm duyệt</Label></div><Button size="sm" onClick={() => bulkUpdateQuizPolicies.mutate({ topicIds: Array.from(selectedTopics), allowQuizCreation: bulkAllowQuizCreation, requireQuizModeration: bulkRequireQuizModeration, reason: "Cập nhật hàng loạt chính sách Quiz từ CPanel" })} disabled={bulkUpdateQuizPolicies.isPending}>{bulkUpdateQuizPolicies.isPending ? <Loader2 className="animate-spin" size={15} /> : null}Áp dụng</Button><Button size="sm" variant="ghost" onClick={() => setSelectedTopics(new Set())}>Bỏ chọn</Button></div></section> : null}
    <section className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Tìm theo tên hoặc slug Chủ đề…" /></div><Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}><SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem><SelectItem value="active">Đang hoạt động</SelectItem><SelectItem value="archived">Đã archive</SelectItem></SelectContent></Select></div></section>
    <section className="overflow-hidden rounded-[var(--radius-lg-token)] border border-border bg-surface shadow-[var(--shadow-sm)]"><div className="flex items-center justify-between border-b border-border px-5 py-4"><p className="text-xs text-text-secondary">{allTopics.length} Chủ đề · cập nhật {topics.data?.refreshedAt ? new Date(topics.data.refreshedAt).toLocaleTimeString("vi-VN") : "—"}</p><Button variant="ghost" size="sm" onClick={() => topics.refetch()}>Làm mới</Button></div><div className="p-3">{topics.isLoading ? <div className="grid min-h-64 place-items-center text-sm text-text-secondary"><Loader2 className="mr-2 animate-spin" size={18} />Đang tải Chủ đề…</div> : topics.isError ? <div className="grid min-h-64 place-items-center text-center"><div><p className="text-sm font-semibold text-danger">Không thể tải Chủ đề.</p><Button variant="outline" className="mt-3" onClick={() => topics.refetch()}>Thử lại</Button></div></div> : allTopics.length ? (topicByParent.get(null) ?? []).map(renderNode) : <div className="grid min-h-64 place-items-center text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-light text-primary"><FolderTree size={22} /></div><h3 className="mt-4 text-base font-semibold text-foreground">Chưa có Chủ đề nào</h3><Button className="mt-4" onClick={() => openCreate()}><Plus size={16} />Tạo Chủ đề</Button></div></div>}</div></section>
    <Dialog open={Boolean(dialog)} onOpenChange={open => { if (!open) setDialog(null); }}><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Cập nhật Chủ đề" : "Tạo Chủ đề mới"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label htmlFor="topic-name">Tên Chủ đề</Label><Input id="topic-name" value={form.name} onChange={event => { setUrlError(""); setForm(current => ({ ...current, name: event.target.value, slug: current.slug || topicSlug(event.target.value) })); }} className="mt-1.5" placeholder="Ví dụ: Tin học văn phòng" /></div><div><Label htmlFor="topic-url">URL</Label><Input id="topic-url" value={form.slug} onChange={event => { setUrlError(""); setForm(current => ({ ...current, slug: topicSlug(event.target.value) })); }} className="mt-1.5" placeholder="tin-hoc-van-phong" aria-invalid={urlTaken || Boolean(urlError)} />{urlTaken || urlError ? <p className="mt-1.5 text-xs font-medium text-danger">URL đã có</p> : null}</div><div><Label>Parent</Label><Select value={form.parentId} onValueChange={value => setForm(current => ({ ...current, parentId: value }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="root">Không có — Chủ đề gốc</SelectItem>{allTopics.filter(topic => topic.id !== dialog?.topic?.id && !topic.path.startsWith(dialog?.topic?.path ?? "//")).map(topic => <SelectItem key={topic.id} value={String(topic.id)}>{"— ".repeat(topic.depth)}{topic.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Trạng thái</Label><Select value={form.status} onValueChange={value => setForm(current => ({ ...current, status: value as TopicForm["status"] }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Đang hoạt động</SelectItem><SelectItem value="archived">Archive</SelectItem></SelectContent></Select></div><div className="space-y-3 rounded-[var(--radius-md-token)] border border-border bg-muted p-4"><div className="flex items-center justify-between gap-4"><Label htmlFor="topic-allow-quiz" className="cursor-pointer text-sm font-medium">Cho phép tạo Quiz ở chủ đề này</Label><Switch id="topic-allow-quiz" checked={form.allowQuizCreation} onCheckedChange={checked => setForm(current => ({ ...current, allowQuizCreation: checked }))} /></div><div className="flex items-center justify-between gap-4"><Label htmlFor="topic-quiz-moderation" className="cursor-pointer text-sm font-medium">Kiểm duyệt Quiz mới được đăng trong chủ đề</Label><Switch id="topic-quiz-moderation" checked={form.requireQuizModeration} onCheckedChange={checked => setForm(current => ({ ...current, requireQuizModeration: checked }))} /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Hủy</Button><Button onClick={submit} disabled={createTopic.isPending || updateTopic.isPending || urlAvailability.isFetching}>{createTopic.isPending || updateTopic.isPending ? <Loader2 className="animate-spin" size={16} /> : null}{dialog?.mode === "edit" ? "Lưu thay đổi" : "Tạo Chủ đề"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(pendingDelete)} onOpenChange={open => { if (!open) setPendingDelete(null); }}><DialogContent><DialogHeader><DialogTitle>Xóa mềm Chủ đề</DialogTitle><DialogDescription>{pendingDelete ? `“${pendingDelete.name}” chỉ có thể xóa khi không còn Chủ đề con hoặc Quiz liên kết.` : ""}</DialogDescription></DialogHeader><div><Label htmlFor="delete-reason">Lý do</Label><Input id="delete-reason" value={deleteReason} onChange={event => setDeleteReason(event.target.value)} className="mt-1.5" placeholder="Ví dụ: Chủ đề trùng lặp" /></div><DialogFooter><Button variant="outline" onClick={() => setPendingDelete(null)}>Hủy</Button><Button variant="destructive" disabled={!pendingDelete || deleteReason.trim().length < 3 || removeTopic.isPending} onClick={() => pendingDelete && removeTopic.mutate({ topicId: pendingDelete.id, version: pendingDelete.version, reason: deleteReason.trim() })}>{removeTopic.isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}Xóa Chủ đề</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
