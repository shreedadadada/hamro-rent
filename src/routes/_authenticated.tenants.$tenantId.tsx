import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AppShell, StatusBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  getTenant, listBillsForTenant, createBill, recordPayment,
  deleteBill, deletePayment, setTenantActive, regenerateShareToken,
} from "@/lib/hamrorent.functions";
import {
  billTotal, paymentsTotal, statusFor, formatNpr, electricityTotal,
} from "@/lib/bill-math";
import { BS_MONTHS, BS_YEARS, bsLabel, currentBs } from "@/lib/bs-calendar";
import { waLink, billMessage, reminderMessage, receiptMessage } from "@/lib/whatsapp";
import { exportTenantExcel, exportTenantPdf } from "@/lib/exports";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronDown, MessageCircle, Download, Share2,
  Copy, RefreshCw, ArrowLeft, Phone, Calendar, Archive,
  RotateCcw, TrendingUp, Wallet, ReceiptText, CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  component: TenantDetailPage,
});

function TenantDetailPage() {
  const { tenantId } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchTenant = useServerFn(getTenant);
  const fetchBills = useServerFn(listBillsForTenant);
  const archive = useServerFn(setTenantActive);

  const tenantQ = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => fetchTenant({ data: { id: tenantId } } as any),
  });
  const billsQ = useQuery({
    queryKey: ["bills", tenantId],
    queryFn: () => fetchBills({ data: { tenantId } } as any),
  });

  const tenant = tenantQ.data as any;
  const bills = (billsQ.data ?? []) as any[];

  const lifetime = useMemo(() => {
    let billed = 0, paid = 0, credit = 0;
    for (const b of bills) {
      const t = billTotal(b, b.bill_charges ?? []);
      const p = paymentsTotal(b.payments ?? []);
      billed += t;
      paid += p;
      if (p > t) credit += p - t;
    }
    return { billed, paid, outstanding: Math.max(0, billed - paid), credit };
  }, [bills]);

  const portalUrl = tenant?.share_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/t/${tenant.share_token}`
    : "";

  const handleArchiveToggle = async () => {
    if (!tenant) return;
    if (tenant.is_active && lifetime.outstanding > 0) {
      if (!confirm(`This tenant has ${formatNpr(lifetime.outstanding)} outstanding. Archive anyway?`)) return;
    }
    await archive({ data: { id: tenant.id, is_active: !tenant.is_active } } as any);
    qc.invalidateQueries({ queryKey: ["tenant", tenantId] });
    qc.invalidateQueries({ queryKey: ["tenants"] });
    toast.success(tenant.is_active ? "Tenant archived" : "Tenant reactivated");
  };

  if (tenantQ.isLoading || !tenant) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Back */}
      <button
        onClick={() => router.history.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to tenants
      </button>

      {/* Tenant header card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-2xl text-primary">
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-3xl tracking-tight">{tenant.name}</h1>
                {!tenant.is_active && (
                  <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Archived
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {tenant.room_number && (
                  <span className="flex items-center gap-1.5">
                    <span className="size-4 inline-flex items-center justify-center rounded bg-muted text-[10px] font-bold">R</span>
                    Room {tenant.room_number}
                  </span>
                )}
                {tenant.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {tenant.phone}
                  </span>
                )}
                {tenant.move_in_date_bs && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Since {tenant.move_in_date_bs}
                  </span>
                )}
              </div>
              {tenant.notes && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground italic">{tenant.notes}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ShareDialog tenant={tenant} portalUrl={portalUrl} onRegenerated={() => qc.invalidateQueries({ queryKey: ["tenant", tenantId] })} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5">
                  <Download className="size-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportTenantExcel(tenant, bills)}>
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTenantPdf(tenant, bills)}>
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-lg gap-1.5 ${tenant.is_active ? "" : "text-success border-success/40 hover:bg-success/10"}`}
              onClick={handleArchiveToggle}
            >
              {tenant.is_active ? (
                <><Archive className="size-4" /> Archive</>
              ) : (
                <><RotateCcw className="size-4" /> Reactivate</>
              )}
            </Button>
            <NewBillDialog tenantId={tenantId} onSaved={() => qc.invalidateQueries({ queryKey: ["bills", tenantId] })} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TenantStatCard
          icon={ReceiptText}
          label="Total Billed"
          value={formatNpr(lifetime.billed)}
          iconColor="text-primary"
          iconBg="bg-primary/8"
        />
        <TenantStatCard
          icon={TrendingUp}
          label="Total Collected"
          value={formatNpr(lifetime.paid)}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <TenantStatCard
          icon={Wallet}
          label="Outstanding"
          value={formatNpr(lifetime.outstanding)}
          iconColor={lifetime.outstanding > 0 ? "text-destructive" : "text-success"}
          iconBg={lifetime.outstanding > 0 ? "bg-destructive/8" : "bg-success/10"}
          highlight={lifetime.outstanding > 0}
        />
        <TenantStatCard
          icon={CreditCard}
          label="Credit"
          value={formatNpr(lifetime.credit)}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />
      </div>

      {lifetime.credit > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/8 px-4 py-3.5 text-sm">
          <CreditCard className="size-4 text-accent flex-shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold">{formatNpr(lifetime.credit)}</strong> overpaid in prior months.
            Apply this as a credit when creating the next bill (add a negative charge labeled "Previous credit").
          </p>
        </div>
      )}

      {/* Bills section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl tracking-tight">Monthly Bills</h2>
        <span className="text-sm text-muted-foreground">{bills.length} bill{bills.length !== 1 ? "s" : ""} total</span>
      </div>

      {billsQ.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : bills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <ReceiptText className="mx-auto size-10 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium mb-1">No bills yet</p>
          <p className="text-sm text-muted-foreground mb-5">Create the first monthly bill above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <BillCard
              key={b.id}
              bill={b}
              tenant={tenant}
              portalUrl={portalUrl}
              onRefresh={() => qc.invalidateQueries({ queryKey: ["bills", tenantId] })}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function TenantStatCard({
  icon: Icon, label, value, iconColor, iconBg, highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card rounded-2xl border bg-card p-5 ${highlight ? "border-destructive/30" : "border-border"}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`inline-flex size-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
      </div>
      <p className="font-display text-2xl tracking-tight">{value}</p>
    </div>
  );
}

// ─── Share Dialog ────────────────────────────────────────────────────────────
function ShareDialog({ tenant, portalUrl, onRegenerated }: { tenant: any; portalUrl: string; onRegenerated: () => void }) {
  const [open, setOpen] = useState(false);
  const regen = useServerFn(regenerateShareToken);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(portalUrl);
    toast.success("Link copied to clipboard");
  };

  const handleRegen = async () => {
    if (!confirm("Generate a new link? The old one will stop working immediately.")) return;
    try {
      await regen({ data: { tenant_id: tenant.id } } as any);
      onRegenerated();
      toast.success("New link generated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const waShare = waLink(
    tenant.phone ?? "",
    `Namaste ${tenant.name},\n\nYou can view your rent ledger any time here:\n${portalUrl}`
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-lg gap-1.5">
          <Share2 className="size-4" /> Share portal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tenant portal link</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Anyone with this link can view (read-only) {tenant.name}'s bills and payment history. No signup needed.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={portalUrl} className="font-mono text-xs rounded-xl" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="rounded-xl flex-shrink-0">
            <Copy className="size-4" />
          </Button>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleRegen} className="gap-1.5">
            <RefreshCw className="size-4" /> Regenerate
          </Button>
          <Button type="button" asChild className="gap-1.5 rounded-xl">
            <a href={waShare} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" /> Send via WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bill Card ────────────────────────────────────────────────────────────────
function BillCard({ bill, tenant, portalUrl, onRefresh }: {
  bill: any; tenant: any; portalUrl: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const charges = bill.bill_charges ?? [];
  const payments = bill.payments ?? [];
  const total = billTotal(bill, charges);
  const paid = paymentsTotal(payments);
  const status = statusFor(total, paid);
  const remaining = total - paid;

  const removeBill = useServerFn(deleteBill);

  const handleDelete = async () => {
    try {
      await removeBill({ data: { id: bill.id } } as any);
      toast.success("Bill deleted");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-shadow ${open ? "shadow-md border-primary/20" : "border-border"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
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
          {remaining !== 0 && (
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={`font-semibold text-sm ${remaining > 0 ? "text-destructive" : "text-success"}`}>
                {formatNpr(Math.abs(remaining))}
              </p>
            </div>
          )}
          <StatusBadge status={status} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 bill-details">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Charges */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Charge Breakdown
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {Number(bill.rent_amount) > 0 && (
                      <ChargeRow label="Rent" amount={Number(bill.rent_amount)} />
                    )}
                    {Number(bill.water_amount) > 0 && (
                      <ChargeRow label="Water" amount={Number(bill.water_amount)} />
                    )}
                    <ChargeRow
                      label={`Electricity (${bill.electricity_mode === "per_unit" ? "per-unit" : "direct"})`}
                      amount={electricityTotal(bill)}
                      detail={
                        bill.electricity_mode === "per_unit"
                          ? `${Number(bill.elec_curr_reading ?? 0) - Number(bill.elec_prev_reading ?? 0)} units × NPR ${bill.elec_rate ?? 0}${Number(bill.elec_service_charge) ? ` + ${bill.elec_service_charge} svc` : ""}`
                          : undefined
                      }
                    />
                    {charges.map((c: any) => (
                      <ChargeRow key={c.id} label={c.label} amount={Number(c.amount)} />
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right">{formatNpr(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {bill.notes && (
                <p className="mt-3 text-xs italic text-muted-foreground">Note: {bill.notes}</p>
              )}
            </div>

            {/* Payments */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payments
                </h4>
                <PaymentDialog billId={bill.id} remaining={remaining} onSaved={onRefresh} />
              </div>
              {payments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {payments.map((p: any) => (
                        <PaymentRow key={p.id} payment={p} onDeleted={onRefresh} />
                      ))}
                      <tr className="bg-muted/30 font-semibold">
                        <td className="px-4 py-3">Total Paid</td>
                        <td className="px-4 py-3 text-right text-success">{formatNpr(paid)}</td>
                        <td className="px-4 py-3" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-lg gap-1.5">
                  <MessageCircle className="size-3.5" /> WhatsApp
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={waLink(tenant.phone ?? "", billMessage(tenant.name, bill, portalUrl))} target="_blank" rel="noreferrer">
                    Send bill
                  </a>
                </DropdownMenuItem>
                {remaining > 0 && (
                  <DropdownMenuItem asChild>
                    <a href={waLink(tenant.phone ?? "", reminderMessage(tenant.name, bill))} target="_blank" rel="noreferrer">
                      Send reminder
                    </a>
                  </DropdownMenuItem>
                )}
                {payments.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href={waLink(tenant.phone ?? "", receiptMessage(tenant.name, bill, payments[payments.length - 1]))} target="_blank" rel="noreferrer">
                        Send latest receipt
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="rounded-lg gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="size-3.5" /> Delete bill
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All payments recorded against {bsLabel(bill.bs_year, bill.bs_month)} will also be removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

function ChargeRow({ label, amount, detail }: { label: string; amount: number; detail?: string }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-muted-foreground">
        {label}
        {detail && <span className="ml-1 text-xs opacity-70">({detail})</span>}
      </td>
      <td className="px-4 py-2.5 text-right font-medium">{formatNpr(amount)}</td>
    </tr>
  );
}

function PaymentRow({ payment, onDeleted }: { payment: any; onDeleted: () => void }) {
  const removePayment = useServerFn(deletePayment);
  const handle = async () => {
    if (!confirm("Delete this payment?")) return;
    try {
      await removePayment({ data: { id: payment.id } } as any);
      toast.success("Payment removed");
      onDeleted();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  return (
    <tr>
      <td className="px-4 py-2.5 text-muted-foreground text-xs">
        <div>{payment.payment_date_bs}</div>
        <div className="capitalize text-muted-foreground/70">{payment.method}{payment.note ? ` · ${payment.note}` : ""}</div>
      </td>
      <td className="px-4 py-2.5 text-right font-medium">{formatNpr(Number(payment.amount_paid))}</td>
      <td className="px-4 py-2.5 text-right">
        <button onClick={handle} className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── New Bill Dialog ──────────────────────────────────────────────────────────
function NewBillDialog({ tenantId, onSaved }: { tenantId: string; onSaved: () => void }) {
  const bs = currentBs();
  const create = useServerFn(createBill);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    bs_year: bs.year,
    bs_month: bs.month,
    rent_amount: "",
    water_amount: "",
    electricity_mode: "direct" as "direct" | "per_unit",
    elec_prev_reading: "",
    elec_curr_reading: "",
    elec_rate: "",
    elec_service_charge: "",
    elec_direct_amount: "",
    notes: "",
  });
  const [charges, setCharges] = useState<{ label: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setForm({
      ...form,
      rent_amount: "", water_amount: "", elec_prev_reading: "",
      elec_curr_reading: "", elec_rate: "", elec_service_charge: "",
      elec_direct_amount: "", notes: "",
    });
    setCharges([]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const c of charges) {
      if (!c.label.trim()) return toast.error("Each additional charge needs a label");
    }
    setLoading(true);
    try {
      await create({
        data: {
          tenant_id: tenantId,
          bs_year: form.bs_year,
          bs_month: form.bs_month,
          rent_amount: Number(form.rent_amount || 0),
          water_amount: Number(form.water_amount || 0),
          electricity_mode: form.electricity_mode,
          elec_prev_reading: form.electricity_mode === "per_unit" ? Number(form.elec_prev_reading || 0) : null,
          elec_curr_reading: form.electricity_mode === "per_unit" ? Number(form.elec_curr_reading || 0) : null,
          elec_rate: form.electricity_mode === "per_unit" ? Number(form.elec_rate || 0) : null,
          elec_service_charge: Number(form.elec_service_charge || 0),
          elec_direct_amount: form.electricity_mode === "direct" ? Number(form.elec_direct_amount || 0) : 0,
          notes: form.notes || null,
          charges: charges.map((c) => ({ label: c.label.trim(), amount: Number(c.amount || 0) })),
        },
      } as any);
      toast.success("Bill created");
      reset();
      setOpen(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-lg gap-1.5">
          <Plus className="size-4" /> New bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create monthly bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Month/Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">BS Year</Label>
              <Select value={String(form.bs_year)} onValueChange={(v) => setForm({ ...form, bs_year: Number(v) })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BS_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">BS Month</Label>
              <Select value={String(form.bs_month)} onValueChange={(v) => setForm({ ...form, bs_month: Number(v) })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BS_MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rent & Water */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rent (NPR)</Label>
              <Input type="number" min="0" step="0.01" className="rounded-xl" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Water (NPR)</Label>
              <Input type="number" min="0" step="0.01" className="rounded-xl" value={form.water_amount} onChange={(e) => setForm({ ...form, water_amount: e.target.value })} />
            </div>
          </div>

          {/* Electricity */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Electricity</Label>
            <div className="flex gap-2">
              {(["direct", "per_unit"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, electricity_mode: m })}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    form.electricity_mode === m
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  {m === "direct" ? "Direct amount" : "Per-unit reading"}
                </button>
              ))}
            </div>
            {form.electricity_mode === "direct" ? (
              <Input type="number" min="0" step="0.01" placeholder="NEA bill amount (NPR)" className="rounded-xl" value={form.elec_direct_amount} onChange={(e) => setForm({ ...form, elec_direct_amount: e.target.value })} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" placeholder="Previous reading" className="rounded-xl" value={form.elec_prev_reading} onChange={(e) => setForm({ ...form, elec_prev_reading: e.target.value })} />
                <Input type="number" min="0" placeholder="Current reading" className="rounded-xl" value={form.elec_curr_reading} onChange={(e) => setForm({ ...form, elec_curr_reading: e.target.value })} />
                <Input type="number" min="0" step="0.01" placeholder="Rate per unit" className="rounded-xl" value={form.elec_rate} onChange={(e) => setForm({ ...form, elec_rate: e.target.value })} />
                <Input type="number" min="0" step="0.01" placeholder="Service charge" className="rounded-xl" value={form.elec_service_charge} onChange={(e) => setForm({ ...form, elec_service_charge: e.target.value })} />
              </div>
            )}
          </div>

          {/* Additional charges */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Additional Charges</Label>
              <Button type="button" size="sm" variant="ghost" className="rounded-lg gap-1 text-xs" onClick={() => setCharges([...charges, { label: "", amount: "" }])}>
                <Plus className="size-3.5" /> Add charge
              </Button>
            </div>
            {charges.length === 0 ? (
              <p className="text-xs text-muted-foreground">e.g. Garbage, Internet, Parking.</p>
            ) : (
              <div className="space-y-2">
                {charges.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Label (e.g. Garbage)" className="rounded-xl" value={c.label} onChange={(e) => { const n = [...charges]; n[i].label = e.target.value; setCharges(n); }} />
                    <Input type="number" min="0" step="0.01" placeholder="NPR" className="w-32 rounded-xl" value={c.amount} onChange={(e) => { const n = [...charges]; n[i].amount = e.target.value; setCharges(n); }} />
                    <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setCharges(charges.filter((_, idx) => idx !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea rows={2} className="rounded-xl" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl" disabled={loading}>{loading ? "Saving…" : "Create bill"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Dialog ───────────────────────────────────────────────────────────
function PaymentDialog({ billId, remaining, onSaved }: { billId: string; remaining: number; onSaved: () => void }) {
  const record = useServerFn(recordPayment);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    payment_date_bs: "",
    amount_paid: remaining > 0 ? String(remaining) : "",
    method: "cash" as "cash" | "bank" | "esewa" | "khalti" | "other",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payment_date_bs.trim()) return toast.error("Payment date is required");
    if (Number(form.amount_paid) <= 0) return toast.error("Amount must be greater than 0");
    setLoading(true);
    try {
      await record({
        data: {
          bill_id: billId,
          payment_date_bs: form.payment_date_bs,
          amount_paid: Number(form.amount_paid),
          method: form.method,
          note: form.note || null,
        },
      } as any);
      toast.success("Payment recorded");
      setOpen(false);
      setForm({ payment_date_bs: "", amount_paid: "", method: "cash", note: "" });
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-lg gap-1.5">
          <Plus className="size-3.5" /> Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment date (BS)</Label>
            <Input placeholder="e.g. 2081-02-15" className="rounded-xl" value={form.payment_date_bs} onChange={(e) => setForm({ ...form, payment_date_bs: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (NPR)</Label>
            <Input type="number" min="0.01" step="0.01" className="rounded-xl" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} required />
            {remaining > 0 && <p className="text-xs text-muted-foreground">Remaining: {formatNpr(remaining)}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as any })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="esewa">eSewa</SelectItem>
                <SelectItem value="khalti">Khalti</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note (optional)</Label>
            <Input className="rounded-xl" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="rounded-xl" disabled={loading}>{loading ? "Saving…" : "Record payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
