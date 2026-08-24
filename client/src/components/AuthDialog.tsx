import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startLogin } from "@/const";
import { Check, Chrome, LockKeyhole, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type AuthMode = "login" | "register";

export default function AuthDialog({ open, onOpenChange, initialMode = "login" }: { open: boolean; onOpenChange: (open: boolean) => void; initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  useEffect(() => { if (open) setMode(initialMode); }, [initialMode, open]);
  const startManusLogin = () => { onOpenChange(false); startLogin(); };
  const requestGoogleLogin = () => toast.info("Đăng nhập Google cần được quản trị viên kích hoạt.", { description: "Hãy thêm thông tin OAuth Google để bảo vệ luồng đăng nhập và callback." });
  const isRegister = mode === "register";
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[760px] gap-0 overflow-hidden rounded-2xl border border-sky-100 bg-surface p-0 shadow-[0_24px_80px_rgba(23,37,84,.26)]">
      <DialogHeader className="border-b border-sky-100 bg-[linear-gradient(110deg,#eff7ff,#f8f5ff)] px-5 py-4 sm:px-7">
        <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">{isRegister ? <UserPlus size={18} /> : <LockKeyhole size={18} />}</span>{isRegister ? "Đăng ký" : "Đăng nhập"}</DialogTitle>
        <DialogDescription className="pt-1 text-sm text-text-secondary">{isRegister ? "Tạo tài khoản để lưu tiến trình và chinh phục mục tiêu học tập." : "Chào mừng bạn quay lại không gian học tập Dshare."}</DialogDescription>
      </DialogHeader>
      <div className="p-5 sm:p-7">
        <div className="grid overflow-hidden rounded-xl border border-border-light bg-muted/40 sm:grid-cols-[190px_1fr]">
          <aside className="border-b border-border-light bg-[linear-gradient(150deg,#f5f2ff,#eef7ff)] p-5 sm:border-b-0 sm:border-r">
            <p className="text-xs font-black uppercase tracking-[.14em] text-primary">{isRegister ? "Bắt đầu ngay" : "Đăng nhập an toàn"}</p>
            <h3 className="mt-2 text-lg font-black text-foreground">{isRegister ? "Học có lộ trình." : "Tiếp tục hành trình."}</h3>
            <p className="mt-2 text-xs leading-5 text-text-secondary">Dshare sử dụng xác thực qua nhà cung cấp uy tín, không lưu mật khẩu trong ứng dụng.</p>
            <ul className="mt-5 space-y-2 text-xs text-text-secondary"><li className="flex gap-2"><Check className="mt-0.5 text-success" size={14} />Lưu tiến độ học</li><li className="flex gap-2"><Check className="mt-0.5 text-success" size={14} />Nhận XP & thành tích</li><li className="flex gap-2"><Check className="mt-0.5 text-success" size={14} />Bảo vệ tài khoản</li></ul>
          </aside>
          <section className="p-5 sm:p-6">
            <div className="grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Chọn chế độ xác thực"><button type="button" role="tab" aria-selected={!isRegister} onClick={() => setMode("login")} className={`min-h-9 rounded-md text-sm font-bold transition-colors ${!isRegister ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-foreground"}`}>Đăng nhập</button><button type="button" role="tab" aria-selected={isRegister} onClick={() => setMode("register")} className={`min-h-9 rounded-md text-sm font-bold transition-colors ${isRegister ? "bg-surface text-primary shadow-sm" : "text-text-secondary hover:text-foreground"}`}>Đăng ký</button></div>
            <div className="mt-6 space-y-3"><Button type="button" onClick={startManusLogin} className="h-11 w-full rounded-lg bg-[#151d2d] text-white hover:bg-[#27324a]"><Sparkles size={17} />{isRegister ? "Đăng ký với Manus" : "Đăng nhập với Manus"}</Button><Button type="button" variant="outline" onClick={requestGoogleLogin} className="h-11 w-full rounded-lg border-border bg-surface text-foreground hover:bg-muted"><Chrome className="text-[#4285F4]" size={18} />{isRegister ? "Đăng ký với Google" : "Đăng nhập với Google"}</Button></div>
            {isRegister ? <label className="mt-5 flex cursor-pointer items-start gap-2 rounded-lg border border-border-light bg-surface p-3 text-xs leading-5 text-text-secondary"><input type="checkbox" checked={acceptedTerms} onChange={event => setAcceptedTerms(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span>Tôi đồng ý với <a href="/terms" target="_blank" className="font-semibold text-primary hover:underline">Điều khoản sử dụng</a> và <a href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">Chính sách bảo mật</a>.</span></label> : <p className="mt-5 rounded-lg border border-primary/10 bg-primary-light/35 p-3 text-xs leading-5 text-text-secondary"><ShieldCheck className="mr-1 inline-block text-primary" size={14} />Bạn sẽ được chuyển tới nhà cung cấp xác thực để đăng nhập an toàn.</p>}
            {isRegister && !acceptedTerms ? <p className="mt-3 text-[11px] text-text-muted">Bằng cách tiếp tục với Manus hoặc Google, bạn xác nhận đã đọc điều khoản sử dụng.</p> : null}
          </section>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
