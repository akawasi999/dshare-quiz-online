import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CircleDollarSign, Clock3, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { Link, useLocation } from "wouter";

const planNames: Record<string, string> = { Pro: "Gói Pro", Premium: "Gói Premium", Basic: "Gói Basic" };

export default function TopUp() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const summary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user) });
  const requestedPlan = new URLSearchParams(location.split("?")[1] ?? "").get("plan");
  const requestedLabel = requestedPlan ? planNames[requestedPlan] : undefined;

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#eef4ff]"><CircleDollarSign className="animate-pulse text-[#2563eb]" /></div>;
  if (!user) return <div className="min-h-screen bg-[#eef4ff]"><SiteHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-12"><section className="max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm"><WalletCards className="mx-auto text-[#2563eb]" size={31} /><h1 className="mt-5 font-serif text-3xl font-semibold text-[#172554]">Nạp Point khi bạn sẵn sàng.</h1><p className="mt-3 text-sm leading-6 text-[#617786]">Đăng nhập để xem số dư hiện tại và chuẩn bị lựa chọn gói Point hoặc gói học phù hợp.</p><Button onClick={() => startLogin()} className="mt-7 rounded-full bg-[#2563eb]">Đăng nhập để tiếp tục</Button></section></main></div>;

  return <div className="min-h-screen bg-[#eef4ff]"><SiteHeader /><main className="container py-9 lg:py-12"><Link href="/vi" className="inline-flex items-center gap-2 text-xs font-bold text-[#617786]"><ArrowLeft size={15} /> Quay lại ví Point</Link><section className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><div className="rounded-[30px] bg-[#172554] p-7 text-white sm:p-9"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#fbbf24]">Ví Point / Nạp & nâng cấp</p><h1 className="mt-4 max-w-xl font-serif text-[42px] font-semibold tracking-[-.05em]">Chuẩn bị cho lựa chọn học tiếp theo.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-[#eef4ff]">Không có khoản thanh toán nào được tạo từ màn hình này. Khi PayOS được kích hoạt, bạn sẽ có thể nạp Point hoặc hoàn tất nâng cấp gói trong một luồng được xác nhận ở máy chủ.</p><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#bfdbfe]">Point hiện có</p><p className="mt-2 font-serif text-3xl font-semibold">{summary.data?.profile.pointBalance ?? 0}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#bfdbfe]">Gói hiện tại</p><p className="mt-2 font-serif text-3xl font-semibold capitalize">{summary.data?.profile.tier ?? "basic"}</p></div></div></div><aside className="rounded-[30px] border border-[#172554]/10 bg-white p-7"><LockKeyhole className="text-[#f59e0b]" size={25} /><p className="mt-6 text-[10px] font-bold uppercase tracking-[.16em] text-[#d97706]">Thanh toán đang chờ kích hoạt</p><h2 className="mt-2 font-serif text-[29px] font-semibold text-[#172554]">Chưa có giao dịch nào được xử lý.</h2><p className="mt-3 text-sm leading-6 text-[#617786]">{requestedLabel ? `${requestedLabel} đã được ghi nhận như lựa chọn bạn quan tâm. ` : "Bạn có thể xem các gói học trước. "}Nút thanh toán sẽ chỉ mở khi cấu hình PayOS và xác minh webhook đã hoàn tất.</p><Button disabled className="mt-6 w-full rounded-full bg-[#2563eb] opacity-75">Chờ mở thanh toán PayOS</Button><Link href="/bang-gia" className="mt-4 block text-center text-xs font-bold text-[#2563eb]">Xem lại gói học</Link></aside></section><section className="mt-6 grid gap-4 sm:grid-cols-3"><InfoCard icon={ShieldCheck} title="Ghi nhận an toàn" body="Point chỉ được cộng sau khi giao dịch được máy chủ xác thực." /><InfoCard icon={Clock3} title="Trạng thái minh bạch" body="Mọi biến động sẽ xuất hiện trong sổ cái ví Point." /><InfoCard icon={CircleDollarSign} title="Quyền truy cập rõ ràng" body="Nâng cấp gói sẽ được đối soát trước khi mở nội dung trả phí." /></section></main></div>;
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof ShieldCheck; title: string; body: string }) { return <article className="rounded-[22px] border border-[#172554]/10 bg-white p-5"><Icon className="text-[#2563eb]" size={19} /><h2 className="mt-4 text-sm font-bold text-[#172554]">{title}</h2><p className="mt-2 text-xs leading-5 text-[#617786]">{body}</p></article>; }
