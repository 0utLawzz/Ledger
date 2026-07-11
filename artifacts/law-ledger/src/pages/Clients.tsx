import { useState } from "react";
import { Link } from "wouter";
import { useListClients, useCreateClient, useDeleteClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Plus, Search, Trash2, ChevronRight, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createClient = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setShowAdd(false);
        toast({ title: "Client added", description: "New client has been created." });
      },
      onError: () => toast({ title: "Error", description: "Failed to add client.", variant: "destructive" }),
    },
  });

  const deleteClient = useDeleteClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setDeleteId(null);
        toast({ title: "Client deleted" });
      },
      onError: () => toast({ title: "Error", description: "Failed to delete client.", variant: "destructive" }),
    },
  });

  const filtered = (clients ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createClient.mutate({
      data: {
        name: fd.get("name") as string,
        email: fd.get("email") as string || undefined,
        phone: fd.get("phone") as string || undefined,
        address: fd.get("address") as string || undefined,
        notes: fd.get("notes") as string || undefined,
      },
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients?.length ?? 0} client{clients?.length !== 1 ? "s" : ""} on record</p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Client
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-card border border-card-border rounded p-4 animate-pulse h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-card-border rounded p-12 text-center">
          <UserCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{search ? "No clients match your search." : "No clients yet."}</p>
          {!search && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add your first client
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Phone</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr key={client.id} className={cn("hover:bg-muted/20 transition-colors group", i !== filtered.length - 1 && "border-b border-card-border")}>
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium text-foreground hover:text-primary flex items-center gap-1.5">
                      {client.name}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(client.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" required placeholder="John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="123 Main St, City, State" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={createClient.isPending}>
                {createClient.isPending ? "Adding..." : "Add Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete the client and all their cases. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteClient.isPending}
              onClick={() => deleteId && deleteClient.mutate({ id: deleteId })}
            >
              {deleteClient.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
