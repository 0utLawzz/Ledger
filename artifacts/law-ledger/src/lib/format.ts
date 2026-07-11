export function formatCurrency(amount: number): string {
  return "PKR " + new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export const STAGE_LABELS: Record<number, string> = {
  1: "Stage 1",
  2: "Stage 2",
  3: "Stage 3",
  4: "Stage 4",
};

export const STAGE_COLORS: Record<number, string> = {
  1: "bg-[#DBEAFE] border-[#2563EB] text-[#1e40af]",
  2: "bg-[#FEF9C3] border-[#CA8A04] text-[#854d0e]",
  3: "bg-[#FFEDD5] border-[#C94A00] text-[#9a3412]",
  4: "bg-[#DCFCE7] border-[#16a34a] text-[#14532d]",
};
