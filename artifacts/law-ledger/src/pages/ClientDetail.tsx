import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetClient, useUpdateClient, useListCases,
  getGetClientQueryKey, getListCasesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import { ArrowLeft, Printer, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({ name: "", email: "", phone: "", address: "", notes: "" });

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

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!client) return <div className="p-6 text-muted-foreground">Client not found.</div>;

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Client since {formatDate(client.createdAt)}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          {editing ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
              <Button size="sm" onClick={saveEdit} disabled={updateClient.isPending}>
                <Check className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit}><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-card-border rounded p-4 md:col-span-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h2>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Full Name</label>
                <Input value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input value={editValues.email} onChange={e => setEditValues(v => ({ ...v, email: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <Input value={editValues.phone} onChange={e => setEditValues(v => ({ ...v, phone: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Address</label>
                <Input value={editValues.address} onChange={e => setEditValues(v => ({ ...v, address: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Textarea value={editValues.notes} onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))} className="mt-1" rows={3} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Phone" value={client.phone} />
              <InfoRow label="Address" value={client.address} />
              {client.notes && <InfoRow label="Notes" value={client.notes} />}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="bg-card border border-card-border rounded p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Billed</p>
            <p className="text-xl font-bold font-mono">{formatCurrency(totalDue)}</p>
          </div>
          <div className="bg-card border border-card-border rounded p-4">
            <p className="text-xs text-muted-foreground mb-1">Received</p>
            <p className="text-xl font-bold font-mono text-green-600">{formatCurrency(totalReceived)}</p>
          </div>
          <div className="bg-card border border-card-border rounded p-4">
            <p className="text-xs text-muted-foreground mb-1">Balance Due</p>
            <p className={cn("text-xl font-bold font-mono", totalBalance > 0 ? "text-red-600" : "text-green-600")}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cases ({cases?.length ?? 0})
        </h2>
        {casesLoading ? (
          <div className="bg-card border border-card-border rounded animate-pulse h-32" />
        ) : (cases ?? []).length === 0 ? (
          <div className="bg-card border border-card-border rounded p-8 text-center text-sm text-muted-foreground">
            No cases for this client yet.
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Case No</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">TM #</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Detail</th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Due</th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Received</th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(cases ?? []).map((c, i) => (
                  <tr key={c.id} className={cn("hover:bg-muted/20 transition-colors", i !== (cases ?? []).length - 1 && "border-b border-card-border")}>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(c.date)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-medium">{c.caseNo}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.tmNumber ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", STAGE_COLORS[c.stage])}>
                        {STAGE_LABELS[c.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs max-w-[200px] truncate" title={c.detail ?? ""}>{c.detail ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{formatCurrency(c.due)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">{formatCurrency(c.received)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-semibold", c.balance > 0 ? "text-red-600" : "text-green-600")}>
                      {formatCurrency(c.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-card-border bg-muted/30">
                <tr>
                  <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Totals</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">{formatCurrency(totalDue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">{formatCurrency(totalReceived)}</td>
                  <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-bold", totalBalance > 0 ? "text-red-600" : "text-green-600")}>
                    {formatCurrency(totalBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <span className="text-foreground">{value ?? "—"}</span>
    </div>
  );
}
