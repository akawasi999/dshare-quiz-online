import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleAlert, Clock3, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function PaymentStatus() {
  useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderCode = Number(params.get("orderCode"));
  const statusHint = params.get("status");
  const hasValidOrderCode = Number.isSafeInteger(orderCode) && orderCode > 0;
  const payment = trpc.payment.status.useQuery({ orderCode }, { enabled: hasValidOrderCode, refetchInterval: query => query.state.data?.status === "pending" ? 3_000 : false });
  const status = payment.data?.status ?? (statusHint === "cancel" ? "cancelled" : "pending");
  const isPaid = status === "paid";
  const isCancelled = status === "cancelled" || status === "failed";
  const lookupFailed = payment.isError;
  const canShowPending = hasValidOrderCode && !lookupFailed && !isPaid && !isCancelled;
  return <div className="min-h-screen bg-[#eef4ff]"><SiteHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-12"><section className="w-full max-w-xl rounded-[30px] border border-[#172554]/10 bg-white p-8 text-center shadow-sm"><div className={`mx-auto grid size-14 place-items-center rounded-full ${isPaid ? "bg-emerald-50 text-emerald-600" : isCancelled || lookupFailed || !hasValidOrderCode ? "bg-red-50 text-red-600" : "bg-[#eef4ff] text-[#2563eb]"}`}>{payment.isLoading || canShowPending ? <Loader2 className="animate-spin" /> : isPaid ? <CheckCircle2 /> : <CircleAlert />}</div><p className="mt-6 text-[10px] font-bold uppercase tracking-[.16em] text-[#2563eb]">Trạng thái PayOS</p><h1 className="mt-3 font-serif text-3xl font-semibold text-[#172554]">{!hasValidOrderCode ? "Mã đơn không hợp lệ." : lookupFailed ? "Chưa thể tra cứu giao dịch." : isPaid ? "Thanh toán đã được xác nhận." : isCancelled ? "Giao dịch chưa hoàn tất." : "Đang chờ xác minh thanh toán."}</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#617786]">{!hasValidOrderCode ? "Liên kết thanh toán không có mã đơn hợp lệ. Hãy quay lại trang nạp Point hoặc gói học để tạo đơn mới." : lookupFailed ? "Kết nối tạm thời bị gián đoạn. Việc thanh toán của bạn không bị thay đổi; hãy thử tra cứu lại sau ít phút." : isPaid ? "Point hoặc quyền truy cập gói học đã được ghi nhận qua webhook đã xác minh. Bạn có thể xem lại ví Point ngay bây giờ." : isCancelled ? "Bạn chưa bị cộng Point hay thay đổi gói học. Bạn có thể quay lại và tạo đơn mới khi sẵn sàng." : "PayOS đã quay lại Dshare. Chúng tôi đang chờ thông báo webhook để đối soát mã đơn và số tiền; trang này sẽ tự cập nhật."}</p>{lookupFailed && <p role="alert" className="mt-5 text-xs text-red-600">Không thể kiểm tra đơn: {payment.error.message}</p>}<div className="mt-7 flex flex-wrap justify-center gap-3">{lookupFailed && <Button onClick={() => payment.refetch()} variant="outline" className="rounded-full">Thử lại</Button>}<Button asChild className="rounded-full bg-[#2563eb]"><Link href={isPaid ? "/vi" : "/nap-point"}>{isPaid ? "Xem ví Point" : "Quay lại thanh toán"}</Link></Button><Button asChild variant="outline" className="rounded-full"><Link href="/bang-gia">Xem gói học</Link></Button></div><p className="mt-6 inline-flex items-center gap-2 text-xs text-[#617786]"><Clock3 size={14} /> Mã đơn: {hasValidOrderCode ? orderCode : "không hợp lệ"}</p></section></main></div>;
}
