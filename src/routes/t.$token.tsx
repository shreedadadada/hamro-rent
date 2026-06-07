import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTenantPortal } from "@/lib/hamrorent.functions";
import { billTotal, paymentsTotal, statusFor, formatNpr, electricityTotal } from "@/lib/bill-math";
import { bsLabel } from "@/lib/bs-calendar";
import { StatusBadge } from "@/components/AppShell";
import { Building2, Phone, Calendar, TrendingUp, Wallet, ReceiptText, ChevronDown } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.jpeg";

export const Route = createFileRoute("/t/$token")({
  head: () => ({ meta: [{ title: "My Rent Ledger — Hamro Rent" }] }),
  component: PortalPage,
});

function PortalPage() {
  const { token } = Route.useParams();
  const fetch = useServerFn(getTenantPortal);
  const q = useQuery({
    queryKey: ["portal", token],
    queryFn: () => fetch({ data: { token } }),
  });

  if (q.isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-5">
        <img src={logo} alt="Hamro Rent" className="size-12 rounded-2xl object-cover shadow-md" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-primary/40"
              style={{ animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Loading your ledger…</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ReceiptText className="size-7 text-destructive" />
        </div>
        <h1 className="font-display text-2xl tracking-tight mb-2">Link not found</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-6">
          This link is invalid or may have been revoked by your landlord. Please ask them to share the link again.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Building2 className="size-4" /> Go to Hamro Rent
        </Link>
      </div>
    );
  }

  const { tenant, bills } = q.data!;
  let billed = 0, totalPaid = 0;
  for (const b of bills) {
    billed += billTotal(b, b.bill_charges ?? []);
    totalPaid += paymentsTotal(b.payments ?? []);
  }
  const outstanding = Math.max(0, billed - totalPaid);

  return (
    <div className="min-h-screen bg-background">
      {/* Portal header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Hamro Rent" className="size-8 rounded-lg object-cover" />
            <span className="font-display text-lg tracking-tight">Hamro Rent</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Tenant view · Read-only
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 page-enter">
        {/* Tenant card */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-2xl text-primary">
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Rent Ledger</p>
              <h1 className="font-display text-3xl tracking-tight">{tenant.name}</h1>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {tenant.room_number && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" /> Room {tenant.room_number}
                  </span>
                )}
                {tenant.move_in_date_bs && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Since {tenant.move_in_date_bs}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <PortalStat icon={ReceiptText} label="Total Billed" value={formatNpr(billed)} iconColor="text-primary" iconBg="bg-primary/8" />
          <PortalStat icon={TrendingUp} label="Total Paid" value={formatNpr(totalPaid)} iconColor="text-success" iconBg="bg-success/10" />
          <PortalStat
            icon={Wallet}
            label="Outstanding Balance"
            value={formatNpr(outstanding)}
            iconColor={outstanding > 0 ? "text-destructive" : "text-success"}
            iconBg={outstanding > 0 ? "bg-destructive/8" : "bg-success/10"}
            highlight={outstanding > 0}
          />
        </div>

        {/* Bills */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl tracking-tight">Monthly Bills</h2>
          <span className="text-sm text-muted-foreground">{bills.length} bill{bills.length !== 1 ? "s" : ""}</span>
        </div>

        {bills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <ReceiptText className="mx-auto size-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No bills yet. Your landlord will add them here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((b: any) => (
              <PortalBillCard key={b.id} bill={b} />
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          This is a read-only view shared by your landlord via{" "}
          <Link to="/" className="underline underline-offset-2 hover:text-foreground transition-colors">Hamro Rent</Link>.
          Contact your landlord for any questions about your bills.
        </p>
      </main>
    </div>
  );
}

function PortalStat({ icon: Icon, label, value, iconColor, iconBg, highlight }: {
  icon: React.ElementType; label: string; value: string;
  iconColor: string; iconBg: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-card p-5 stat-card ${highlight ? "border-destructive/30" : "border-border"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`inline-flex size-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </div>
      <p className="font-display text-2xl tracking-tight">{value}</p>
    </div>
  );
}

function PortalBillCard({ bill }: { bill: any }) {
  const [open, setOpen] = useState(false);
  const charges = bill.bill_charges ?? [];
  const payments = bill.payments ?? [];
  const total = billTotal(bill, charges);
  const paid = paymentsTotal(payments);
  const status = statusFor(total, paid);
  const remaining = total - paid;

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-shadow ${open ? "shadow-md border-primary/20" : "border-border"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          <div>
            <p className="font-display text-xl tracking-tight">{bsLabel(bill.bs_year, bill.bs_month)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-sm">{formatNpr(total)}</p>
          </div>
          {remaining > 0 && (
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-semibold text-sm text-destructive">{formatNpr(remaining)}</p>
            </div>
          )}
          <StatusBadge status={status} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 bill-details">
          <div className="grid gap-5 md:grid-cols-2">
            {/* Charges */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Charges</h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {Number(bill.rent_amount) > 0 && (
                      <PortalRow label="Rent" amount={Number(bill.rent_amount)} />
                    )}
                    {Number(bill.water_amount) > 0 && (
                      <PortalRow label="Water" amount={Number(bill.water_amount)} />
                    )}
                    {electricityTotal(bill) > 0 && (
                      <PortalRow
                        label={`Electricity (${bill.electricity_mode === "per_unit" ? "per-unit" : "direct"})`}
                        amount={electricityTotal(bill)}
                      />
                    )}
                    {charges.map((c: any) => (
                      <PortalRow key={c.id} label={c.label} amount={Number(c.amount)} />
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right">{formatNpr(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {bill.notes && (
                <p className="mt-2 text-xs italic text-muted-foreground">Note: {bill.notes}</p>
              )}
            </div>

            {/* Payments */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payments Received</h4>
              {payments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {payments.map((p: any) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-xs">{p.payment_date_bs}</p>
                            <p className="text-xs text-muted-foreground capitalize">{p.method}{p.note ? ` · ${p.note}` : ""}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatNpr(Number(p.amount_paid))}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="px-4 py-3">Total Paid</td>
                        <td className="px-4 py-3 text-right text-success">{formatNpr(paid)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {remaining > 0 && (
                <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
                  <p className="font-medium text-destructive">Outstanding: {formatNpr(remaining)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Please contact your landlord to settle this amount.</p>
                </div>
              )}
              {remaining < 0 && (
                <div className="mt-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm">
                  <p className="font-medium text-success">Credit: {formatNpr(Math.abs(remaining))}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You have overpaid — this will be applied to your next bill.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PortalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
      <td className="px-4 py-2.5 text-right font-medium">{formatNpr(amount)}</td>
    </tr>
  );
}
