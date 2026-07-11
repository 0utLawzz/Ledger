import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetClient, useUpdateClient, useListCases,
  useGetClientRates, useUpdateClientRates,
  getGetClientQueryKey, getListCasesQueryKey, getGetClientRatesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { ArrowLeft, Printer, Edit2, Check, X, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: client, isLoading } = useGetClient(id, {
    query: { enabled: !!id, queryKey: getGetClientQueryKey(id) },
  });
  const { data: cases, isLoading: casesLoading } = useListCases({ clientId: id }, {
    query: { enabled: !!id, queryKey: getListCasesQueryKey({ clientId: id }) },
  });
  const { data: rates } = useGetClientRates(id, {
    query: { enabled: !!id, queryKey: getGetClientRatesQueryKey(id) },
  });

  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [showRates, setShowRates] = useState(false);
  const [rateInputs, setRateInputs] = useState<{ stage: number; rate: number; label: string }[]>([]);

  const updateClient = useUpdateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientQueryKey(id) });
        setEditing(false);
        toast({ title: "Client updated" });
      },
      onError: () => toast({ title: "Error", description: "Failed to update client.", variant: "destructive" }),
    },
  });

  const updateRates = useUpdateClientRates({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientRatesQueryKey(id) });
        setShowRates(false);
        toast({ title: "Stage rates saved" });
      },
      onError: () => toast({ title: "Error", description: "Failed to save rates.", variant: "destructive" }),
    },
  });

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-[#888]">
      <span className="font-mono text-sm">Loading...</span>
    </div>
  );
  if (!client) return (
    <div className="p-8">
      <p className="font-mono text-sm text-[#888]">Client not found.</p>
    </div>
  );

  const totalDue = (cases ?? []).reduce((s, c) => s + c.due, 0);
  const totalReceived = (cases ?? []).reduce((s, c) => s + c.received, 0);
  const totalBalance = totalDue - totalReceived;

  function startEdit() {
    setEditValues({
      name: client!.name,
      email: client!.email ?? "",
      phone: client!.phone ?? "",
      address: client!.address ?? "",
      notes: client!.notes ?? "",
    });
    setEditing(true);
  }

  function saveEdit() {
    updateClient.mutate({
      id,
      data: {
        name: editValues.name,
        email: editValues.email || undefined,
        phone: editValues.phone || undefined,
        address: editValues.address || undefined,
        notes: editValues.notes || undefined,
      },
    });
  }

  function openRates() {
    const defaults = [1, 2, 3, 4].map(stage => {
      const existing = rates?.find(r => r.stage === stage);
      return { stage, rate: existing ? existing.rate : 0, label: existing?.label ?? `Stage ${stage}` };
    });
    setRateInputs(defaults);
    setShowRates(true);
  }

  function saveRates() {
    updateRates.mutate({
      id,
      data: rateInputs.map(r => ({ stage: r.stage, rate: r.rate, label: r.label || undefined })),
    });
  }

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Ledger Header — client branding */}
      <div className="mb-8 border-3 border-[#0C0C0C] overflow-hidden shadow-[6px_6px_0_#0C0C0C]">
        <div className="bg-[#0C0C0C] px-6 py-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[#C94A00] font-mono text-xs uppercase tracking-widest mb-1">Client Ledger</p>
            <h1 className="text-4xl font-display tracking-widest text-white leading-none">{client.name.toUpperCase()}</h1>
            <p className="text-[#555] font-mono text-xs mt-2">Since {formatDate(client.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[#555] font-mono text-xs uppercase tracking-widest mb-1">Balance Due</p>
            <p className={cn("font-display text-3xl tracking-wider", totalBalance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
        <div className="bg-[#F0E8D0] px-6 py-3 flex flex-wrap items-center gap-6">
          <span className="font-mono text-xs text-[#555]">
            {client.email ?? "—"} {client.phone ? `· ${client.phone}` : ""}
          </span>
          <div className="ml-auto flex items-center gap-2 print:hidden">
            <Link href="/clients">
              <button className="nb-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
                <ArrowLeft className="w-3 h-3" /> BACK
              </button>
            </Link>
            {editing ? (
              <>
                <button className="nb-btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>
                  <X className="w-3 h-3" />
                </button>
                <button className="nb-btn-primary px-3 py-1.5 text-xs flex items-center gap-1" onClick={saveEdit} disabled={updateClient.isPending}>
                  <Check className="w-3 h-3" /> SAVE
                </button>
              </>
            ) : (
              <button className="nb-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={startEdit}>
                <Edit2 className="w-3 h-3" /> EDIT
              </button>
            )}
            <button className="nb-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={openRates}>
              <Settings2 className="w-3 h-3" /> RATES
            </button>
            <button className="nb-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5" onClick={() => window.print()}>
              <Printer className="w-3 h-3" /> PRINT
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="nb-card p-4 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-2">Billed</p>
          <p className="text-xl font-mono font-bold text-[#0C0C0C]">{formatCurrency(totalDue)}</p>
        </div>
        <div className="nb-card p-4 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-2">Received</p>
          <p className="text-xl font-mono font-bold text-[#0D9970]">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="nb-card p-4 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-2">Balance</p>
          <p className={cn("text-xl font-mono font-bold", totalBalance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      {/* Contact info (editable) */}
      <div className="nb-card p-5 mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-4">Contact Info</p>
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#888]">Full Name</label>
              <Input value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} className="mt-1 rounded-none" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#888]">Email</label>
              <Input value={editValues.email} onChange={e => setEditValues(v => ({ ...v, email: e.target.value }))} className="mt-1 rounded-none" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#888]">Phone</label>
              <Input value={editValues.phone} onChange={e => setEditValues(v => ({ ...v, phone: e.target.value }))} className="mt-1 rounded-none" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#888]">Address</label>
              <Input value={editValues.address} onChange={e => setEditValues(v => ({ ...v, address: e.target.value }))} className="mt-1 rounded-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#888]">Notes</label>
              <Textarea value={editValues.notes} onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))} className="mt-1 rounded-none" rows={3} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Email" value={client.email} />
            <InfoRow label="Phone" value={client.phone} />
            <InfoRow label="Address" value={client.address} />
            {client.notes && <InfoRow label="Notes" value={client.notes} />}
          </div>
        )}
      </div>

      {/* Stage rates (read-only display) */}
      {rates && rates.length > 0 && (
        <div className="nb-card p-5 mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-4">Stage Rates</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rates.map(r => (
              <div key={r.stage} className="border-2 border-[#0C0C0C] p-3 bg-[#F0E8D0]">
                <span className={cn("nb-badge", STAGE_COLORS[r.stage])}>{STAGE_LABELS[r.stage]}</span>
                <p className="font-mono font-bold text-sm mt-2">{formatCurrency(r.rate)}</p>
                {r.label && r.label !== `Stage ${r.stage}` && (
                  <p className="text-xs text-[#888] mt-0.5">{r.label}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases table */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-3">
          Cases ({cases?.length ?? 0})
        </p>
        {casesLoading ? (
          <div className="nb-card h-32 animate-pulse" />
        ) : (cases ?? []).length === 0 ? (
          <div className="nb-card p-10 text-center">
            <p className="text-sm text-[#888] font-mono">No cases for this client yet.</p>
          </div>
        ) : (
          <div className="nb-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm nb-table min-w-[700px]">
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
                  {(cases ?? []).map((c) => (
                    <tr key={c.id}>
                      <td className="text-xs text-[#555]">{formatDate(c.date)}</td>
                      <td className="font-mono text-xs font-medium">{c.caseNo}</td>
                      <td className="text-xs text-[#555]">{c.tmNumber ?? "—"}</td>
                      <td>
                        <span className={cn("nb-badge", STAGE_COLORS[c.stage])}>
                          {STAGE_LABELS[c.stage]}
                        </span>
                      </td>
                      <td className="text-xs text-[#555] max-w-[180px] truncate" title={c.detail ?? ""}>{c.detail ?? "—"}</td>
                      <td className="text-right font-mono text-xs">{formatCurrency(c.due)}</td>
                      <td className="text-right font-mono text-xs">{formatCurrency(c.received)}</td>
                      <td className={cn("text-right font-mono text-xs font-bold", c.balance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                        {formatCurrency(c.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#555]">TOTALS</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold">{formatCurrency(totalDue)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold">{formatCurrency(totalReceived)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-bold", totalBalance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                      {formatCurrency(totalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stage Rates Modal */}
      <Dialog open={showRates} onOpenChange={setShowRates}>
        <DialogContent className="max-w-md border-3 border-[#0C0C0C] rounded-none shadow-[8px_8px_0_#0C0C0C]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-xl">STAGE RATES</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[#888] font-mono mb-4">Set fee rates (PKR) per stage for {client.name}.</p>
          <div className="space-y-4">
            {rateInputs.map((r, i) => (
              <div key={r.stage} className="flex items-center gap-3 border-2 border-[#0C0C0C] p-3 bg-[#F0E8D0]">
                <span className={cn("nb-badge flex-shrink-0 w-16 text-center", STAGE_COLORS[r.stage])}>
                  {STAGE_LABELS[r.stage]}
                </span>
                <div className="flex-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#888]">Label</label>
                  <Input
                    value={r.label}
                    onChange={e => setRateInputs(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    className="h-7 text-xs rounded-none mt-0.5"
                    placeholder={`Stage ${r.stage}`}
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#888]">Rate (PKR)</label>
                  <Input
                    type="number"
                    min="0"
                    value={r.rate}
                    onChange={e => setRateInputs(prev => prev.map((x, j) => j === i ? { ...x, rate: Number(e.target.value) } : x))}
                    className="h-7 text-xs font-mono rounded-none mt-0.5"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4 gap-2">
            <button className="nb-btn-secondary px-4 py-2 text-sm" onClick={() => setShowRates(false)}>CANCEL</button>
            <button className="nb-btn-primary px-4 py-2 text-sm" onClick={saveRates} disabled={updateRates.isPending}>
              {updateRates.isPending ? "SAVING..." : "SAVE RATES"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="text-[#888] font-mono text-xs uppercase tracking-wider w-16 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[#0C0C0C] text-sm">{value ?? "—"}</span>
    </div>
  );
}
