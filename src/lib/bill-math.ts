export interface BillLike {
  rent_amount: number | string;
  water_amount: number | string;
  electricity_mode: "per_unit" | "direct";
  elec_prev_reading: number | string | null;
  elec_curr_reading: number | string | null;
  elec_rate: number | string | null;
  elec_service_charge: number | string;
  elec_direct_amount: number | string;
}

export interface ChargeLike {
  amount: number | string;
}

export interface PaymentLike {
  amount_paid: number | string;
}

const n = (v: unknown) => Number(v ?? 0) || 0;

export function electricityTotal(b: BillLike): number {
  if (b.electricity_mode === "per_unit") {
    const units = Math.max(0, n(b.elec_curr_reading) - n(b.elec_prev_reading));
    return units * n(b.elec_rate) + n(b.elec_service_charge);
  }
  return n(b.elec_direct_amount);
}

export function chargesTotal(charges: ChargeLike[]): number {
  return charges.reduce((s, c) => s + n(c.amount), 0);
}

export function paymentsTotal(payments: PaymentLike[]): number {
  return payments.reduce((s, p) => s + n(p.amount_paid), 0);
}

export function billTotal(b: BillLike, charges: ChargeLike[]): number {
  return n(b.rent_amount) + n(b.water_amount) + electricityTotal(b) + chargesTotal(charges);
}

export type BillStatus = "paid" | "partial" | "pending" | "overpaid";

export function statusFor(total: number, paid: number): BillStatus {
  if (total === 0 && paid === 0) return "pending";
  const remaining = total - paid;
  if (remaining === 0) return "paid";
  if (remaining < 0) return "overpaid";
  if (paid > 0) return "partial";
  return "pending";
}

export function formatNpr(amount: number): string {
  return `NPR ${Math.round(amount * 100) / 100}`;
}
