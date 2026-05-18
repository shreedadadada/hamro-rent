import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { listTenants, listAllBills, exportAllData } from "@/lib/hamrorent.functions";
import { billTotal, paymentsTotal, statusFor, formatNpr } from "@/lib/bill-math";
import { bsLabel, currentBs } from "@/lib/bs-calendar";
import { exportJsonBackup } from "@/lib/exports";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HamroRent" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchTenants = useServerFn(listTenants);
  const fetchBills = useServerFn(listAllBills);

  const tenantsQ = useQuery({ queryKey: ["tenants"], queryFn: () => fetchTenants() });
  const billsQ = useQuery({ queryKey: ["bills"], queryFn: () => fetchBills() });

  const bs = useMemo(() => currentBs(), []);
  const tenants = tenantsQ.data ?? [];
  const activeTenants = tenants.filter((t: any) => t.is_active);
  const bills = (billsQ.data ?? []) as any[];

  const monthBills = bills.filter((b) => b.bs_year === bs.year && b.bs_month === bs.month);
  const expected = monthBills.reduce((s, b) => s + billTotal(b, b.bill_charges ?? []), 0);
  const collected = monthBills.reduce((s, b) => s + paymentsTotal(b.payments ?? []), 0);
  const paidCount = monthBills.filter((b) => {
    const t = billTotal(b, b.bill_charges ?? []);
    return statusFor(t, paymentsTotal(b.payments ?? [])) === "paid";
  }).length;
  const pendingCount = monthBills.length - paidCount;

  // Per-tenant current month status
  const tenantStatus = (tenantId: string) => {
    const bill = monthBills.find((b) => b.tenant_id === tenantId);
    if (!bill) return null;
    const t = billTotal(bill, bill.bill_charges ?? []);
    const p = paymentsTotal(bill.payments ?? []);
    return statusFor(t, p);
  };

  return (
    <AppShell>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{bsLabel(bs.year, bs.month)}</p>
          <h1 className="font-display text-4xl">Dashboard</h1>
        </div>
        <Button asChild>
          <Link to="/tenants/new"><Plus className="size-4" /> Add tenant</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active tenants" value={activeTenants.length.toString()} />
        <StatCard label="Bills this month" value={monthBills.length.toString()} />
        <StatCard label="Expected" value={formatNpr(expected)} />
        <StatCard label="Collected" value={formatNpr(collected)} subtle={`${paidCount} paid · ${pendingCount} pending`} />
      </div>

      <h2 className="mt-12 mb-4 font-display text-2xl">Tenants</h2>
      {tenantsQ.isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : activeTenants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">No tenants yet.</p>
          <Button className="mt-4" asChild>
            <Link to="/tenants/new">Add your first tenant</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">{bsLabel(bs.year, bs.month)} status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {activeTenants.map((t: any) => {
                const status = tenantStatus(t.id);
                return (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.room_number ?? "—"}</td>
                    <td className="px-4 py-3">{status ? <StatusBadge status={status} /> : <span className="text-xs text-muted-foreground">No bill yet</span>}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/tenants/$tenantId" params={{ tenantId: t.id }}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ label, value, subtle }: { label: string; value: string; subtle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {subtle && <p className="mt-1 text-xs text-muted-foreground">{subtle}</p>}
    </div>
  );
}
