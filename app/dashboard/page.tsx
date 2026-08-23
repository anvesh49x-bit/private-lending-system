import Link from "next/link";
import { format } from "date-fns";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const alerts = data.alerts;
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
          <div className="space-y-12">
            
            {/* LOAN ALERTS SECTION */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-950">Loan Alerts</h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-red-200">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-700">Overdue Loans</p>
                  <p className="mt-2 text-3xl font-bold text-red-800">{alerts.overdueCount} <span className="text-base font-semibold text-red-600/80">Loans</span></p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-amber-200">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Due Soon</p>
                  <p className="mt-2 text-3xl font-bold text-amber-800">{alerts.dueSoonCount} <span className="text-base font-semibold text-amber-600/80">Loans</span></p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-700">Overdue Amount</p>
                  <p className="mt-2 text-2xl font-bold text-red-800">{formatCurrency(alerts.overdueAmount)}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* OVERDUE LIST */}
                <div className="rounded-2xl border border-red-200 bg-white overflow-hidden shadow-sm">
                  <div className="bg-red-50 px-5 py-3 border-b border-red-100 flex items-center justify-between">
                    <h3 className="font-bold text-red-900">OVERDUE</h3>
                    <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Requires Action</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {alerts.overdueLoans.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-sm">No overdue loans.</div>
                    ) : (
                      alerts.overdueLoans.map((loan) => (
                        <div key={loan.loanId} className="p-5 hover:bg-zinc-50 transition flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-zinc-900">{loan.borrowerName}</p>
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Overdue by {loan.daysOverdue} days</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs text-zinc-500 mb-0.5">Due Date: {formatDate(loan.endDate)}</p>
                              <p className="text-sm font-bold text-zinc-900">Total Due: {formatCurrency(loan.totalOutstanding)}</p>
                            </div>
                            <Link href={`/loans/${loan.loanId}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                              View Loan &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* DUE SOON LIST */}
                <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
                  <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-center justify-between">
                    <h3 className="font-bold text-amber-900">DUE SOON</h3>
                    <span className="bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Next 7 Days</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {alerts.dueSoonLoans.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-sm">No loans due in the next 7 days.</div>
                    ) : (
                      alerts.dueSoonLoans.map((loan) => (
                        <div key={loan.loanId} className="p-5 hover:bg-zinc-50 transition flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-zinc-900">{loan.borrowerName}</p>
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              {loan.daysUntilDue === 0 ? "Due today" : `Due in ${loan.daysUntilDue} days`}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs text-zinc-500 mb-0.5">Due Date: {formatDate(loan.endDate)}</p>
                              <p className="text-sm font-bold text-zinc-900">Total Due: {formatCurrency(loan.totalOutstanding)}</p>
                            </div>
                            <Link href={`/loans/${loan.loanId}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                              View Loan &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Left Column: Summary & Main Stats */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* TOP SUMMARY */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-black p-8 text-white shadow-xl sm:p-10 sm:col-span-3">
                  <h2 className="text-2xl font-bold tracking-tight">Business Position</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Capital Lent</p>
                      <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.overview.totalPrincipalLent)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Capital Recovered</p>
                      <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.overview.principalRecovered)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Capital Still Outstanding</p>
                      <p className="mt-1 text-2xl font-semibold text-red-400">{formatCurrency(data.overview.principalRemaining)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Interest Income Collected</p>
                      <p className="mt-1 text-2xl font-semibold text-green-400">{formatCurrency(data.overview.interestIncomeCollected)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Interest Still Receivable</p>
                      <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.overview.interestRemaining)}</p>
                    </div>
                    <div className="border-t border-zinc-800 pt-4 sm:border-none sm:pt-0">
                      <p className="text-sm font-medium text-zinc-400">Total Amount Currently Outstanding</p>
                      <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(data.overview.totalOutstanding)}</p>
                    </div>
                  </div>
                </div>
                
                {/* LOAN OVERVIEW */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:col-span-2">
                  <h2 className="text-sm font-semibold text-zinc-950 mb-4">Loan Overview</h2>
                  <div className="grid grid-cols-1 gap-4 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="pt-2 sm:pt-0">
                      <p className="text-2xl font-semibold text-zinc-900">{data.overview.activeLoansCount}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Loans</p>
                    </div>
                    <div className="pt-4 sm:pl-4 sm:pt-0">
                      <p className="text-2xl font-semibold text-zinc-900">{data.overview.closedLoansCount}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Closed Loans</p>
                    </div>
                    <div className="pt-4 sm:pl-4 sm:pt-0">
                      <p className="text-2xl font-semibold text-zinc-900">{data.overview.totalBorrowers}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Borrowers</p>
                    </div>
                  </div>
                </div>

                {/* COLLECTION SUMMARY */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <h2 className="text-sm font-semibold text-zinc-950 mb-4">Collection Alerts</h2>
                  <div className="space-y-2 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-zinc-600">Overdue:</span>
                      <span className="text-zinc-900 font-bold">{data.collectionReminders.overdueCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-zinc-600">Today:</span>
                      <span className="text-zinc-900 font-bold">{data.collectionReminders.todayCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-zinc-600">Upcoming:</span>
                      <span className="text-zinc-900 font-bold">{data.collectionReminders.upcomingCount}</span>
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
                        <Link 
                          href={`/payments/${payment.id}`}
                          key={payment.id} 
                          className="flex flex-row items-center justify-between px-5 py-4 hover:bg-zinc-50/50 transition block"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                            
                            <div className="flex min-w-0 flex-col justify-center">
                              <p className="truncate text-[15px] font-semibold text-zinc-900">
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
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>

            </div>

            {/* Right Column: Attention needed */}
            <div className="space-y-8">

              {/* AUTOMATED REMINDERS */}
              <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[400px]">
                <div className="border-b border-purple-100 bg-purple-50 px-5 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-purple-900">
                      Automated Reminders
                    </h2>
                    <p className="mt-1 text-xs text-purple-700/80">
                      Sent Today: {data.remindersSummary.sentToday} • Pending: {data.remindersSummary.pendingCount}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                  {data.automatedReminders.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-zinc-500">No scheduled reminders.</p>
                      <p className="mt-1 text-xs text-zinc-400">Configure them when creating a loan.</p>
                    </div>
                  ) : (
                    data.automatedReminders.map((reminder) => (
                      <Link 
                        key={reminder.id}
                        href={`/loans/${reminder.loanId}`}
                        className="block p-5 hover:bg-zinc-50/50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-zinc-900 text-sm">{reminder.borrowerName}</p>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                            {reminder.mode.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                          <span>Scheduled for</span>
                          <span className="font-medium text-zinc-900">
                            {format(new Date(reminder.scheduledDate), "dd MMM yyyy 'at' hh:mm a")}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>
              
              <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[400px]">
                <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Collection Reminders (Manual)
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Loans with upcoming or past due collection dates.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                  {data.collectionReminders.all.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-zinc-500">No collection reminders.</p>
                      <p className="mt-1 text-xs text-zinc-400">Set a collection reminder when creating or editing a loan.</p>
                    </div>
                  ) : (
                    data.collectionReminders.all.map((reminder) => (
                      <Link 
                        key={`${reminder.loanId}-reminder`}
                        href={`/loans/${reminder.loanId}`}
                        className="block p-5 hover:bg-zinc-50/50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-zinc-900 text-sm">{reminder.borrowerName}</p>
                          {reminder.status === "OVERDUE" && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                              {Math.abs(reminder.daysDiff)} {Math.abs(reminder.daysDiff) === 1 ? 'Day' : 'Days'} Overdue
                            </span>
                          )}
                          {reminder.status === "TODAY" && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              Collect Today
                            </span>
                          )}
                          {reminder.status === "UPCOMING" && (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                              {reminder.daysDiff === 1 ? 'Tomorrow' : `In ${reminder.daysDiff} days`}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-zinc-500 mb-1">
                          <span>Date</span>
                          <span className="font-medium text-zinc-700">{formatDate(reminder.reminderDate)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                          <span>Outstanding</span>
                          <span className="font-medium text-zinc-700">{formatCurrency(reminder.totalOutstanding)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>

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
          </div>
        )}
      </div>
    </AppShell>
  );
}
