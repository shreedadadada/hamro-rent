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

export const Route = createFileRoute("/_authenticated/tenants/new")({
  head: () => ({ meta: [{ title: "Add tenant — HamroRent" }] }),
  component: NewTenantPage,
});

function NewTenantPage() {
  const router = useRouter();
  const save = useServerFn(saveTenant);
  const [form, setForm] = useState({ name: "", room_number: "", phone: "", move_in_date_bs: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const t = await save({ data: form } as any);
      toast.success("Tenant added");
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
        <h1 className="mb-6 font-display text-4xl">Add tenant</h1>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <Field label="Full name *">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room / Unit number">
              <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Move-in date (BS)" hint="e.g. Baisakh 2081 or 2081-01">
            <Input value={form.move_in_date_bs} onChange={(e) => setForm({ ...form, move_in_date_bs: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.history.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save tenant"}</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
