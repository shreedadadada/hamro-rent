import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTenant } from "@/lib/hamrorent.functions";
import { toast } from "sonner";
import { ArrowLeft, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenants/new")({
  head: () => ({ meta: [{ title: "Add tenant — HamroRent" }] }),
  component: NewTenantPage,
});

function NewTenantPage() {
  const router = useRouter();
  const save = useServerFn(saveTenant);
  const [form, setForm] = useState({
    name: "",
    room_number: "",
    phone: "",
    move_in_date_bs: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const t = await save(form);
      toast.success("Tenant added successfully");
      router.navigate({ to: "/tenants/$tenantId", params: { tenantId: (t as any).id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        {/* Back */}
        <button
          onClick={() => router.history.back()}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        {/* Header */}
        <div className="mb-7">
          <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <UserPlus className="size-5 text-primary" />
          </div>
          <h1 className="font-display text-4xl tracking-tight">Add tenant</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Fill in the details below. You can always update them later.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-7 space-y-5 shadow-sm">
          <Field label="Full name" required hint="As it appears on their documents">
            <Input
              className="rounded-xl h-11"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Ram Shrestha"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room / Unit number">
              <Input
                className="rounded-xl h-11"
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                placeholder="e.g. 101, 2B"
              />
            </Field>
            <Field label="Phone number">
              <Input
                className="rounded-xl h-11"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9841000000"
              />
            </Field>
          </div>

          <Field
            label="Move-in date (BS)"
            hint="e.g. 2081-01 for Baisakh 2081"
          >
            <Input
              className="rounded-xl h-11"
              value={form.move_in_date_bs}
              onChange={(e) => setForm({ ...form, move_in_date_bs: e.target.value })}
              placeholder="2081-01"
            />
          </Field>

          <Field label="Notes">
            <Textarea
              className="rounded-xl"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this tenant…"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => router.history.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl gap-1.5" disabled={loading}>
              {loading ? "Saving…" : <><UserPlus className="size-4" /> Save tenant</>}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
