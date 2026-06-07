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
import { Plus, Download, TrendingUp, Users, ReceiptText, Wallet, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HamroRent" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchTenants = useServerFn(listTenants);
  const fetchBills = useServerFn(listAllBills);
  const backup = useServerFn(exportAllData);

  const tenantsQ = useQuery({ queryKey: ["tenants"], queryFn: () => fetchTenants() });
  const billsQ = useQuery({ queryKey: ["bills"], queryFn: () => fetchBills() });

  const bs = useMemo(() => currentBs(), []);
  const tenants = tenantsQ.data ?? [];
  const activeTenants = tenants.filter((t: any) => t.is_active);
  const bills = (billsQ.data ?? []) as any[];

  const monthBills = bills.filter((b) => b.bs_year === bs.year && b.bs_month === bs.month);
  const expected = monthBills.reduce((s, b) => s + billTotal(b, b.bill_charges ?? []), 0);
  const collected = monthBills.reduce((s, b) => s + paymentsTotal(b.payments ?? []), 0);
  const outstanding = Math.max(0, expected - collected);
  const paidCount = monthBills.filter((b) => {
    const t = billTotal(b, b.bill_charges ?? []);
    return statusFor(t, paymentsTotal(b.payments ?? [])) === "paid";
  }).length;
  const pendingCount = monthBills.length - paidCount;

  const tenantStatus = (tenantId: string) => {
    const bill = monthBills.find((b) => b.tenant_id === tenantId);
    if (!bill) return null;
    const t = billTotal(bill, bill.bill_charges ?? []);
    const p = paymentsTotal(bill.payments ?? []);
    return statusFor(t, p);
  };

  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {bsLabel(bs.year, bs.month)}
          </p>
          <h1 className="font-display text-4xl tracking-tight">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg gap-1.5"
            onClick={async () => {
              try {
                const d = await backup();
                exportJsonBackup(d, `hamrorent-backup-${new Date().toISOString().slice(0, 10)}.json`);
                toast.success("Backup downloaded");
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            <Download className="size-4" /> Backup
          </Button>
          <Button asChild size="sm" className="rounded-lg gap-1.5">
            <Link to="/tenants/new">
              <Plus className="size-4" /> Add tenant
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard
          icon={Users}
          label="Active Tenants"
          value={activeTenants.length.toString()}
          subtle="in your property"
          iconColor="text-primary"
          iconBg="bg-primary/8"
        />
        <StatCard
          icon={Wallet}
          label="Expected This Month"
          value={formatNpr(expected)}
          subtle={`${monthBills.length} bills generated`}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Collected"
          value={formatNpr(collected)}
          subtle={`${collectionRate}% collection rate`}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <StatCard
          icon={ReceiptText}
          label="Outstanding"
          value={formatNpr(outstanding)}
          subtle={`${pendingCount} pending · ${paidCount} paid`}
          iconColor={outstanding > 0 ? "text-destructive" : "text-success"}
          iconBg={outstanding > 0 ? "bg-destructive/8" : "bg-success/10"}
          highlight={outstanding > 0}
        />
      </div>

      {/* Collection progress bar */}
      {monthBills.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Collection progress — {bsLabel(bs.year, bs.month)}</p>
            <p className="text-sm font-semibold">{collectionRate}%</p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${collectionRate}%`,
                backgroundColor: collectionRate >= 80 ? "oklch(0.58 0.14 148)" : collectionRate >= 50 ? "oklch(0.73 0.16 70)" : "oklch(0.52 0.22 25)",
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{formatNpr(collected)} collected</span>
            <span>{formatNpr(outstanding)} remaining</span>
          </div>
        </div>
      )}

      {/* Tenant table */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl tracking-tight">Active Tenants</h2>
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link to="/tenants">
            View all <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </div>

      {tenantsQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : activeTenants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto size-10 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium mb-1">No tenants yet</p>
          <p className="text-sm text-muted-foreground mb-5">Add your first tenant to start tracking rent.</p>
          <Button asChild className="rounded-xl">
            <Link to="/tenants/new">
              <Plus className="mr-1.5 size-4" /> Add first tenant
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tenant
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                  Room
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {bsLabel(bs.year, bs.month)}
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTenants.map((t: any) => {
                const status = tenantStatus(t.id);
                return (
                  <tr key={t.id} className="data-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {t.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">
                      {t.room_number ? (
                        <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-0.5 text-xs font-medium">
                          Room {t.room_number}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {status ? (
                        <StatusBadge status={status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">No bill yet</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button size="sm" variant="ghost" asChild className="rounded-lg text-xs">
                        <Link to="/tenants/$tenantId" params={{ tenantId: t.id }}>
                          Open <ArrowRight className="ml-1 size-3" />
                        </Link>
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

function StatCard({
  icon: Icon,
  label,
  value,
  subtle,
  iconColor,
  iconBg,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtle?: string;
  iconColor: string;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card rounded-2xl border bg-card p-5 ${highlight ? "border-destructive/30" : "border-border"}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`inline-flex size-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </div>
      <p className="font-display text-2xl tracking-tight">{value}</p>
      {subtle && <p className="mt-1 text-xs text-muted-foreground">{subtle}</p>}
    </div>
  );
}
