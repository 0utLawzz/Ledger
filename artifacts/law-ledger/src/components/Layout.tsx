import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FolderOpen, FileText, Scale, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/cases", label: "Case Ledger", icon: FolderOpen },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="px-5 py-4 border-b-2 border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C94A00] flex items-center justify-center border-2 border-[#C94A00]">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-display text-xl leading-none tracking-wider">LEXLEDGER</p>
            <p className="text-[#888] text-[10px] mt-0.5 font-mono uppercase tracking-widest">Case Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-75",
                "border border-transparent",
                active
                  ? "bg-[#C94A00] text-white border-[#C94A00]"
                  : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t-2 border-[#2a2a2a]">
        <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest">Law Firm Ledger v1.0</p>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0C0C0C] flex flex-col print:hidden hidden md:flex">
        {navContent}
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden print:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0C0C0C] h-12 flex items-center px-4 gap-3 border-b-2 border-[#C94A00]">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-1"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#C94A00]" />
            <span className="text-white font-display text-lg tracking-wider">LEXLEDGER</span>
          </div>
        </div>
        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed top-12 left-0 right-0 bottom-0 z-40 bg-[#0C0C0C] flex flex-col">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 text-base font-medium border-b border-[#1a1a1a]",
                    active ? "bg-[#C94A00] text-white" : "text-[#888]"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-mono uppercase tracking-wider">{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <main className="flex-1 overflow-auto md:mt-0 mt-12">
        {children}
      </main>
    </div>
  );
}
