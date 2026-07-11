import { Link } from "wouter";
import { useGetReportSummary, useListCases } from "@workspace/api-client-react";
import { formatCurrency, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { Users, FolderOpen, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetReportSummary();
  const { data: cases, isLoading: casesLoading } = useListCases();

  const recentCases = cases?.slice(-10).reverse() ?? [];

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Overview</p>
        <h1 className="text-4xl font-display tracking-widest text-[#0C0C0C]">DASHBOARD</h1>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="nb-card p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Clients"
            value={String(summary?.totalClients ?? 0)}
            icon={<Users className="w-4 h-4" />}
            accent="#0D9970"
          />
          <StatCard
            label="Cases"
            value={String(summary?.totalCases ?? 0)}
            icon={<FolderOpen className="w-4 h-4" />}
            accent="#C94A00"
          />
          <StatCard
            label="Total Billed"
            value={formatCurrency(summary?.totalDue ?? 0)}
            icon={<TrendingUp className="w-4 h-4" />}
            accent="#0C0C0C"
            mono
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(summary?.totalBalance ?? 0)}
            icon={<AlertCircle className="w-4 h-4" />}
            accent={(summary?.totalBalance ?? 0) > 0 ? "#C93838" : "#0D9970"}
            mono
          />
        </div>
      )}

      {summary?.casesByStage && summary.casesByStage.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-3">Cases by Stage</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((stage) => {
              const stageData = summary.casesByStage.find(s => s.stage === stage);
              return (
                <div key={stage} className="nb-card p-4 text-center">
                  <span className={cn("nb-badge mb-3 inline-block", STAGE_COLORS[stage])}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <p className="text-3xl font-display tracking-wider text-[#0C0C0C]">{stageData?.count ?? 0}</p>
                  <p className="text-xs font-mono text-[#888] mt-1">CASES</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888]">Recent Cases</p>
          <Link href="/cases" className="flex items-center gap-1 text-[#C94A00] font-mono text-xs uppercase tracking-wider hover:underline">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {casesLoading ? (
          <div className="nb-card h-48 animate-pulse" />
        ) : recentCases.length === 0 ? (
          <div className="nb-card p-10 text-center">
            <p className="text-sm text-[#888] font-mono">No cases yet.{" "}
              <Link href="/cases" className="text-[#C94A00] hover:underline">Add your first case.</Link>
            </p>
          </div>
        ) : (
          <div className="nb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm nb-table min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left">Case No</th>
                    <th className="text-left">Client</th>
                    <th className="text-left">Stage</th>
                    <th className="text-right">Due</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-xs font-medium">{c.caseNo}</td>
                      <td>{c.clientName ?? "—"}</td>
                      <td>
                        <span className={cn("nb-badge", STAGE_COLORS[c.stage])}>
                          {STAGE_LABELS[c.stage]}
                        </span>
                      </td>
                      <td className="text-right font-mono text-xs">{formatCurrency(c.due)}</td>
                      <td className={cn("text-right font-mono text-xs font-bold", c.balance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                        {formatCurrency(c.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, mono }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  mono?: boolean;
}) {
  return (
    <div className="nb-card p-5">
      <div className="flex items-center gap-2 mb-3" style={{ color: accent }}>
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-xl font-bold text-[#0C0C0C]", mono ? "font-mono text-base" : "font-display tracking-wider text-2xl")}>
        {value}
      </p>
    </div>
  );
}
