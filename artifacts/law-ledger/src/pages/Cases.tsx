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
import { Button } from "@/components/ui/button";
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
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Case Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">{cases?.length ?? 0} case{cases?.length !== 1 ? "s" : ""} shown</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Case
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={stageFilter !== null ? String(stageFilter) : "all"}
            onValueChange={v => setStageFilter(v === "all" ? null : Number(v))}
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="1">Stage 1</SelectItem>
              <SelectItem value="2">Stage 2</SelectItem>
              <SelectItem value="3">Stage 3</SelectItem>
              <SelectItem value="4">Stage 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select
          value={clientFilter !== null ? String(clientFilter) : "all"}
          onValueChange={v => setClientFilter(v === "all" ? null : Number(v))}
        >
          <SelectTrigger className="w-44 h-8 text-sm">
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
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setStageFilter(null); setClientFilter(null); }}>
            <X className="w-3 h-3 mr-1" /> Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-card border border-card-border rounded animate-pulse h-48" />
      ) : (cases ?? []).length === 0 ? (
        <div className="bg-card border border-card-border rounded p-12 text-center text-sm text-muted-foreground">
          No cases found. Try adjusting filters or add a new case.
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                {["Date", "Case No", "Client", "TM #", "Stage", "Detail", "Due", "Received", "Balance", ""].map(h => (
                  <th key={h} className={cn(
                    "py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide",
                    ["Due", "Received", "Balance"].includes(h) ? "text-right px-4" : "text-left px-4"
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cases ?? []).map((c, i) => {
                const isEditing = editId === c.id;
                return (
                  <tr key={c.id} className={cn("hover:bg-muted/20 transition-colors", i !== (cases ?? []).length - 1 && "border-b border-card-border")}>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Input type="date" value={editState.date} onChange={e => setEditState(s => ({ ...s, date: e.target.value }))} className="h-7 text-xs w-32" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{formatDate(c.date)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Input value={editState.caseNo} onChange={e => setEditState(s => ({ ...s, caseNo: e.target.value }))} className="h-7 text-xs w-28 font-mono" />
                      ) : (
                        <span className="font-mono text-xs font-medium">{c.caseNo}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Select value={String(editState.clientId)} onValueChange={v => setEditState(s => ({ ...s, clientId: Number(v) }))}>
                          <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(clients ?? []).map(cl => <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs">{c.clientName ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Input value={editState.tmNumber} onChange={e => setEditState(s => ({ ...s, tmNumber: e.target.value }))} className="h-7 text-xs w-20" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{c.tmNumber ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Select value={String(editState.stage)} onValueChange={v => setEditState(s => ({ ...s, stage: Number(v) }))}>
                          <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4].map(s => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", STAGE_COLORS[c.stage])}>
                          {STAGE_LABELS[c.stage]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 max-w-[160px]">
                      {isEditing ? (
                        <Input value={editState.detail} onChange={e => setEditState(s => ({ ...s, detail: e.target.value }))} className="h-7 text-xs w-36" />
                      ) : (
                        <span className="text-xs text-muted-foreground truncate block" title={c.detail ?? ""}>{c.detail ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <Input type="number" value={editState.due} onChange={e => setEditState(s => ({ ...s, due: Number(e.target.value) }))} className="h-7 text-xs w-24 text-right font-mono" />
                      ) : (
                        <span className="font-mono text-xs">{formatCurrency(c.due)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <Input type="number" value={editState.received} onChange={e => setEditState(s => ({ ...s, received: Number(e.target.value) }))} className="h-7 text-xs w-24 text-right font-mono" />
                      ) : (
                        <span className="font-mono text-xs">{formatCurrency(c.received)}</span>
                      )}
                    </td>
                    <td className={cn("px-4 py-2 text-right font-mono text-xs font-semibold", c.balance > 0 ? "text-red-600" : "text-green-600")}>
                      {formatCurrency(c.balance)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditId(null)} className="p-1 text-muted-foreground hover:text-foreground rounded"><X className="w-3.5 h-3.5" /></button>
                          <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-700 rounded"><Check className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100">
                          <button onClick={() => startEdit(c as CaseRow)} className="p-1 text-muted-foreground hover:text-foreground rounded"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => setDeleteId(c.id)} className="p-1 text-muted-foreground hover:text-destructive rounded"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-card-border bg-muted/30">
              <tr>
                <td colSpan={6} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Totals</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">{formatCurrency(totalDue)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">{formatCurrency(totalReceived)}</td>
                <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-bold", totalBalance > 0 ? "text-red-600" : "text-green-600")}>
                  {formatCurrency(totalBalance)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Case</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="clientId">Client *</Label>
              <Select name="clientId" required>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map(cl => <SelectItem key={cl.id} value={String(cl.id)}>{cl.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="caseNo">Case No *</Label>
                <Input id="caseNo" name="caseNo" required placeholder="2024-001" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="stage">Stage *</Label>
                <Select name="stage" defaultValue="1">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(s => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tmNumber">TM #</Label>
                <Input id="tmNumber" name="tmNumber" placeholder="TM-12345" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail">Detail</Label>
              <Textarea id="detail" name="detail" placeholder="Case description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="due">Due ($) *</Label>
                <Input id="due" name="due" type="number" step="0.01" min="0" required defaultValue="0" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="received">Received ($) *</Label>
                <Input id="received" name="received" type="number" step="0.01" min="0" required defaultValue="0" className="font-mono" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={createCase.isPending}>{createCase.isPending ? "Adding..." : "Add Case"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Case</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">This will permanently delete this case entry. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteCase.isPending} onClick={() => deleteId && deleteCase.mutate({ id: deleteId })}>
              {deleteCase.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
