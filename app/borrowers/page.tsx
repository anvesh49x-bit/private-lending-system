import { prisma } from "@/lib/db/prisma";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BorrowersPage() {
  const borrowers = await prisma.borrower.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { loans: true },
      },
    },
  });

  // Calculate some stats for the header
  const totalBorrowers = borrowers.length;
  const activeBorrowers = borrowers.filter(b => b._count.loans > 0).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl pb-12">
        {/* Advanced Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 text-white shadow-2xl sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Borrowers Directory
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Manage your client portfolio, view loan statuses, and add new borrowers to your private lending system.
              </p>
              
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-sm font-medium text-zinc-300">
                    <strong className="text-white">{totalBorrowers}</strong> Total
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  <span className="text-sm font-medium text-zinc-300">
                    <strong className="text-white">{activeBorrowers}</strong> Active Loans
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/borrowers/new"
              className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/20 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Borrower
            </Link>
          </div>
        </div>

        {/* Content Area */}
        {totalBorrowers === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 border-dashed bg-zinc-50/50 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-zinc-900">No borrowers yet</h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Get started by adding your first borrower. Their profile and loan details will appear here.
            </p>
            <Link
              href="/borrowers/new"
              className="mt-8 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Add Your First Borrower
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {borrowers.map((borrower) => {
              // Generate Initials
              const initials = borrower.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              const hasLoans = borrower._count.loans > 0;

              return (
                <div
                  key={borrower.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 font-bold text-zinc-700 shadow-inner group-hover:from-zinc-800 group-hover:to-zinc-900 group-hover:text-white transition-colors duration-300">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900 group-hover:text-black line-clamp-1">
                            {borrower.fullName}
                          </h3>
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                              hasLoans 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/50' 
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                            }`}>
                              {borrower._count.loans} {borrower._count.loans === 1 ? 'Loan' : 'Loans'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-sm text-zinc-600">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <span className="font-medium">{borrower.phone}</span>
                      </div>
                      
                      {borrower.address && (
                        <div className="flex items-start gap-3 text-sm text-zinc-600">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600 transition-colors mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </div>
                          <span className="line-clamp-2">{borrower.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href={`/borrowers/${borrower.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all group-hover:bg-zinc-900 group-hover:text-white"
                    >
                      View Portfolio
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}