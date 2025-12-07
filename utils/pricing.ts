export type DiscountType = "NONE" | "PERCENT" | "FIXED";

export function computeDiscountedPrice(
  price: number,
  discountType?: DiscountType,
  discountValue?: number
) {
  const type = discountType || "NONE";
  const value = discountValue || 0;
  if (type === "PERCENT") {
    const pct = Math.max(0, Math.min(100, value));
    const discounted = Math.max(0, Math.floor(price - (price * pct) / 100));
    return { finalPrice: discounted, discountPercent: pct, saved: price - discounted };
  }
  if (type === "FIXED") {
    const saved = Math.max(0, value);
    const discounted = Math.max(0, price - saved);
    const pct = price > 0 ? Math.round((saved / price) * 100) : 0;
    return { finalPrice: discounted, discountPercent: pct, saved };
  }
  return { finalPrice: price, discountPercent: 0, saved: 0 };
}
