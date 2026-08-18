export type WalletTransactionKind = "top_up" | "quiz_fee" | "quiz_reward" | "report_reward" | "referral_reward" | "admin_adjustment";

export function getWalletTransactionMeta(type: WalletTransactionKind, amount: number) {
  const labels: Record<WalletTransactionKind, string> = {
    top_up: "Nạp Point",
    quiz_fee: "Phí làm bài",
    quiz_reward: "Thưởng hoàn thành",
    report_reward: "Bồi hoàn báo lỗi",
    referral_reward: "Thưởng giới thiệu",
    admin_adjustment: "Điều chỉnh quản trị",
  };
  return { label: labels[type] ?? "Giao dịch Point", credit: amount > 0 };
}
