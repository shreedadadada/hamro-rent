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
import { Plus, Trash2, ChevronDown, MessageCircle, Download, Share2, Copy, RefreshCw } from "lucide-react";


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
    let billed = 0, paid = 0;
    for (const b of bills) {
      const t = billTotal(b, b.bill_charges ?? []);
      billed += t;
      paid += paymentsTotal(b.payments ?? []);
    }
    return { billed, paid, outstanding: billed - paid };
  }, [bills]);

  const handleArchiveToggle = async () => {
    if (!tenant) return;
    if (tenant.is_active && lifetime.outstanding > 0) {
      if (!confirm(`This tenant has ${formatNpr(lifetime.outstanding)} outstanding. Archive anyway?`)) return;
    }
    await archive({ data: { id: tenant.id, is_active: !tenant.is_active } } as any);
    qc.invalidateQueries({ queryKey: ["tenant", tenantId] });
    qc.invalidateQueries({ queryKey: ["tenants"] });
    toast.success(tenant.is_active ? "Archived" : "Reactivated");
  };

  if (tenantQ.isLoading || !tenant) {
    return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Tenant {!tenant.is_active && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-foreground">Archived</span>}
          </p>
          <h1 className="font-display text-4xl">{tenant.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {tenant.room_number ? `Room ${tenant.room_number}` : "No room set"}
            {tenant.phone && ` · ${tenant.phone}`}
            {tenant.move_in_date_bs && ` · since ${tenant.move_in_date_bs}`}
          </p>
          {tenant.notes && <p className="mt-2 max-w-2xl text-sm text-muted-foreground italic">{tenant.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleArchiveToggle}>
            {tenant.is_active ? "Archive" : "Reactivate"}
          </Button>
          <NewBillDialog tenantId={tenantId} onSaved={() => qc.invalidateQueries({ queryKey: ["bills", tenantId] })} />
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Total billed" value={formatNpr(lifetime.billed)} />
        <StatCard label="Total collected" value={formatNpr(lifetime.paid)} />
        <StatCard label="Outstanding" value={formatNpr(lifetime.outstanding)} highlight={lifetime.outstanding > 0} />
      </div>

      <h2 className="mb-4 font-display text-2xl">Monthly bills</h2>
      {billsQ.isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : bills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          No bills yet. Create the first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <BillCard
              key={b.id}
              bill={b}
              onRefresh={() => qc.invalidateQueries({ queryKey: ["bills", tenantId] })}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <Button variant="ghost" onClick={() => router.history.back()}>← Back</Button>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-warning/50 bg-warning/10" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

// ---------- Bill Card ----------
function BillCard({ bill, onRefresh }: { bill: any; onRefresh: () => void }) {
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
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <ChevronDown className={`size-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
          <div>
            <p className="font-display text-xl">{bsLabel(bill.bs_year, bill.bs_month)}</p>
            <p className="text-xs text-muted-foreground">{payments.length} payment{payments.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="font-medium">{formatNpr(total)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Remaining</p>
            <p className="font-medium">{formatNpr(remaining)}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Charges</h4>
              <ul className="space-y-1.5 text-sm">
                <LineItem label="Rent" amount={Number(bill.rent_amount)} />
                <LineItem label="Water" amount={Number(bill.water_amount)} />
                <LineItem
                  label={`Electricity (${bill.electricity_mode === "per_unit" ? "per-unit" : "direct"})`}
                  amount={electricityTotal(bill)}
                  detail={bill.electricity_mode === "per_unit"
                    ? `${Number(bill.elec_curr_reading ?? 0) - Number(bill.elec_prev_reading ?? 0)} units × NPR ${bill.elec_rate ?? 0}${Number(bill.elec_service_charge) ? ` + ${bill.elec_service_charge} service` : ""}`
                    : undefined}
                />
                {charges.map((c: any) => (
                  <LineItem key={c.id} label={c.label} amount={Number(c.amount)} />
                ))}
                <li className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Total</span><span>{formatNpr(total)}</span>
                </li>
              </ul>
              {bill.notes && <p className="mt-3 text-xs italic text-muted-foreground">{bill.notes}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Payments</h4>
                <PaymentDialog billId={bill.id} remaining={remaining} onSaved={onRefresh} />
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {payments.map((p: any) => (
                    <PaymentRow key={p.id} payment={p} onDeleted={onRefresh} />
                  ))}
                  <li className="flex justify-between border-t border-border pt-2 font-medium">
                    <span>Paid</span><span>{formatNpr(paid)}</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
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
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

function LineItem({ label, amount, detail }: { label: string; amount: number; detail?: string }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-muted-foreground">
        {label}
        {detail && <span className="ml-1 text-xs">({detail})</span>}
      </span>
      <span>{formatNpr(amount)}</span>
    </li>
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
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">
        {payment.payment_date_bs} · <span className="capitalize">{payment.method}</span>
        {payment.note && <span className="ml-1 italic">— {payment.note}</span>}
      </span>
      <span className="flex items-center gap-2">
        {formatNpr(Number(payment.amount_paid))}
        <button onClick={handle} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-3.5" />
        </button>
      </span>
    </li>
  );
}

// ---------- New Bill Dialog ----------
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
    setForm({ ...form, rent_amount: "", water_amount: "", elec_prev_reading: "", elec_curr_reading: "", elec_rate: "", elec_service_charge: "", elec_direct_amount: "", notes: "" });
    setCharges([]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate charges
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
        <Button><Plus className="size-4" /> New bill</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create monthly bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">BS Year</Label>
              <Select value={String(form.bs_year)} onValueChange={(v) => setForm({ ...form, bs_year: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BS_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">BS Month</Label>
              <Select value={String(form.bs_month)} onValueChange={(v) => setForm({ ...form, bs_month: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BS_MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Rent (NPR)</Label>
              <Input type="number" min="0" step="0.01" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1.5 block">Water (NPR)</Label>
              <Input type="number" min="0" step="0.01" value={form.water_amount} onChange={(e) => setForm({ ...form, water_amount: e.target.value })} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <Label className="mb-2 block">Electricity</Label>
            <div className="mb-3 flex gap-2 text-sm">
              {(["direct", "per_unit"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, electricity_mode: m })}
                  className={`flex-1 rounded-md border px-3 py-2 transition ${form.electricity_mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                >
                  {m === "direct" ? "Direct amount" : "Per-unit reading"}
                </button>
              ))}
            </div>
            {form.electricity_mode === "direct" ? (
              <Input type="number" min="0" step="0.01" placeholder="NEA bill amount (NPR)" value={form.elec_direct_amount} onChange={(e) => setForm({ ...form, elec_direct_amount: e.target.value })} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" placeholder="Previous reading" value={form.elec_prev_reading} onChange={(e) => setForm({ ...form, elec_prev_reading: e.target.value })} />
                <Input type="number" min="0" placeholder="Current reading" value={form.elec_curr_reading} onChange={(e) => setForm({ ...form, elec_curr_reading: e.target.value })} />
                <Input type="number" min="0" step="0.01" placeholder="Rate per unit" value={form.elec_rate} onChange={(e) => setForm({ ...form, elec_rate: e.target.value })} />
                <Input type="number" min="0" step="0.01" placeholder="Service charge (optional)" value={form.elec_service_charge} onChange={(e) => setForm({ ...form, elec_service_charge: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Additional charges</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => setCharges([...charges, { label: "", amount: "" }])}>
                <Plus className="size-3.5" /> Add charge
              </Button>
            </div>
            {charges.length === 0 ? (
              <p className="text-xs text-muted-foreground">e.g. Garbage, Internet, Parking — add as many as you like.</p>
            ) : (
              <div className="space-y-2">
                {charges.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Label" value={c.label} onChange={(e) => { const n = [...charges]; n[i].label = e.target.value; setCharges(n); }} />
                    <Input type="number" min="0" step="0.01" placeholder="NPR" className="w-32" value={c.amount} onChange={(e) => { const n = [...charges]; n[i].amount = e.target.value; setCharges(n); }} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCharges(charges.filter((_, idx) => idx !== i))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create bill"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Payment Dialog ----------
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
        <Button size="sm" variant="outline"><Plus className="size-3.5" /> Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Payment date (BS)</Label>
            <Input placeholder="e.g. 2081-02-15" value={form.payment_date_bs} onChange={(e) => setForm({ ...form, payment_date_bs: e.target.value })} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Amount (NPR)</Label>
            <Input type="number" min="0.01" step="0.01" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} required />
            {remaining > 0 && <p className="mt-1 text-xs text-muted-foreground">Remaining on this bill: {formatNpr(remaining)}</p>}
          </div>
          <div>
            <Label className="mb-1.5 block">Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="esewa">eSewa</SelectItem>
                <SelectItem value="khalti">Khalti</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Note</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Record payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
