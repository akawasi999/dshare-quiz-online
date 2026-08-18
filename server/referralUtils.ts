export function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase();
}

export function getReferralValidationError(input: { code: string; ownCode: string; hasReferredByCode: boolean }) {
  if (input.hasReferredByCode) return "Bạn đã sử dụng mã giới thiệu trước đó.";
  if (input.code === input.ownCode) return "Bạn không thể sử dụng mã giới thiệu của chính mình.";
  return null;
}
