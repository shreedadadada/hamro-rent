import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTenantPortal } from "@/lib/hamrorent.functions";
import { billTotal, paymentsTotal, statusFor, formatNpr, electricityTotal } from "@/lib/bill-math";
import { bsLabel } from "@/lib/bs-calendar";
import { StatusBadge } from "@/components/AppShell";

export const Route = createFileRoute("/t/$token")({
  head: () => ({ meta: [{ title: "My Rent Ledger — HamroRent" }] }),
  component: PortalPage,
});

function PortalPage() {
  const { token } = Route.useParams();
  const fetch = useServerFn(getTenantPortal);
  const q = useQuery({ queryKey: ["portal", token], queryFn: () => fetch({ data: { token } }) });

  if (q.isLoading) {
    return <Centered>Loading your ledger…</Centered>;
  }
  if (q.isError) {
    return <Centered>This link is invalid or has been revoked.</Centered>;
  }
  const { tenant, bills } = q.data!;
  let billed = 0, paid = 0;
  for (const b of bills) {
    billed += billTotal(b, b.bill_charges ?? []);
    paid += paymentsTotal(b.payments ?? []);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">HamroRent · Tenant view</p>
          <h1 className="font-display text-3xl">{tenant.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant.room_number ? `Room ${tenant.room_number}` : ""}
            {tenant.move_in_date_bs && ` · since ${tenant.move_in_date_bs}`}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Total billed" value={formatNpr(billed)} />
          <Stat label="Total paid" value={formatNpr(paid)} />
          <Stat label="Balance" value={formatNpr(billed - paid)} highlight={billed - paid > 0} />
        </div>

        <h2 className="mb-4 font-display text-xl">Monthly bills</h2>
        {bills.length === 0 ? (
          <p className="text-muted-foreground">No bills yet.</p>
        ) : (
          <div className="space-y-3">
            {bills.map((b: any) => {
              const charges = b.bill_charges ?? [];
              const total = billTotal(b, charges);
              const p = paymentsTotal(b.payments ?? []);
              return (
                <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-display text-lg">{bsLabel(b.bs_year, b.bs_month)}</p>
                    <StatusBadge status={statusFor(total, p)} />
                  </div>
                  <ul className="space-y-1 text-sm">
                    <Row label="Rent" amount={Number(b.rent_amount)} />
                    <Row label="Water" amount={Number(b.water_amount)} />
                    <Row label="Electricity" amount={electricityTotal(b)} />
                    {charges.map((c: any) => <Row key={c.id} label={c.label} amount={Number(c.amount)} />)}
                    <li className="flex justify-between border-t border-border pt-1.5 font-medium"><span>Total</span><span>{formatNpr(total)}</span></li>
                    <li className="flex justify-between text-muted-foreground"><span>Paid</span><span>{formatNpr(p)}</span></li>
                    <li className="flex justify-between font-medium"><span>Remaining</span><span>{formatNpr(total - p)}</span></li>
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-10 text-center text-xs text-muted-foreground">Read-only view shared by your landlord.</p>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-warning/50 bg-warning/10" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <li className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{formatNpr(amount)}</span></li>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-muted-foreground">
      {children}
    </div>
  );
}
