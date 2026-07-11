import { useState } from "react";
import { Link } from "wouter";
import { useListClients, useCreateClient, useDeleteClient, getListClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
        toast({ title: "Client added" });
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
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">Directory</p>
          <h1 className="text-4xl font-display tracking-widest text-[#0C0C0C]">CLIENTS</h1>
          <p className="text-xs font-mono text-[#888] mt-1">{clients?.length ?? 0} on record</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="nb-btn-primary px-4 py-2 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> ADD CLIENT
        </button>
      </div>

      <div className="mb-5 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
        <Input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 border-2 border-[#0C0C0C] rounded-none h-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="nb-card p-5 h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="nb-card p-14 text-center">
          <UserCircle className="w-10 h-10 text-[#888] mx-auto mb-3" />
          <p className="text-[#888] text-sm font-mono">{search ? "No clients match your search." : "No clients yet."}</p>
          {!search && (
            <button className="nb-btn-secondary mt-4 px-4 py-2 text-xs flex items-center gap-1.5 mx-auto" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" /> Add first client
            </button>
          )}
        </div>
      ) : (
        <div className="nb-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm nb-table min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Email</th>
                  <th className="text-left hidden md:table-cell">Phone</th>
                  <th className="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="group">
                    <td>
                      <Link href={`/clients/${client.id}`} className="font-semibold text-[#0C0C0C] hover:text-[#C94A00] flex items-center gap-1.5 transition-colors">
                        {client.name}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="text-[#555]">{client.email ?? "—"}</td>
                    <td className="text-[#555] hidden md:table-cell">{client.phone ?? "—"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteId(client.id)}
                        className="p-1.5 text-[#888] hover:text-[#C93838] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md border-3 border-[#0C0C0C] rounded-none shadow-[8px_8px_0_#0C0C0C]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-xl">ADD CLIENT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider">Full Name *</Label>
              <Input id="name" name="name" required placeholder="Muhammad Ali" className="rounded-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m.ali@example.com" className="rounded-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wider">Phone</Label>
                <Input id="phone" name="phone" placeholder="+92 300 0000000" className="rounded-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="font-mono text-xs uppercase tracking-wider">Address</Label>
              <Input id="address" name="address" placeholder="123 Main St, Karachi" className="rounded-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="font-mono text-xs uppercase tracking-wider">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Additional notes..." rows={3} className="rounded-none" />
            </div>
            <DialogFooter className="gap-2">
              <button type="button" className="nb-btn-secondary px-4 py-2 text-sm" onClick={() => setShowAdd(false)}>CANCEL</button>
              <button type="submit" className="nb-btn-primary px-4 py-2 text-sm" disabled={createClient.isPending}>
                {createClient.isPending ? "ADDING..." : "ADD CLIENT"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm border-3 border-[#0C0C0C] rounded-none shadow-[8px_8px_0_#0C0C0C]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-widest text-xl text-[#C93838]">DELETE CLIENT</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#555] py-2 font-mono">
            This will permanently delete the client and all their cases. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <button className="nb-btn-secondary px-4 py-2 text-sm" onClick={() => setDeleteId(null)}>CANCEL</button>
            <button
              className="nb-btn-primary px-4 py-2 text-sm bg-[#C93838] border-[#C93838]"
              disabled={deleteClient.isPending}
              onClick={() => deleteId && deleteClient.mutate({ id: deleteId })}
            >
              {deleteClient.isPending ? "DELETING..." : "DELETE"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
