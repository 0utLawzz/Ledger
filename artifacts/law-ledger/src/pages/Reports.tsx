import { useState } from "react";
import { useGetReportSummary, useListClients, useGetClientReport, getGetClientReportQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { Printer, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function today() {
  return new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" });
}

function ClientReportView({ clientId }: { clientId: number }) {
  const { data, isLoading } = useGetClientReport(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientReportQueryKey(clientId) },
  });

  if (isLoading) return <div className="py-4 text-sm text-[#888] font-mono">Loading...</div>;
  if (!data) return null;

  return (
    <div className="print-section mb-8">
      {/* Print header */}
      <div className="hidden print:block mb-6 border-b-2 border-[#0C0C0C] pb-4">
        <h2 className="font-display text-3xl tracking-widest">{data.client.name.toUpperCase()}</h2>
        {data.client.email && <p className="text-sm text-[#555] font-mono mt-1">{data.client.email}</p>}
        {data.client.phone && <p className="text-sm text-[#555] font-mono">{data.client.phone}</p>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="nb-card p-3 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Billed</p>
          <p className="font-mono font-bold text-sm">{formatCurrency(data.totalDue)}</p>
        </div>
        <div className="nb-card p-3 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Received</p>
          <p className="font-mono font-bold text-sm text-[#0D9970]">{formatCurrency(data.totalReceived)}</p>
        </div>
        <div className="nb-card p-3 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Balance</p>
          <p className={cn("font-mono font-bold text-sm", data.totalBalance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
            {formatCurrency(data.totalBalance)}
          </p>
        </div>
      </div>

      {data.cases.length > 0 && (
        <div className="nb-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs nb-table min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Case No</th>
                  <th className="text-left">TM #</th>
                  <th className="text-left">Stage</th>
                  <th className="text-left">Detail</th>
                  <th className="text-right">Due</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.cases.map((c) => (
                  <tr key={c.id}>
                    <td className="text-[#555]">{formatDate(c.date)}</td>
                    <td className="font-mono font-medium">{c.caseNo}</td>
                    <td className="text-[#555]">{c.tmNumber ?? "—"}</td>
                    <td>
                      <span className={cn("nb-badge", STAGE_COLORS[c.stage])}>
                        {STAGE_LABELS[c.stage]}
                      </span>
                    </td>
                    <td className="text-[#555] max-w-[140px] truncate">{c.detail ?? "—"}</td>
                    <td className="text-right font-mono">{formatCurrency(c.due)}</td>
                    <td className="text-right font-mono">{formatCurrency(c.received)}</td>
                    <td className={cn("text-right font-mono font-bold", c.balance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                      {formatCurrency(c.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="px-3 py-2 font-mono font-bold text-[10px] uppercase tracking-wider text-[#555]">TOTALS</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">{formatCurrency(data.totalDue)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">{formatCurrency(data.totalReceived)}</td>
                  <td className={cn("px-3 py-2 text-right font-mono font-bold", data.totalBalance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                    {formatCurrency(data.totalBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { data: summary, isLoading: summaryLoading } = useGetReportSummary();
  const { data: clients } = useListClients();
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Analytics</p>
          <h1 className="text-4xl font-display tracking-widest text-[#0C0C0C]">REPORTS</h1>
          <p className="text-xs font-mono text-[#888] mt-1">Firm-wide and per-client ledger reports</p>
        </div>
        <button onClick={() => window.print()} className="nb-btn-secondary px-4 py-2 flex items-center gap-2 text-sm print:hidden">
          <Printer className="w-4 h-4" /> PRINT
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h2 className="font-display text-3xl tracking-widest">LEXLEDGER — FIRM REPORT</h2>
        <p className="text-sm text-[#555] font-mono mt-1">Generated: {today()}</p>
      </div>

      {/* Firm Summary */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C94A00]" />
            <p className="text-xs font-mono uppercase tracking-widest text-[#888]">Firm Summary</p>
          </div>
        </div>
        {summaryLoading ? (
          <div className="nb-card h-24 animate-pulse" />
        ) : (
          <div className="nb-card overflow-hidden mb-4">
            <table className="w-full text-sm nb-table">
              <tbody>
                <tr>
                  <td className="text-[#555] font-mono text-xs uppercase tracking-wider">Total Clients</td>
                  <td className="font-bold font-display text-xl tracking-wider text-right">{summary?.totalClients ?? 0}</td>
                </tr>
                <tr>
                  <td className="text-[#555] font-mono text-xs uppercase tracking-wider">Total Cases</td>
                  <td className="font-bold font-display text-xl tracking-wider text-right">{summary?.totalCases ?? 0}</td>
                </tr>
                <tr>
                  <td className="text-[#555] font-mono text-xs uppercase tracking-wider">Total Billed</td>
                  <td className="font-mono font-bold text-right">{formatCurrency(summary?.totalDue ?? 0)}</td>
                </tr>
                <tr>
                  <td className="text-[#555] font-mono text-xs uppercase tracking-wider">Total Received</td>
                  <td className="font-mono font-bold text-right text-[#0D9970]">{formatCurrency(summary?.totalReceived ?? 0)}</td>
                </tr>
                <tr>
                  <td className="text-[#555] font-mono text-xs uppercase tracking-wider font-bold">Outstanding Balance</td>
                  <td className={cn("font-mono font-bold text-right", (summary?.totalBalance ?? 0) > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                    {formatCurrency(summary?.totalBalance ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {summary?.casesByStage && summary.casesByStage.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(stage => {
              const s = summary.casesByStage.find(x => x.stage === stage);
              return (
                <div key={stage} className="nb-card p-3 text-center">
                  <span className={cn("nb-badge mb-2 inline-block", STAGE_COLORS[stage])}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <p className="text-2xl font-display tracking-wider">{s?.count ?? 0}</p>
                  <p className="text-[10px] font-mono text-[#888] uppercase">Cases</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client Report */}
      <div className="print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-[#C94A00]" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#888]">Client Report</p>
        </div>
        <div className="mb-5">
          <Select
            value={selectedClient !== null ? String(selectedClient) : ""}
            onValueChange={v => setSelectedClient(v ? Number(v) : null)}
          >
            <SelectTrigger className="w-72 rounded-none border-2 border-[#0C0C0C] h-10">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map(cl => (
                <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedClient !== null ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display tracking-widest text-xl text-[#0C0C0C]">
                {clients?.find(c => c.id === selectedClient)?.name?.toUpperCase()}
              </h3>
              <button className="nb-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={() => window.print()}>
                <Printer className="w-3 h-3" /> PRINT
              </button>
            </div>
            <ClientReportView clientId={selectedClient} />
          </>
        ) : (
          <div className="nb-card p-10 text-center">
            <p className="text-sm text-[#888] font-mono">Select a client above to view their detailed case report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
