import { useAuth } from "@/_core/hooks/useAuth";
import AccountLayout from "@/components/AccountLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { startLogin } from "@/const";
import { sharedDataQueryOptions } from "@/lib/sharedDataSync";
import { trpc } from "@/lib/trpc";
import { BellRing, CalendarDays, CheckCircle2, Crop, ImagePlus, KeyRound, LoaderCircle, LogIn, Mail, MapPin, PencilLine, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const preferenceLabels = [
  ["studyReminders", "Nhắc học", "Gợi nhắc duy trì nhịp học"],
  ["resultUpdates", "Kết quả bài làm", "Điểm số và lời giải sau khi nộp"],
  ["platformUpdates", "Cập nhật nền tảng", "Tính năng và nội dung mới"],
] as const;

const countries = [{ code: "VN", label: "Việt Nam" }, { code: "SG", label: "Singapore" }, { code: "TH", label: "Thái Lan" }, { code: "JP", label: "Nhật Bản" }, { code: "KR", label: "Hàn Quốc" }, { code: "US", label: "Hoa Kỳ" }] as const;
const provincesByCountry: Record<string, string[]> = { VN: ["An Giang", "Bắc Ninh", "Cao Bằng", "Cà Mau", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Nội", "Hà Tĩnh", "Hải Phòng", "Hồ Chí Minh", "Hưng Yên", "Huế", "Khánh Hòa", "Lai Châu", "Lạng Sơn", "Lâm Đồng", "Lào Cai", "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long"] };

type AvatarMimeType = "image/jpeg" | "image/png" | "image/webp";
type PendingAvatar = { fileName: string; mimeType: AvatarMimeType; dataUrl: string };

export default function PersonalInfo() {
  const { user, loading } = useAuth();
  const summary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<PendingAvatar | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [countryCode, setCountryCode] = useState("VN");
  const [province, setProvince] = useState("");
  const updateProfile = trpc.learner.updateProfile.useMutation({
    onSuccess: () => { summary.refetch(); },
    onError: error => toast.error("Không thể lưu hồ sơ", { description: error.message }),
  });
  const uploadAvatar = trpc.learner.uploadAvatar.useMutation({
    onSuccess: data => { setUploadedAvatarUrl(data.url); summary.refetch(); toast.success("Đã tải ảnh đại diện thành công.", { description: "Ảnh mới đã được cắt tròn và cập nhật vào hồ sơ." }); },
    onError: error => toast.error("Không thể tải ảnh đại diện", { description: error.message }),
  });
  const confirmContactEmail = trpc.learner.confirmContactEmail.useMutation({
    onSuccess: data => { summary.refetch(); window.history.replaceState({}, "", window.location.pathname); toast.success("Đã xác nhận email liên hệ.", { description: `${data.contactEmail} hiện được dùng cho thông báo học tập.` }); },
    onError: error => { window.history.replaceState({}, "", window.location.pathname); toast.error("Không thể xác nhận email", { description: error.message }); },
  });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("verifyContactEmail");
    if (token) confirmContactEmail.mutate({ token });
  // Chỉ kích hoạt một lần khi mở liên kết xác nhận từ email.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!summary.data?.profile) return;
    setCountryCode(summary.data.profile.countryCode || "VN");
    setProvince(summary.data.profile.province || "");
  }, [summary.data?.profile.countryCode, summary.data?.profile.province]);

  if (loading || summary.isLoading) return <AccountLayout><main className="container py-8"><section className="animate-pulse rounded-2xl bg-muted p-6"><p role="status" className="text-sm text-text-secondary">Đang tải thông tin cá nhân…</p></section></main></AccountLayout>;
  if (!user) return <AccountLayout><main className="container grid min-h-[60vh] place-items-center py-10"><section className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center"><LogIn className="mx-auto text-primary" /><h1 className="mt-4 text-2xl font-black">Đăng nhập để tiếp tục</h1><Button className="mt-5" onClick={() => startLogin()}>Đăng nhập</Button></section></main></AccountLayout>;
  if (summary.error || !summary.data) return <AccountLayout><main className="container py-8"><section className="rounded-2xl border border-danger/20 bg-surface p-6"><p className="font-bold text-danger">Chưa tải được thông tin cá nhân.</p><Button className="mt-4" onClick={() => summary.refetch()}>Thử lại</Button></section></main></AccountLayout>;

  const profile = summary.data.profile;
  const avatarUrl = uploadedAvatarUrl ?? profile.avatarUrl ?? "";

  const chooseAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type)) {
      toast.error("Định dạng ảnh chưa hỗ trợ", { description: "Hãy chọn JPG, PNG hoặc WEBP." });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ảnh đại diện quá lớn", { description: "Dung lượng tối đa là 3 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Không thể đọc tệp ảnh. Hãy thử lại.");
    reader.onload = () => {
      setCropZoom(1);
      setPendingAvatar({ fileName: file.name, mimeType: file.type as AvatarMimeType, dataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const uploadCroppedAvatar = () => {
    if (!pendingAvatar) return;
    const image = new Image();
    image.onerror = () => toast.error("Không thể xử lý ảnh này. Hãy chọn ảnh khác.");
    image.onload = () => {
      const cropSide = Math.min(image.naturalWidth, image.naturalHeight) / cropZoom;
      const sourceX = (image.naturalWidth - cropSide) / 2;
      const sourceY = (image.naturalHeight - cropSide) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) { toast.error("Không thể tạo vùng cắt ảnh."); return; }
      context.beginPath();
      context.arc(256, 256, 256, 0, Math.PI * 2);
      context.closePath();
      context.clip();
      context.drawImage(image, sourceX, sourceY, cropSide, cropSide, 0, 0, 512, 512);
      setPendingAvatar(null);
      uploadAvatar.mutate({ fileName: `avatar-${Date.now()}.png`, mimeType: "image/png", base64: canvas.toDataURL("image/png") });
    };
    image.src = pendingAvatar.dataUrl;
  };

  const removeAvatar = () => {
    updateProfile.mutate({
      avatarUrl: "",
      bio: profile.bio ?? "",
      learningGoal: profile.learningGoal ?? "",
      contactEmail: profile.contactEmail ?? "",
      birthDate: profile.birthDate ?? "",
      address: profile.address ?? "",
      countryCode: profile.countryCode ?? "",
      province: profile.province ?? "",
      notificationPreferences: profile.notificationPreferences ?? { studyReminders: true, resultUpdates: true, platformUpdates: true },
    }, { onSuccess: () => { setUploadedAvatarUrl(""); toast.success("Đã xóa ảnh đại diện.", { description: "Hồ sơ đang sử dụng ảnh mặc định." }); } });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfile.mutate({
      avatarUrl,
      bio: String(form.get("bio") ?? ""),
      learningGoal: String(form.get("learningGoal") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      birthDate: String(form.get("birthDate") ?? ""),
      address: String(form.get("address") ?? ""),
      countryCode,
      province,
      origin: window.location.origin,
      notificationPreferences: {
        studyReminders: form.get("studyReminders") === "on",
        resultUpdates: form.get("resultUpdates") === "on",
        platformUpdates: form.get("platformUpdates") === "on",
      },
    }, { onSuccess: data => { if (data.emailVerificationPending) { toast.success(data.emailDeliverySent ? "Đã gửi email xác nhận đến địa chỉ mới." : "Email mới đang chờ xác nhận.", { description: data.emailDeliverySent ? "Mở email và chọn Xác nhận email trong 24 giờ để hoàn tất thay đổi." : "Liên hệ quản trị viên để kiểm tra cấu hình gửi email." }); } else toast.success("Đã cập nhật thông tin cá nhân."); } });
  };

  return <AccountLayout>
    <main className="container max-w-4xl py-5 sm:py-7">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]">
        <header className="border-b border-border-light bg-[linear-gradient(110deg,#fafaff,#f6f4ff)] px-5 py-5 sm:px-7">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700"><UserRound size={20} /></span>
          <h1 className="mt-3 text-2xl font-black tracking-[-.04em] text-foreground">Thông tin cá nhân</h1>
          <p className="mt-1 text-sm text-text-secondary">Quản lý ảnh đại diện, thông tin liên hệ, mục tiêu học tập và các thiết lập bảo mật.</p>
        </header>
        <form onSubmit={submit} className="p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ảnh đại diện" description="Chọn ảnh, cắt tròn trước khi tải lên. Hỗ trợ JPG, PNG, WEBP tối đa 3 MB.">
              <div className="flex items-center gap-4 rounded-xl border border-dashed border-primary/25 bg-primary-light/35 p-3">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-500/15 text-violet-700">{avatarUrl ? <img src={avatarUrl} alt="Xem trước ảnh đại diện" className="size-full object-cover" /> : <UserRound size={22} />}</span>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dark">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { chooseAvatar(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} disabled={uploadAvatar.isPending} />
                    {uploadAvatar.isPending ? <LoaderCircle className="animate-spin" size={15} /> : <ImagePlus size={15} />}{uploadAvatar.isPending ? "Đang tải…" : "Chọn & cắt ảnh"}
                  </label>
                  {avatarUrl ? <Button type="button" variant="outline" size="sm" className="h-9 border-danger/25 text-danger hover:bg-danger/10 hover:text-danger" disabled={updateProfile.isPending || uploadAvatar.isPending} onClick={removeAvatar}><Trash2 size={14} />Xóa ảnh</Button> : null}
                </div>
              </div>
            </Field>
            <Field label="Mục tiêu học tập" description="Tối đa 220 ký tự, hiển thị trên trang Tổng quan."><input id="learningGoal" name="learningGoal" defaultValue={profile.learningGoal ?? ""} maxLength={220} placeholder="Ví dụ: Đạt 7.0 IELTS trong 12 tuần" className="field" /></Field>
            <Field label="Email liên hệ" description="Địa chỉ mới chỉ được áp dụng sau khi bạn xác nhận qua email."><span className="relative block"><Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} /><input aria-label="Email liên hệ" id="contactEmail" name="contactEmail" type="email" defaultValue={profile.contactEmail ?? user.email ?? ""} maxLength={320} placeholder="ban@example.com" className="field pl-10" /></span>{profile.pendingContactEmail ? <span role="status" className="mt-2 block rounded-md bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-700">Đang chờ xác nhận: {profile.pendingContactEmail}</span> : null}</Field>
            <Field label="Ngày sinh" description="Dùng để cá nhân hóa trải nghiệm học tập."><span className="relative block"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} /><input aria-label="Ngày sinh" id="birthDate" name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} className="field pl-10" /></span></Field>
            <Field label="Giới thiệu bản thân" full description="Một vài dòng về điều bạn muốn chinh phục."><textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} placeholder="Mục tiêu học tập hoặc điều bạn muốn chinh phục…" className="field min-h-32 resize-y" /></Field>
            <Field label="Quốc gia" description="Chọn quốc gia cư trú."><select aria-label="Quốc gia" name="countryCode" value={countryCode} onChange={event => { setCountryCode(event.target.value); setProvince(""); }} className="field bg-surface">{countries.map(country => <option key={country.code} value={country.code}>{country.label}</option>)}</select></Field>
            <Field label="Tỉnh/Thành phố" description="Danh sách theo quốc gia đã chọn."><select aria-label="Tỉnh/Thành phố" name="province" value={province} onChange={event => setProvince(event.target.value)} className="field bg-surface"><option value="">Chọn Tỉnh/Thành phố</option>{(provincesByCountry[countryCode] ?? ["Khác"]).map(item => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Địa chỉ" full description="Tùy chọn, dùng cho các hỗ trợ cần thiết của tài khoản."><span className="relative block"><MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-text-muted" size={16} /><textarea aria-label="Địa chỉ" id="address" name="address" defaultValue={profile.address ?? ""} maxLength={500} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" className="field min-h-20 resize-y pl-10" /></span></Field>
          </div>
          <section className="mt-6 rounded-xl border border-violet-100 bg-violet-50/45 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-700"><KeyRound size={17} /></span><div><h2 className="text-sm font-bold text-foreground">Mật khẩu đăng nhập</h2><p className="mt-1 max-w-xl text-xs leading-5 text-text-secondary">Tài khoản sử dụng đăng nhập OAuth. Mật khẩu được quản lý an toàn tại cổng tài khoản, không được lưu trên Dshare Quiz.</p></div></div>
              <Button type="button" variant="outline" className="shrink-0 border-violet-200 text-violet-700 hover:bg-violet-100" onClick={() => window.open(import.meta.env.VITE_OAUTH_PORTAL_URL, "_blank", "noopener,noreferrer")}>Quản lý mật khẩu</Button>
            </div>
          </section>
          <fieldset className="mt-6 rounded-xl border border-border-light bg-muted/55 p-4">
            <legend className="px-1 text-sm font-bold text-foreground"><BellRing className="mr-1 inline-block text-primary" size={15} />Thông báo</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-3">{preferenceLabels.map(([name, title, note]) => <label key={name} className="flex cursor-pointer gap-3 rounded-lg border border-border-light bg-surface p-3 text-xs transition-colors hover:border-primary/25"><input name={name} type="checkbox" defaultChecked={profile.notificationPreferences?.[name] ?? true} className="mt-0.5 size-4 accent-primary" /><span><strong className="text-foreground">{title}</strong><span className="mt-1 block leading-4 text-text-muted">{note}</span></span></label>)}</div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center gap-3"><Button disabled={updateProfile.isPending || uploadAvatar.isPending} className="rounded-full">{updateProfile.isPending ? "Đang lưu thay đổi…" : <><PencilLine size={15} />Lưu thay đổi</>}</Button><span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 size={14} />Thông tin được bảo vệ theo tài khoản của bạn.</span></div>
        </form>
      </section>
    </main>
    <Dialog open={Boolean(pendingAvatar)} onOpenChange={open => { if (!open) setPendingAvatar(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Crop size={18} className="text-primary" />Cắt ảnh đại diện</DialogTitle><DialogDescription>Căn giữa khuôn mặt trong vòng tròn, sau đó điều chỉnh mức phóng đại để có khung hình đẹp nhất.</DialogDescription></DialogHeader>
        {pendingAvatar ? <div className="space-y-5"><div className="mx-auto grid size-56 place-items-center overflow-hidden rounded-full border-4 border-primary/20 bg-muted"><img src={pendingAvatar.dataUrl} alt="Xem trước vùng cắt avatar" className="size-full object-cover" style={{ transform: `scale(${cropZoom})` }} /></div><label className="block text-xs font-bold text-foreground">Phóng đại <span className="float-right text-text-secondary">{cropZoom.toFixed(1)}×</span><input aria-label="Mức phóng đại ảnh đại diện" type="range" min="1" max="2" step="0.1" value={cropZoom} onChange={event => setCropZoom(Number(event.target.value))} className="mt-3 w-full accent-primary" /></label></div> : null}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setPendingAvatar(null)}>Hủy</Button><Button type="button" disabled={uploadAvatar.isPending} onClick={uploadCroppedAvatar}>{uploadAvatar.isPending ? <LoaderCircle className="animate-spin" size={15} /> : <Crop size={15} />}Cắt tròn & tải ảnh</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </AccountLayout>;
}

function Field({ label, description, full, children }: { label: string; description: string; full?: boolean; children: React.ReactNode }) { return <label className={`block text-xs font-semibold text-text-secondary ${full ? "sm:col-span-2" : ""}`}><span className="text-foreground">{label}</span><span className="mt-1 block text-[11px] font-normal leading-4 text-text-muted">{description}</span><span className="mt-2 block">{children}</span></label>; }
