import { Link } from "wouter";
import { useGetReportSummary, useListCases } from "@workspace/api-client-react";
import { formatCurrency, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { Users, FolderOpen, DollarSign, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetReportSummary();
  const { data: cases, isLoading: casesLoading } = useListCases();

  const recentCases = cases?.slice(-10).reverse() ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Firm-wide overview</p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Clients"
            value={String(summary?.totalClients ?? 0)}
            icon={<Users className="w-4 h-4" />}
            color="text-blue-600"
          />
          <StatCard
            label="Total Cases"
            value={String(summary?.totalCases ?? 0)}
            icon={<FolderOpen className="w-4 h-4" />}
            color="text-purple-600"
          />
          <StatCard
            label="Total Billed"
            value={formatCurrency(summary?.totalDue ?? 0)}
            icon={<DollarSign className="w-4 h-4" />}
            color="text-green-600"
          />
          <StatCard
            label="Outstanding Balance"
            value={formatCurrency(summary?.totalBalance ?? 0)}
            icon={<AlertCircle className="w-4 h-4" />}
            color={(summary?.totalBalance ?? 0) > 0 ? "text-red-600" : "text-green-600"}
          />
        </div>
      )}

      {summary?.casesByStage && summary.casesByStage.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cases by Stage</h2>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((stage) => {
              const stageData = summary.casesByStage.find(s => s.stage === stage);
              return (
                <div key={stage} className="bg-card border border-card-border rounded p-3 text-center">
                  <span className={cn("inline-block text-xs font-medium px-2 py-0.5 rounded border mb-2", STAGE_COLORS[stage])}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <p className="text-2xl font-bold text-foreground">{stageData?.count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">cases</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Cases</h2>
          <Link href="/cases" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {casesLoading ? (
          <div className="bg-card border border-card-border rounded animate-pulse h-48" />
        ) : recentCases.length === 0 ? (
          <div className="bg-card border border-card-border rounded p-8 text-center text-muted-foreground text-sm">
            No cases yet. <Link href="/cases" className="text-primary hover:underline">Add your first case.</Link>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Case No</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Stage</th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Due</th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Balance</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c, i) => (
                  <tr key={c.id} className={cn("hover:bg-muted/20 transition-colors", i !== recentCases.length - 1 && "border-b border-card-border")}>
                    <td className="px-4 py-2.5 font-mono text-xs font-medium">{c.caseNo}</td>
                    <td className="px-4 py-2.5 text-foreground">{c.clientName ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", STAGE_COLORS[c.stage])}>
                        {STAGE_LABELS[c.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{formatCurrency(c.due)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-semibold", c.balance > 0 ? "text-red-600" : "text-green-600")}>
                      {formatCurrency(c.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded p-4">
      <div className={cn("flex items-center gap-1.5 mb-2", color)}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground font-mono">{value}</p>
    </div>
  );
}
