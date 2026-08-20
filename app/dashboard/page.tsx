import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getDashboardData } from "@/lib/services/dashboard.service";

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const isEmpty = data.overview.totalBorrowers === 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header & Action Bar */}
        <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Overview of your lending business
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/borrowers/new"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              + Add Borrower
            </Link>

            <Link
              href="/loans/new"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              + Add Loan
            </Link>

            <Link
              href="/payments/new"
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              + Receive Payment
            </Link>
          </div>
        </div>

        {isEmpty ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-24 text-center">
            <h2 className="text-xl font-semibold text-zinc-900">No lending activity yet.</h2>
            <p className="mt-2 text-sm text-zinc-500">Start by adding your first borrower to the system.</p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/borrowers/new"
                className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Add Your First Borrower
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Left Column: Summary & Main Stats */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* TOP SUMMARY */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Total Principal Lent
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
                    {formatCurrency(data.overview.totalPrincipalLent)}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700">
                    Total Received
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-green-700">
                    {formatCurrency(data.overview.totalReceived)}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm sm:row-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                    Total Outstanding
                  </p>
                  <p className="mt-4 text-4xl font-bold tracking-tight text-red-700 break-words">
                    {formatCurrency(data.overview.totalOutstanding)}
                  </p>
                  
                  <div className="mt-6 flex flex-col gap-4 border-t border-red-200/60 pt-6">
                    <div>
                      <p className="text-xs font-medium text-red-600/80 uppercase tracking-wider">Principal Remaining</p>
                      <p className="mt-1 text-lg font-semibold text-red-700">{formatCurrency(data.overview.principalRemaining)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600/80 uppercase tracking-wider">Interest Remaining</p>
                      <p className="mt-1 text-lg font-semibold text-red-700">{formatCurrency(data.overview.interestRemaining)}</p>
                    </div>
                  </div>
                </div>
                
                {/* LOAN OVERVIEW */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2">
                  <h2 className="text-sm font-semibold text-zinc-950 mb-4">Loan Overview</h2>
                  <div className="grid grid-cols-3 gap-4 divide-x divide-zinc-100">
                    <div>
                      <p className="text-2xl font-semibold text-zinc-900">{data.overview.activeLoansCount}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Loans</p>
                    </div>
                    <div className="pl-4">
                      <p className="text-2xl font-semibold text-zinc-900">{data.overview.closedLoansCount}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Closed Loans</p>
                    </div>
                    <div className="pl-4">
                      <p className="text-2xl font-semibold text-zinc-900">{data.overview.totalBorrowers}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Borrowers</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT PAYMENTS */}
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Recent Payments
                  </h2>
                  <Link href="/payments" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                    View All &rarr;
                  </Link>
                </div>
                
                {data.recentPayments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                    <p className="text-sm text-zinc-500">No payments received yet.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="divide-y divide-zinc-100">
                      {data.recentPayments.map(payment => (
                        <div key={payment.id} className="flex flex-row items-center justify-between px-5 py-4 hover:bg-zinc-50/50 transition">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                            
                            <div className="flex flex-col justify-center">
                              <p className="text-[15px] font-semibold text-zinc-900">
                                Received from {payment.borrowerName}
                              </p>
                              
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">
                                <span>{formatDate(payment.paymentDate)}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-amber-700/80">Interest {formatCurrency(payment.interestPaid)}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-green-700/80">Principal {formatCurrency(payment.principalPaid)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end pl-3">
                            <p className="text-lg font-bold text-zinc-900">
                              +{formatCurrency(payment.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

            </div>

            {/* Right Column: Attention needed */}
            <div className="space-y-8">
              <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
                <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Active Loans Requiring Attention
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Top 5 largest outstanding balances.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                  {data.topActiveLoans.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-zinc-500">No active loans found.</p>
                    </div>
                  ) : (
                    data.topActiveLoans.map((loan, idx) => (
                      <div key={loan.id} className="p-5 hover:bg-zinc-50/50 transition">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-zinc-900 text-sm">{loan.borrowerName}</p>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            ACTIVE
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-zinc-500 mb-3">
                          <span>Original</span>
                          <span className="font-medium text-zinc-700">{formatCurrency(loan.originalPrincipal)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4 p-3 bg-red-50/50 rounded-xl">
                          <span className="text-xs font-semibold text-red-600">Total Due</span>
                          <span className="font-bold text-red-700">{formatCurrency(loan.totalOutstanding)}</span>
                        </div>

                        <Link 
                          href={`/loans/${loan.id}`}
                          className="block w-full text-center rounded-lg border border-zinc-200 bg-white py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition"
                        >
                          View Loan &rarr;
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
