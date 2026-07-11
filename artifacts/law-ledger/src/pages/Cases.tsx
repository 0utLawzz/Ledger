import { useState } from "react";
import {
  useListCases, useCreateCase, useUpdateCase, useDeleteCase, useListClients,
  getListCasesQueryKey, getGetReportSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { Plus, Trash2, Pencil, Check, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type CaseRow = {
  id: number;
  clientId: number;
  clientName: string | null;
  caseNo: string;
  date: string;
  stage: number;
  tmNumber: string | null;
  detail: string | null;
  due: number;
  received: number;
  balance: number;
  createdAt: string;
};

type EditState = Partial<{
  clientId: number;
  caseNo: string;
  date: string;
  stage: number;
  tmNumber: string;
  detail: string;
  due: number;
  received: number;
}>;

export default function Cases() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [stageFilter, setStageFilter] = useState<number | null>(null);
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const params = {
    ...(stageFilter !== null ? { stage: stageFilter } : {}),
    ...(clientFilter !== null ? { clientId: clientFilter } : {}),
  };

  const { data: cases, isLoading } = useListCases(params, {
    query: { queryKey: getListCasesQueryKey(params) },
  });
  const { data: clients } = useListClients();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetReportSummaryQueryKey() });
  };

  const createCase = useCreateCase({
    mutation: {
      onSuccess: () => { invalidate(); setShowAdd(false); toast({ title: "Case added" }); },
      onError: () => toast({ title: "Error", description: "Failed to add case.", variant: "destructive" }),
    },
  });

  const updateCase = useUpdateCase({
    mutation: {
      onSuccess: () => { invalidate(); setEditId(null); toast({ title: "Case updated" }); },
      onError: () => toast({ title: "Error", description: "Failed to update case.", variant: "destructive" }),
    },
  });

  const deleteCase = useDeleteCase({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Case deleted" }); },
      onError: () => toast({ title: "Error", description: "Failed to delete case.", variant: "destructive" }),
    },
  });

  function startEdit(c: CaseRow) {
    setEditId(c.id);
    setEditState({
      clientId: c.clientId,
      caseNo: c.caseNo,
      date: c.date,
      stage: c.stage,
      tmNumber: c.tmNumber ?? "",
      detail: c.detail ?? "",
      due: c.due,
      received: c.received,
    });
  }

  function saveEdit() {
    if (editId === null) return;
    updateCase.mutate({
      id: editId,
      data: {
        ...editState,
        due: Number(editState.due),
        received: Number(editState.received),
        tmNumber: editState.tmNumber || undefined,
        detail: editState.detail || undefined,
      },
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCase.mutate({
      data: {
        clientId: Number(fd.get("clientId")),
        caseNo: fd.get("caseNo") as string,
        date: fd.get("date") as string,
        stage: Number(fd.get("stage")),
        tmNumber: fd.get("tmNumber") as string || undefined,
        detail: fd.get("detail") as string || undefined,
        due: Number(fd.get("due")),
        received: Number(fd.get("received")),
      },
    });
  }

  const totalDue = (cases ?? []).reduce((s, c) => s + c.due, 0);
  const totalReceived = (cases ?? []).reduce((s, c) => s + c.received, 0);
  const totalBalance = totalDue - totalReceived;

  return (
    <div className="p-5 md:p-8 max-w-full">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Records</p>
          <h1 className="text-4xl font-display tracking-widest text-[#0C0C0C]">CASE LEDGER</h1>
          <p className="text-xs font-mono text-[#888] mt-1">{cases?.length ?? 0} case{cases?.length !== 1 ? "s" : ""} shown</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="nb-btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> ADD CASE
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#888]" />
          <Select
            value={stageFilter !== null ? String(stageFilter) : "all"}
            onValueChange={v => setStageFilter(v === "all" ? null : Number(v))}
          >
            <SelectTrigger className="w-36 h-8 text-xs rounded-none border-2 border-[#0C0C0C]">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {[1,2,3,4].map(s => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Select
          value={clientFilter !== null ? String(clientFilter) : "all"}
          onValueChange={v => setClientFilter(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-44 h-8 text-xs rounded-none border-2 border-[#0C0C0C]">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {(clients ?? []).map(cl => (
              <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(stageFilter !== null || clientFilter !== null) && (
          <button
            className="nb-btn-secondary h-8 px-3 text-xs flex items-center gap-1"
            onClick={() => { setStageFilter(null); setClientFilter(null); }}
          >
            <X className="w-3 h-3" /> CLEAR
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="nb-card h-48 animate-pulse" />
      ) : (cases ?? []).length === 0 ? (
        <div className="nb-card p-14 text-center">
          <p className="text-sm text-[#888] font-mono">No cases found. Try adjusting filters or add a new case.</p>
        </div>
      ) : (
        <div className="nb-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm nb-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Case No</th>
                  <th className="text-left">Client</th>
                  <th className="text-left">TM #</th>
                  <th className="text-left">Stage</th>
                  <th className="text-left">Detail</th>
                  <th className="text-right">Due</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(cases ?? []).map((c) => {
                  const isEditing = editId === c.id;
                  return (
                    <tr key={c.id} className="group">
                      <td>
                        {isEditing ? (
                          <Input type="date" value={editState.date} onChange={e => setEditState(s => ({ ...s, date: e.target.value }))} className="h-7 text-xs w-32 rounded-none" />
                        ) : (
                          <span className="text-xs text-[#555]">{formatDate(c.date)}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Input value={editState.caseNo} onChange={e => setEditState(s => ({ ...s, caseNo: e.target.value }))} className="h-7 text-xs w-28 font-mono rounded-none" />
                        ) : (
                          <span className="font-mono text-xs font-medium">{c.caseNo}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Select value={String(editState.clientId)} onValueChange={v => setEditState(s => ({ ...s, clientId: Number(v) }))}>
                            <SelectTrigger className="h-7 text-xs w-36 rounded-none"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(clients ?? []).map(cl => <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs">{c.clientName ?? "—"}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Input value={editState.tmNumber} onChange={e => setEditState(s => ({ ...s, tmNumber: e.target.value }))} className="h-7 text-xs w-20 rounded-none" />
                        ) : (
                          <span className="text-xs text-[#555]">{c.tmNumber ?? "—"}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <Select value={String(editState.stage)} onValueChange={v => setEditState(s => ({ ...s, stage: Number(v) }))}>
                            <SelectTrigger className="h-7 text-xs w-24 rounded-none"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4].map(s => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={cn("nb-badge", STAGE_COLORS[c.stage])}>
                            {STAGE_LABELS[c.stage]}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[140px]">
                        {isEditing ? (
                          <Input value={editState.detail} onChange={e => setEditState(s => ({ ...s, detail: e.target.value }))} className="h-7 text-xs w-36 rounded-none" />
                        ) : (
                          <span className="text-xs text-[#555] truncate block" title={c.detail ?? ""}>{c.detail ?? "—"}</span>
                        )}
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <Input type="number" value={editState.due} onChange={e => setEditState(s => ({ ...s, due: Number(e.target.value) }))} className="h-7 text-xs w-24 text-right font-mono rounded-none" />
                        ) : (
                          <span className="font-mono text-xs">{formatCurrency(c.due)}</span>
                        )}
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <Input type="number" value={editState.received} onChange={e => setEditState(s => ({ ...s, received: Number(e.target.value) }))} className="h-7 text-xs w-24 text-right font-mono rounded-none" />
                        ) : (
                          <span className="font-mono text-xs">{formatCurrency(c.received)}</span>
                        )}
                      </td>
                      <td className={cn("text-right font-mono text-xs font-bold", c.balance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setEditId(null)} className="p-1 text-[#888] hover:text-[#0C0C0C]"><X className="w-3.5 h-3.5" /></button>
                            <button onClick={saveEdit} className="p-1 text-[#0D9970] hover:text-[#0a6b52]"><Check className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(c as CaseRow)} className="p-1 text-[#888] hover:text-[#0C0C0C]"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => setDeleteId(c.id)} className="p-1 text-[#888] hover:text-[#C93838]"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#555]">TOTALS</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold">{formatCurrency(totalDue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold">{formatCurrency(totalReceived)}</td>
                  <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-bold", totalBalance > 0 ? "text-[#C93838]" : "text-[#0D9970]")}>
                    {formatCurrency(totalBalance)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg border-3 border-[#0C0C0C] rounded-none shadow-[8px_8px_0_#0C0C0C]">
          <DialogHeader><DialogTitle className="font-display tracking-widest text-xl">ADD CASE</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">Client *</Label>
              <Select name="clientId" required>
                <SelectTrigger className="rounded-none border-2 border-[#0C0C0C]"><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map(cl => <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Case No *</Label>
                <Input name="caseNo" required placeholder="2024-001" className="font-mono rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Date *</Label>
                <Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Stage *</Label>
                <Select name="stage" defaultValue="1">
                  <SelectTrigger className="rounded-none border-2 border-[#0C0C0C]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(s => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">TM #</Label>
                <Input name="tmNumber" placeholder="TM-12345" className="rounded-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">Detail</Label>
              <Textarea name="detail" placeholder="Case description..." rows={2} className="rounded-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Due (PKR) *</Label>
                <Input name="due" type="number" step="1" min="0" required defaultValue="0" className="font-mono rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Received (PKR) *</Label>
                <Input name="received" type="number" step="1" min="0" required defaultValue="0" className="font-mono rounded-none" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button type="button" className="nb-btn-secondary px-4 py-2 text-sm" onClick={() => setShowAdd(false)}>CANCEL</button>
              <button type="submit" className="nb-btn-primary px-4 py-2 text-sm" disabled={createCase.isPending}>
                {createCase.isPending ? "ADDING..." : "ADD CASE"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm border-3 border-[#0C0C0C] rounded-none shadow-[8px_8px_0_#0C0C0C]">
          <DialogHeader><DialogTitle className="font-display tracking-widest text-xl text-[#C93838]">DELETE CASE</DialogTitle></DialogHeader>
          <p className="text-sm text-[#555] py-2 font-mono">This will permanently delete this case entry. Cannot be undone.</p>
          <DialogFooter className="gap-2">
            <button className="nb-btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteId(null)}>CANCEL</button>
            <button
              className="nb-btn-primary px-4 py-2 text-sm"
              style={{ background: "#C93838", borderColor: "#C93838" }}
              disabled={deleteCase.isPending}
              onClick={() => deleteId && deleteCase.mutate({ id: deleteId })}
            >
              {deleteCase.isPending ? "DELETING..." : "DELETE"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
