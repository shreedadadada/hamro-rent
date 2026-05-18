import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { billTotal, paymentsTotal, statusFor, formatNpr, electricityTotal } from "./bill-math";
import { bsLabel } from "./bs-calendar";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTenantExcel(tenant: any, bills: any[]) {
  const rows = bills.map((b) => {
    const charges = b.bill_charges ?? [];
    const total = billTotal(b, charges);
    const paid = paymentsTotal(b.payments ?? []);
    return {
      Period: bsLabel(b.bs_year, b.bs_month),
      Rent: Number(b.rent_amount),
      Water: Number(b.water_amount),
      Electricity: electricityTotal(b),
      "Other charges": charges.reduce((s: number, c: any) => s + Number(c.amount), 0),
      Total: total,
      Paid: paid,
      Remaining: total - paid,
      Status: statusFor(total, paid),
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bills");

  const payRows = bills.flatMap((b) =>
    (b.payments ?? []).map((p: any) => ({
      Period: bsLabel(b.bs_year, b.bs_month),
      "Payment date": p.payment_date_bs,
      Amount: Number(p.amount_paid),
      Method: p.method,
      Note: p.note ?? "",
    })),
  );
  if (payRows.length) {
    const ws2 = XLSX.utils.json_to_sheet(payRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Payments");
  }

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  download(new Blob([out], { type: "application/octet-stream" }), `${tenant.name}-ledger.xlsx`);
}

export function exportTenantPdf(tenant: any, bills: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`${tenant.name} — Rent Ledger`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    [
      tenant.room_number ? `Room ${tenant.room_number}` : "",
      tenant.phone ?? "",
      tenant.move_in_date_bs ? `Since ${tenant.move_in_date_bs}` : "",
    ]
      .filter(Boolean)
      .join("  ·  "),
    14,
    25,
  );

  autoTable(doc, {
    startY: 32,
    head: [["Period", "Rent", "Water", "Elec", "Other", "Total", "Paid", "Remaining", "Status"]],
    body: bills.map((b) => {
      const charges = b.bill_charges ?? [];
      const total = billTotal(b, charges);
      const paid = paymentsTotal(b.payments ?? []);
      return [
        bsLabel(b.bs_year, b.bs_month),
        formatNpr(Number(b.rent_amount)),
        formatNpr(Number(b.water_amount)),
        formatNpr(electricityTotal(b)),
        formatNpr(charges.reduce((s: number, c: any) => s + Number(c.amount), 0)),
        formatNpr(total),
        formatNpr(paid),
        formatNpr(total - paid),
        statusFor(total, paid),
      ];
    }),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 115, 85] },
  });

  doc.save(`${tenant.name}-ledger.pdf`);
}

export function exportJsonBackup(payload: unknown, filename = "hamrorent-backup.json") {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  download(blob, filename);
}
