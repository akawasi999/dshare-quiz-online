import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Archive, ChevronDown, ChevronRight, CircleDotDashed, Edit3, FolderPlus, FolderTree, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TopicRow = { id: number; name: string; slug: string; parentId: number | null; path: string; depth: number; sortOrder: number; status: "active" | "archived"; version: number; quizCount: number; childCount: number; updatedAt: Date };
type TopicForm = { name: string; slug: string; parentId: string; status: "active" | "archived" };

const emptyForm: TopicForm = { name: "", slug: "", parentId: "root", status: "active" };

function topicSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TopicManagementPanel() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; topic?: TopicRow } | null>(null);
  const [form, setForm] = useState<TopicForm>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<TopicRow | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const topics = trpc.admin.learning.topics.tree.useQuery({ status: statusFilter });
  const createTopic = trpc.admin.learning.topics.create.useMutation({ onSuccess: result => { toast.success(`Đã tạo Chủ đề “${result.name}”.`); utils.admin.learning.topics.tree.invalidate(); setDialog(null); }, onError: error => toast.error("Không thể tạo Chủ đề", { description: error.message }) });
  const updateTopic = trpc.admin.learning.topics.update.useMutation({ onSuccess: () => { toast.success("Đã cập nhật Chủ đề."); utils.admin.learning.topics.tree.invalidate(); setDialog(null); }, onError: error => toast.error("Không thể cập nhật Chủ đề", { description: error.message }) });
  const archiveTopic = trpc.admin.learning.topics.archive.useMutation({ onSuccess: () => { toast.success("Đã archive Chủ đề."); utils.admin.learning.topics.tree.invalidate(); }, onError: error => toast.error("Không thể archive Chủ đề", { description: error.message }) });
  const removeTopic = trpc.admin.learning.topics.remove.useMutation({ onSuccess: () => { toast.success("Đã chuyển Chủ đề vào lưu trữ mềm."); utils.admin.learning.topics.tree.invalidate(); setPendingDelete(null); setDeleteReason(""); }, onError: error => toast.error("Không thể xóa Chủ đề", { description: error.message }) });

  const allTopics = (topics.data?.items ?? []) as TopicRow[];
  const topicByParent = useMemo(() => allTopics.reduce<Map<number | null, TopicRow[]>>((map, topic) => { const list = map.get(topic.parentId) ?? []; list.push(topic); map.set(topic.parentId, list); return map; }, new Map()), [allTopics]);
  const matchingIds = useMemo(() => {
    if (!search.trim()) return new Set(allTopics.map(topic => topic.id));
    const normalized = search.trim().toLocaleLowerCase("vi");
    const ids = new Set<number>();
    for (const topic of allTopics) if (topic.name.toLocaleLowerCase("vi").includes(normalized) || topic.slug.toLocaleLowerCase("vi").includes(normalized)) { ids.add(topic.id); for (const ancestorId of topic.path.split("/").filter(Boolean).map(Number)) ids.add(ancestorId); }
    return ids;
  }, [allTopics, search]);

  const openCreate = (parent?: TopicRow) => { setDialog({ mode: "create" }); setForm({ ...emptyForm, parentId: parent ? String(parent.id) : "root" }); };
  const openEdit = (topic: TopicRow) => { setDialog({ mode: "edit", topic }); setForm({ name: topic.name, slug: topic.slug, parentId: topic.parentId ? String(topic.parentId) : "root", status: topic.status }); };
  const submit = () => {
    const name = form.name.trim();
    if (!name) return toast.error("Hãy nhập tên Chủ đề.");
    const slug = form.slug.trim() || topicSlug(name);
    const parentId = form.parentId === "root" ? null : Number(form.parentId);
    if (dialog?.mode === "create") createTopic.mutate({ name, slug, parentId, status: form.status });
    if (dialog?.mode === "edit" && dialog.topic) updateTopic.mutate({ topicId: dialog.topic.id, name, slug, parentId, status: form.status, version: dialog.topic.version, reason: "Cập nhật taxonomy từ CPanel" });
  };
  const renderNode = (topic: TopicRow) => {
    if (!matchingIds.has(topic.id)) return null;
    const children = (topicByParent.get(topic.id) ?? []).filter(child => matchingIds.has(child.id));
    const isOpen = search ? true : expanded.has(topic.id);
    return <div key={topic.id} className="relative" style={{ marginLeft: `${topic.depth * 20}px` }}>
      <div className="group flex min-h-14 items-center gap-2 rounded-[var(--radius-md-token)] px-2 py-1.5 transition-colors hover:bg-muted">
        <button type="button" onClick={() => setExpanded(current => { const next = new Set(current); if (next.has(topic.id)) next.delete(topic.id); else next.add(topic.id); return next; })} aria-label={children.length ? `${isOpen ? "Thu gọn" : "Mở rộng"} ${topic.name}` : `${topic.name} không có chủ đề con`} disabled={!children.length} className="grid size-7 shrink-0 place-items-center rounded-md text-text-secondary hover:bg-surface hover:text-primary disabled:opacity-30">{children.length ? isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} /> : <CircleDotDashed size={14} />}</button>
        <div className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm-token)] bg-primary-light text-primary"><FolderTree size={16} /></div>
        <button type="button" onClick={() => openEdit(topic)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-foreground">{topic.name}</p><p className="mt-0.5 truncate text-xs text-text-secondary">/{topic.slug} · {topic.childCount} chủ đề con · {topic.quizCount} Quiz</p></button>
        <span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${topic.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{topic.status === "active" ? "Hoạt động" : "Archive"}</span>
        <div className="hidden items-center gap-1 group-hover:flex"><Button type="button" variant="ghost" size="icon" onClick={() => openCreate(topic)} aria-label={`Tạo Chủ đề con cho ${topic.name}`}><FolderPlus size={16} /></Button><Button type="button" variant="ghost" size="icon" onClick={() => openEdit(topic)} aria-label={`Sửa ${topic.name}`}><Edit3 size={16} /></Button>{topic.status === "active" ? <Button type="button" variant="ghost" size="icon" onClick={() => archiveTopic.mutate({ topicId: topic.id, version: topic.version, reason: "Archive từ CPanel" })} aria-label={`Archive ${topic.name}`}><Archive size={16} /></Button> : null}<Button type="button" variant="ghost" size="icon" onClick={() => { setPendingDelete(topic); setDeleteReason(""); }} aria-label={`Xóa ${topic.name}`} className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></Button></div>
      </div>
      {isOpen ? children.map(renderNode) : null}
    </div>;
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">Learning · Taxonomy</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Quản lý Chủ đề</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Tổ chức cây Chủ đề cha–con cho toàn bộ Quiz. Các thay đổi cấu trúc được lưu audit và bảo vệ khỏi vòng lặp phân cấp.</p></div><Button onClick={() => openCreate()} className="cta-gradient"><Plus size={16} />Tạo Chủ đề</Button></header>
    <section className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Tìm theo tên hoặc slug Chủ đề…" /></div><Select value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}><SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem><SelectItem value="active">Đang hoạt động</SelectItem><SelectItem value="archived">Đã archive</SelectItem></SelectContent></Select></div></section>
    <section className="overflow-hidden rounded-[var(--radius-lg-token)] border border-border bg-surface shadow-[var(--shadow-sm)]"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold text-foreground">Cây Chủ đề</h2><p className="mt-1 text-xs text-text-secondary">{allTopics.length} Chủ đề trong phạm vi quản trị · cập nhật {topics.data?.refreshedAt ? new Date(topics.data.refreshedAt).toLocaleTimeString("vi-VN") : "—"}</p></div><Button variant="ghost" size="sm" onClick={() => topics.refetch()}>Làm mới</Button></div><div className="p-3">{topics.isLoading ? <div className="grid min-h-64 place-items-center text-sm text-text-secondary"><Loader2 className="mr-2 animate-spin" size={18} />Đang tải cây Chủ đề…</div> : topics.isError ? <div className="grid min-h-64 place-items-center text-center"><div><p className="text-sm font-semibold text-danger">Không thể tải Chủ đề.</p><Button variant="outline" className="mt-3" onClick={() => topics.refetch()}>Thử lại</Button></div></div> : allTopics.length ? (topicByParent.get(null) ?? []).map(renderNode) : <div className="grid min-h-64 place-items-center text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-light text-primary"><FolderTree size={22} /></div><h3 className="mt-4 text-base font-semibold text-foreground">Chưa có Chủ đề nào</h3><p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">Tạo Chủ đề gốc đầu tiên để tổ chức taxonomy và liên kết Quiz.</p><Button className="mt-4" onClick={() => openCreate()}><Plus size={16} />Tạo Chủ đề gốc</Button></div></div>}</div></section>
    <Dialog open={Boolean(dialog)} onOpenChange={open => { if (!open) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Cập nhật Chủ đề" : "Tạo Chủ đề mới"}</DialogTitle><DialogDescription>Chủ đề không chọn cấp cha sẽ nằm ở cấp gốc. Không thể chọn chính nó hoặc Chủ đề con làm cha.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="topic-name">Tên Chủ đề</Label><Input id="topic-name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value, slug: current.slug || topicSlug(event.target.value) }))} className="mt-1.5" placeholder="Ví dụ: Tin học văn phòng" /></div><div><Label htmlFor="topic-slug">Slug</Label><Input id="topic-slug" value={form.slug} onChange={event => setForm(current => ({ ...current, slug: event.target.value }))} className="mt-1.5" placeholder="tin-hoc-van-phong" /><p className="mt-1.5 text-xs text-text-secondary">Tự sinh từ tên nếu để trống; phải duy nhất toàn hệ thống.</p></div><div><Label>Chủ đề cha</Label><Select value={form.parentId} onValueChange={value => setForm(current => ({ ...current, parentId: value }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="root">Không có — Chủ đề gốc</SelectItem>{allTopics.filter(topic => topic.id !== dialog?.topic?.id && !topic.path.startsWith(dialog?.topic?.path ?? "//")).map(topic => <SelectItem key={topic.id} value={String(topic.id)}>{"— ".repeat(topic.depth)}{topic.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Trạng thái</Label><Select value={form.status} onValueChange={value => setForm(current => ({ ...current, status: value as TopicForm["status"] }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Đang hoạt động</SelectItem><SelectItem value="archived">Archive</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Hủy</Button><Button onClick={submit} disabled={createTopic.isPending || updateTopic.isPending}>{createTopic.isPending || updateTopic.isPending ? <Loader2 className="animate-spin" size={16} /> : null}{dialog?.mode === "edit" ? "Lưu thay đổi" : "Tạo Chủ đề"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(pendingDelete)} onOpenChange={open => { if (!open) setPendingDelete(null); }}><DialogContent><DialogHeader><DialogTitle>Xóa mềm Chủ đề</DialogTitle><DialogDescription>{pendingDelete ? `“${pendingDelete.name}” chỉ có thể xóa khi không còn Chủ đề con hoặc Quiz liên kết.` : ""}</DialogDescription></DialogHeader><div><Label htmlFor="delete-reason">Lý do</Label><Input id="delete-reason" value={deleteReason} onChange={event => setDeleteReason(event.target.value)} className="mt-1.5" placeholder="Ví dụ: Chủ đề trùng lặp" /></div><DialogFooter><Button variant="outline" onClick={() => setPendingDelete(null)}>Hủy</Button><Button variant="destructive" disabled={!pendingDelete || deleteReason.trim().length < 3 || removeTopic.isPending} onClick={() => pendingDelete && removeTopic.mutate({ topicId: pendingDelete.id, version: pendingDelete.version, reason: deleteReason.trim() })}>{removeTopic.isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}Xóa Chủ đề</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
