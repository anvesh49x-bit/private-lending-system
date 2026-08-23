"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "◩",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: "📈",
  },
  {
    name: "Borrowers",
    href: "/borrowers",
    icon: "◉",
  },
  {
    name: "Loans",
    href: "/loans",
    icon: "◫",
  },
  {
    name: "Payments",
    href: "/payments",
    icon: "↳",
  },
  {
    name: "Receipts",
    href: "/receipts",
    icon: "🧾",
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col lg:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white shadow-sm">
            L
          </div>
          <p className="text-sm font-semibold text-zinc-950">Ledger</p>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-[280px] flex-1 flex-col bg-white pt-5 pb-4">
              <div className="absolute top-0 right-0 -mr-12 pt-4">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex shrink-0 items-center px-4 mb-4">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white shadow-sm">
                    L
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-zinc-950">Ledger</p>
                    <p className="text-[11px] text-zinc-500">Lending Management</p>
                  </div>
                </Link>
              </div>
              
              <div className="mt-5 h-0 flex-1 overflow-y-auto px-4">
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Workspace
                </p>
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                          isActive
                            ? "bg-zinc-950 text-white shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                        }`}
                      >
                        <span className="flex w-5 justify-center text-base">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] border-r border-zinc-200 bg-white lg:flex lg:flex-col z-40">
        <div className="flex h-20 items-center px-7">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white shadow-sm">
              L
            </div>
            <div>
              <p className="text-[15px] font-semibold text-zinc-950">Ledger</p>
              <p className="text-[11px] text-zinc-500">Lending Management</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-5 overflow-y-auto">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Workspace
          </p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  <span className="flex w-5 justify-center text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <div className="rounded-xl bg-zinc-50 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-900">Private Lending System</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Manage borrowers, loans and payments clearly.</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:pl-[250px] w-full max-w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
