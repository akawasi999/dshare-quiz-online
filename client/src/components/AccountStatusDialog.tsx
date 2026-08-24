import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type AccountStatus = "active" | "suspended" | "banned" | "deactivated";
type StatusTarget = { userId: number; displayName: string; status: AccountStatus } | null;

export default function AccountStatusDialog({ target, reason, pending, onReasonChange, onClose, onSubmit }: { target: StatusTarget; reason: string; pending: boolean; onReasonChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  const actionLabel = target?.status === "active" ? "Kích hoạt lại" : target?.status === "suspended" ? "Đình chỉ" : target?.status === "banned" ? "Khóa tài khoản" : "Vô hiệu hóa";
  const tone = target?.status === "active" ? "bg-success hover:bg-success/90" : target?.status === "suspended" ? "bg-warning hover:bg-warning/90" : "bg-danger hover:bg-danger/90";
  return <Dialog open={target !== null} onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className="max-w-md rounded-[var(--radius-lg-token)] border-border bg-surface"><DialogHeader><DialogTitle>{actionLabel}</DialogTitle><DialogDescription>{target ? `Xác nhận thay đổi trạng thái cho ${target.displayName}. Lý do sẽ được lưu vào audit log và thông báo tới người dùng.` : ""}</DialogDescription></DialogHeader><div className="space-y-2"><label htmlFor="account-status-reason" className="text-sm font-bold text-foreground">Lý do cụ thể <span className="text-danger">*</span></label><Textarea id="account-status-reason" value={reason} onChange={event => onReasonChange(event.target.value)} placeholder="Ví dụ: Phát hiện hoạt động bất thường cần xác minh…" className="min-h-28 resize-y bg-background" maxLength={500} autoFocus /><div className="flex items-center justify-between text-[11px] text-text-secondary"><span>Tối thiểu 3 ký tự</span><span>{reason.trim().length}/500</span></div></div><DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={pending}>Hủy</Button><Button type="button" onClick={onSubmit} disabled={pending || reason.trim().length < 3} className={`text-white ${tone}`}>{pending ? "Đang lưu…" : actionLabel}</Button></DialogFooter></DialogContent></Dialog>;
}
