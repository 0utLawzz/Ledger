import { useState } from "react";
import { useGetReportSummary, useListClients, useGetClientReport, getGetClientReportQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { Printer, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function today() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ClientReportView({ clientId }: { clientId: number }) {
  const { data, isLoading } = useGetClientReport(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientReportQueryKey(clientId) },
  });

  if (isLoading) return <div className="py-4 text-sm text-muted-foreground">Loading client report...</div>;
  if (!data) return null;

  return (
    <div className="print-section mb-8">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h3 className="font-semibold text-foreground">{data.client.name}</h3>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Print
        </Button>
      </div>
      <div className="hidden print:block mb-2">
        <h3 className="font-bold text-lg">{data.client.name}</h3>
        {data.client.email && <p className="text-sm">{data.client.email}</p>}
        {data.client.phone && <p className="text-sm">{data.client.phone}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-card-border rounded p-3">
          <p className="text-xs text-muted-foreground">Total Billed</p>
          <p className="font-mono font-semibold text-sm">{formatCurrency(data.totalDue)}</p>
        </div>
        <div className="bg-card border border-card-border rounded p-3">
          <p className="text-xs text-muted-foreground">Received</p>
          <p className="font-mono font-semibold text-sm text-green-600">{formatCurrency(data.totalReceived)}</p>
        </div>
        <div className="bg-card border border-card-border rounded p-3">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={cn("font-mono font-semibold text-sm", data.totalBalance > 0 ? "text-red-600" : "text-green-600")}>
            {formatCurrency(data.totalBalance)}
          </p>
        </div>
      </div>
      {data.cases.length > 0 && (
        <div className="bg-card border border-card-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Date</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Case No</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">TM #</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Stage</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Detail</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Due</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Received</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium uppercase tracking-wide">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.cases.map((c, i) => (
                <tr key={c.id} className={cn("hover:bg-muted/20", i !== data.cases.length - 1 && "border-b border-card-border")}>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(c.date)}</td>
                  <td className="px-3 py-2 font-mono font-medium">{c.caseNo}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.tmNumber ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded border", STAGE_COLORS[c.stage])}>
                      {STAGE_LABELS[c.stage]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[160px] truncate">{c.detail ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(c.due)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCurrency(c.received)}</td>
                  <td className={cn("px-3 py-2 text-right font-mono font-semibold", c.balance > 0 ? "text-red-600" : "text-green-600")}>
                    {formatCurrency(c.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-card-border bg-muted/30">
              <tr>
                <td colSpan={5} className="px-3 py-2 font-semibold text-muted-foreground">Totals</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(data.totalDue)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(data.totalReceived)}</td>
                <td className={cn("px-3 py-2 text-right font-mono font-bold", data.totalBalance > 0 ? "text-red-600" : "text-green-600")}>
                  {formatCurrency(data.totalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and print client and firm reports</p>
        </div>
        <Button onClick={() => window.print()} size="sm" variant="outline" className="print:hidden gap-1.5">
          <Printer className="w-4 h-4" /> Print Page
        </Button>
      </div>

      <div className="hidden print:block mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold">Law Firm Ledger Report</h2>
        <p className="text-sm text-gray-500 mt-1">Generated: {today()}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Firm Summary
          </h2>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="w-3.5 h-3.5 mr-1" /> Print
          </Button>
        </div>
        {summaryLoading ? (
          <div className="bg-card border border-card-border rounded animate-pulse h-24" />
        ) : (
          <div className="bg-card border border-card-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-card-border">
                  <td className="px-4 py-3 text-muted-foreground">Total Clients</td>
                  <td className="px-4 py-3 font-semibold text-right">{summary?.totalClients ?? 0}</td>
                </tr>
                <tr className="border-b border-card-border">
                  <td className="px-4 py-3 text-muted-foreground">Total Cases</td>
                  <td className="px-4 py-3 font-semibold text-right">{summary?.totalCases ?? 0}</td>
                </tr>
                <tr className="border-b border-card-border">
                  <td className="px-4 py-3 text-muted-foreground">Total Billed</td>
                  <td className="px-4 py-3 font-mono font-semibold text-right">{formatCurrency(summary?.totalDue ?? 0)}</td>
                </tr>
                <tr className="border-b border-card-border">
                  <td className="px-4 py-3 text-muted-foreground">Total Received</td>
                  <td className="px-4 py-3 font-mono font-semibold text-right text-green-600">{formatCurrency(summary?.totalReceived ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-muted-foreground font-semibold">Outstanding Balance</td>
                  <td className={cn("px-4 py-3 font-mono font-bold text-right", (summary?.totalBalance ?? 0) > 0 ? "text-red-600" : "text-green-600")}>
                    {formatCurrency(summary?.totalBalance ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {summary?.casesByStage && summary.casesByStage.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cases by Stage</h3>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(stage => {
                const s = summary.casesByStage.find(x => x.stage === stage);
                return (
                  <div key={stage} className="bg-card border border-card-border rounded p-2.5 text-center">
                    <span className={cn("inline-block text-xs font-medium px-2 py-0.5 rounded border mb-1", STAGE_COLORS[stage])}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <p className="text-lg font-bold">{s?.count ?? 0}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="print:hidden">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Client Report
        </h2>
        <div className="mb-4">
          <Select
            value={selectedClient !== null ? String(selectedClient) : ""}
            onValueChange={v => setSelectedClient(v ? Number(v) : null)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map(cl => (
                <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedClient !== null && <ClientReportView clientId={selectedClient} />}
        {selectedClient === null && (
          <div className="bg-card border border-card-border rounded p-8 text-center text-sm text-muted-foreground">
            Select a client above to view their detailed case report.
          </div>
        )}
      </div>
    </div>
  );
}
