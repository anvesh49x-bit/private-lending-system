"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "◩",
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
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center px-7">
          <Link
            href="/borrowers"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white shadow-sm">
              L
            </div>

            <div>
              <p className="text-[15px] font-semibold text-zinc-950">
                Ledger
              </p>

              <p className="text-[11px] text-zinc-500">
                Lending Management
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

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
                  <span className="flex w-5 justify-center text-base">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <div className="rounded-xl bg-zinc-50 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-900">
              Private Lending System
            </p>

            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Manage borrowers, loans and payments clearly.
            </p>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[250px]">
        <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}