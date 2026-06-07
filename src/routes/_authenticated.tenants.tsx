import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listTenants, saveTenant } from "@/lib/hamrorent.functions";
import { Plus, Upload, X, CheckCircle, AlertCircle, FileSpreadsheet, Users, ArrowRight, Phone } from "lucide-react";
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
      const parsed: ImportRow[] = raw
        .map((r: any) => ({
          name: String(r.name ?? r.Name ?? "").trim(),
          room_number: String(r.room_number ?? r["Room Number"] ?? r.Room ?? "").trim() || undefined,
          phone: String(r.phone ?? r.Phone ?? "").trim() || undefined,
          move_in_date_bs: String(r.move_in_date_bs ?? r["Move In Date"] ?? "").trim() || undefined,
          notes: String(r.notes ?? r.Notes ?? "").trim() || undefined,
          is_active: r.is_active !== undefined ? String(r.is_active).toLowerCase() !== "false" : true,
          status: "pending" as const,
        }))
        .filter((r: ImportRow) => r.name);
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
    a.href = url;
    a.download = "hamrorent-import-template.xlsx";
    a.click();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg">Import from Excel</h2>
              <p className="text-xs text-muted-foreground">Upload .xlsx file with tenant data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {rows.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Recognized columns:{" "}
                {["name", "room_number", "phone", "move_in_date_bs", "notes", "is_active"].map((col) => (
                  <code key={col} className="mx-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs font-mono">
                    {col}
                  </code>
                ))}
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 py-14 transition hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="size-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Click to upload Excel file</p>
                  <p className="text-sm text-muted-foreground mt-0.5">.xlsx files only</p>
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
            <div className="space-y-4">
              {done && (
                <div
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
                    errorCount === 0
                      ? "bg-success/10 text-success border border-success/20"
                      : "bg-warning/10 text-warning-foreground border border-warning/20"
                  }`}
                >
                  <CheckCircle className="size-4 flex-shrink-0" />
                  {successCount} imported{errorCount > 0 ? `, ${errorCount} failed` : " successfully"}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {rows.length} tenant{rows.length !== 1 ? "s" : ""} found in file
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      {["Name", "Room", "Phone", "Move-in", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((r, i) => (
                      <tr key={i} className="data-row">
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.room_number ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.move_in_date_bs ?? "—"}</td>
                        <td className="px-4 py-3">
                          {r.status === "pending" && <span className="text-muted-foreground text-xs">Pending</span>}
                          {r.status === "success" && <CheckCircle className="size-4 text-success" />}
                          {r.status === "error" && (
                            <span className="flex items-center gap-1 text-destructive text-xs">
                              <AlertCircle className="size-3.5" />
                              {r.error}
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

        {rows.length > 0 && (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={onClose} className="rounded-xl">
              {done ? "Close" : "Cancel"}
            </Button>
            {!done && (
              <Button onClick={runImport} disabled={importing} className="rounded-xl">
                {importing
                  ? `Importing… (${successCount}/${rows.length})`
                  : `Import ${rows.length} tenant${rows.length !== 1 ? "s" : ""}`}
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

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Management</p>
          <h1 className="font-display text-4xl tracking-tight">Tenants</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={() => setShowImport(true)}>
            <Upload className="size-4" /> Import Excel
          </Button>
          <Button asChild size="sm" className="rounded-lg gap-1.5">
            <Link to="/tenants/new">
              <Plus className="size-4" /> Add tenant
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="active" className="rounded-lg">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="rounded-lg">
            Archived ({archived.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-5">
          <TenantList list={active} loading={isLoading} emptyText="No active tenants yet." />
        </TabsContent>
        <TabsContent value="archived" className="mt-5">
          <TenantList list={archived} loading={isLoading} emptyText="No archived tenants." />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function TenantList({ list, loading, emptyText }: { list: any[]; loading: boolean; emptyText: string }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <Users className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            {["Tenant", "Room", "Phone", "Move-in (BS)", ""].map((h, i) => (
              <th
                key={i}
                className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${i === 4 ? "text-right" : ""} ${i >= 2 ? "hidden sm:table-cell" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {list.map((t) => (
            <tr key={t.id} className="data-row">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{t.name}</p>
                    {t.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 sm:hidden">
                        <Phone className="size-2.5" /> {t.phone}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                {t.room_number ? (
                  <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-0.5 text-xs font-medium">
                    Room {t.room_number}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{t.phone ?? "—"}</td>
              <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{t.move_in_date_bs ?? "—"}</td>
              <td className="px-5 py-4 text-right">
                <Button size="sm" variant="ghost" asChild className="rounded-lg text-xs gap-1">
                  <Link to="/tenants/$tenantId" params={{ tenantId: t.id }}>
                    Open <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
