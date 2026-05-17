export const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
] as const;

export const BS_YEARS: number[] = [];
for (let y = 2078; y <= 2090; y++) BS_YEARS.push(y);

export function bsLabel(year: number, month: number): string {
  return `${BS_MONTHS[month - 1] ?? "?"} ${year}`;
}

/** Best-effort current BS year/month from system date. */
export function currentBs(): { year: number; month: number } {
  const now = new Date();
  // Approximate: BS year ≈ AD year + 56 from mid-April onward, otherwise +57 for early months.
  const adYear = now.getUTCFullYear();
  const adMonth = now.getUTCMonth() + 1; // 1-12
  const adDay = now.getUTCDate();
  // BS new year starts ~April 13-14
  const isBeforeBsNewYear = adMonth < 4 || (adMonth === 4 && adDay < 14);
  const bsYear = isBeforeBsNewYear ? adYear + 56 : adYear + 57;
  // Map AD month to BS month (approximate; BS new year = Baisakh = month 1, mid-April)
  // AD Apr (4) -> BS month 1 from ~14th, AD May (5) -> 2 ... using simple shift:
  const shift = isBeforeBsNewYear ? 9 : -3;
  let bsMonth = ((adMonth + shift - 1) % 12) + 1;
  if (bsMonth <= 0) bsMonth += 12;
  return { year: bsYear, month: bsMonth };
}
