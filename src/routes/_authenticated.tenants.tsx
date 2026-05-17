import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listTenants } from "@/lib/hamrorent.functions";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "Tenants — HamroRent" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const fetchTenants = useServerFn(listTenants);
  const { data, isLoading } = useQuery({ queryKey: ["tenants"], queryFn: () => fetchTenants() });
  const [tab, setTab] = useState("active");
  const tenants = (data ?? []) as any[];
  const active = tenants.filter((t) => t.is_active);
  const archived = tenants.filter((t) => !t.is_active);

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl">Tenants</h1>
        <Button asChild>
          <Link to="/tenants/new"><Plus className="size-4" /> Add tenant</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <TenantList list={active} loading={isLoading} emptyText="No active tenants yet." />
        </TabsContent>
        <TabsContent value="archived" className="mt-4">
          <TenantList list={archived} loading={isLoading} emptyText="No archived tenants." />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function TenantList({ list, loading, emptyText }: { list: any[]; loading: boolean; emptyText: string }) {
  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (list.length === 0) return <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">{emptyText}</p>;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Room</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Move-in (BS)</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {list.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{t.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.room_number ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.phone ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.move_in_date_bs ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/tenants/$tenantId" params={{ tenantId: t.id }}>Open</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
