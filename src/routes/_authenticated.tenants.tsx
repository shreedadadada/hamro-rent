import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listTenants, saveTenant } from "@/lib/hamrorent.functions";
import { Plus, Upload, X, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "Tenants — HamroRent" }] }),
  component: TenantsPage,
});

type ImportRow = {
  name: string;
  room_number?: string;
  phone?: string;
  move_in_date_bs?: string;
  notes?: string;
  is_active?: boolean;
  status: "pending" | "success" | "error";
  error?: string;
};

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const save = useServerFn(saveTenant);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      const parsed: ImportRow[] = raw.map((r: any) => ({
        name: String(r.name ?? r.Name ?? "").trim(),
        room_number: String(r.room_number ?? r["Room Number"] ?? r.Room ?? "").trim() || undefined,
        phone: String(r.phone ?? r.Phone ?? "").trim() || undefined,
        move_in_date_bs: String(r.move_in_date_bs ?? r["Move In Date"] ?? "").trim() || undefined,
        notes: String(r.notes ?? r.Notes ?? "").trim() || undefined,
        is_active: r.is_active !== undefined ? String(r.is_active).toLowerCase() !== "false" : true,
        status: "pending",
      })).filter((r: ImportRow) => r.name);
      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
      { name: "Ram Shrestha", room_number: "101", phone: "9841000000", move_in_date_bs: "2081-01", notes: "", is_active: true },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenants");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const url = URL.createObjectURL(new Blob([out], { type: "application/octet-stream" }));
    const a = document.createElement("a");
    a.href = url; a.download = "hamrorent-import-template.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    setImporting(true);
    const updated = [...rows];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "success") continue;
      try {
        const { status, error, ...data } = updated[i];
        await save(data);
        updated[i] = { ...updated[i], status: "success" };
      } catch (err: any) {
        updated[i] = { ...updated[i], status: "error", error: err.message ?? "Failed" };
      }
      setRows([...updated]);
    }
    setImporting(false);
    setDone(true);
    onDone();
  };

  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-primary" />
            <h2 className="font-display text-xl">Import tenants from Excel</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {rows.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload an Excel file (.xlsx) with tenant data. Columns recognized:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">name</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">room_number</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">phone</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">move_in_date_bs</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">notes</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">is_active</code>
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 py-12 transition hover:border-primary hover:bg-muted/50"
              >
                <Upload className="size-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Click to upload Excel file</p>
                  <p className="text-sm text-muted-foreground">.xlsx files only</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
              <div className="flex justify-center">
                <button
                  onClick={downloadTemplate}
                  className="text-sm text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Download template (.xlsx)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {done && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${errorCount === 0 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  <CheckCircle className="size-4" />
                  {successCount} imported{errorCount > 0 ? `, ${errorCount} failed` : " successfully"}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{rows.length} tenant{rows.length !== 1 ? "s" : ""} found in file</p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Room</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Move-in</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.room_number ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.phone ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.move_in_date_bs ?? "—"}</td>
                        <td className="px-3 py-2">
                          {r.status === "pending" && <span className="text-muted-foreground">—</span>}
                          {r.status === "success" && <CheckCircle className="size-4 text-green-500" />}
                          {r.status === "error" && (
                            <span className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="size-4" />
                              <span className="text-xs">{r.error}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {rows.length > 0 && (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={onClose}>
              {done ? "Close" : "Cancel"}
            </Button>
            {!done && (
              <Button onClick={runImport} disabled={importing}>
                {importing ? `Importing… (${successCount}/${rows.length})` : `Import ${rows.length} tenant${rows.length !== 1 ? "s" : ""}`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TenantsPage() {
  const fetchTenants = useServerFn(listTenants);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["tenants"], queryFn: () => fetchTenants() });
  const [tab, setTab] = useState("active");
  const [showImport, setShowImport] = useState(false);
  const tenants = (data ?? []) as any[];
  const active = tenants.filter((t) => t.is_active);
  const archived = tenants.filter((t) => !t.is_active);

  return (
    <AppShell>
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => queryClient.invalidateQueries({ queryKey: ["tenants"] })}
        />
      )}
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl">Tenants</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="size-4" /> Import Excel
          </Button>
          <Button asChild>
            <Link to="/tenants/new"><Plus className="size-4" /> Add tenant</Link>
          </Button>
        </div>
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
