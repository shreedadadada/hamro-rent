import { billTotal, paymentsTotal, formatNpr, electricityTotal } from "./bill-math";
import { bsLabel } from "./bs-calendar";

/** Normalize a phone number to international format (defaults to Nepal +977). */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("977")) return digits;
  if (digits.startsWith("0")) return "977" + digits.slice(1);
  if (digits.length === 10) return "977" + digits;
  return digits;
}

export function waLink(phone: string, message: string): string {
  const p = normalizePhone(phone);
  const text = encodeURIComponent(message);
  return p ? `https://wa.me/${p}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function billMessage(tenantName: string, bill: any, portalUrl?: string): string {
  const charges = bill.bill_charges ?? [];
  const total = billTotal(bill, charges);
  const paid = paymentsTotal(bill.payments ?? []);
  const remaining = total - paid;
  const lines = [
    `Namaste ${tenantName},`,
    ``,
    `Your bill for *${bsLabel(bill.bs_year, bill.bs_month)}*:`,
    `• Rent: ${formatNpr(Number(bill.rent_amount))}`,
    `• Water: ${formatNpr(Number(bill.water_amount))}`,
    `• Electricity: ${formatNpr(electricityTotal(bill))}`,
    ...charges.map((c: any) => `• ${c.label}: ${formatNpr(Number(c.amount))}`),
    ``,
    `*Total: ${formatNpr(total)}*`,
    paid > 0 ? `Paid: ${formatNpr(paid)}` : "",
    remaining > 0 ? `*Due: ${formatNpr(remaining)}*` : remaining < 0 ? `Credit: ${formatNpr(-remaining)}` : `Fully paid ✓`,
    portalUrl ? `\nView full history: ${portalUrl}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export function reminderMessage(tenantName: string, bill: any): string {
  const total = billTotal(bill, bill.bill_charges ?? []);
  const remaining = total - paymentsTotal(bill.payments ?? []);
  return [
    `Namaste ${tenantName},`,
    ``,
    `Gentle reminder: ${bsLabel(bill.bs_year, bill.bs_month)} bill has *${formatNpr(remaining)}* still due.`,
    `Please pay at your earliest convenience. Dhanyabad!`,
  ].join("\n");
}

export function receiptMessage(tenantName: string, bill: any, payment: any): string {
  return [
    `Namaste ${tenantName},`,
    ``,
    `Received *${formatNpr(Number(payment.amount_paid))}* on ${payment.payment_date_bs} (${payment.method}).`,
    `For: ${bsLabel(bill.bs_year, bill.bs_month)} bill.`,
    `Thank you!`,
  ].join("\n");
}
