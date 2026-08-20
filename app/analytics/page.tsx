import Link from "next/link";
import { getBusinessAnalytics, TimeRange } from "@/lib/services/analytics.service";
import AppShell from "@/components/layout/AppShell";
import {
  MoneyFlowChart,
  MonthlyCollectionsChart,
  CapitalRecoveryDonut,
  PortfolioCompositionDonut,
  InterestGrowthChart
} from "./charts";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type AnalyticsPageProps = {
  searchParams: Promise<{
    timeRange?: string;
  }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { timeRange = "ALL_TIME" } = await searchParams;
  
  const isValidTimeRange = ["ALL_TIME", "THIS_MONTH", "THIS_YEAR"].includes(timeRange);
  const selectedTimeRange = (isValidTimeRange ? timeRange : "ALL_TIME") as TimeRange;

  const data = await getBusinessAnalytics({ timeRange: selectedTimeRange });

  // If there are no loans in the DB (Total Loans is empty), we show empty state
  // But since the service might return 0 for everything, let's rely on totalLoans
  // Wait, service doesn't return totalLoans in root anymore? Ah!
  // I need to check `data.topOutstandingLoans.length === 0` or something.
  // Actually, I can just check if `data.overview.totalCapitalLent === 0`.
  const hasLendingActivity = data.overview.totalCapitalLent > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] pb-12 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-7">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Business Analytics
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Track lending growth, collections, interest earnings and portfolio exposure.
            </p>
          </div>

          <div className="flex bg-zinc-100 p-1 rounded-xl">
            <Link
              href="/analytics?timeRange=ALL_TIME"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                selectedTimeRange === "ALL_TIME"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              All Time
            </Link>
            <Link
              href="/analytics?timeRange=THIS_YEAR"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                selectedTimeRange === "THIS_YEAR"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              This Year
            </Link>
            <Link
              href="/analytics?timeRange=THIS_MONTH"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                selectedTimeRange === "THIS_MONTH"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              This Month
            </Link>
          </div>
        </div>

        {!hasLendingActivity ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 border-dashed bg-zinc-50/50 py-24 text-center">
            <h3 className="mt-6 text-lg font-semibold text-zinc-900">No lending data available yet.</h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Start by adding a borrower and creating your first loan.
            </p>
            <Link
              href="/borrowers/new"
              className="mt-8 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Add First Borrower
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* SECTION 1 — KEY OVERVIEW */}
            <section>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Capital Lent</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(data.overview.totalCapitalLent)}</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Capital Outstanding</p>
                  <p className="mt-2 text-2xl font-bold text-red-800">{formatCurrency(data.overview.capitalOutstanding)}</p>
                </div>
                <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Interest Income Collected</p>
                  <p className="mt-2 text-2xl font-bold text-green-800">{formatCurrency(data.overview.interestIncomeCollected)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Money Received</p>
                  <p className="mt-2 text-2xl font-bold text-zinc-900">{formatCurrency(data.overview.totalMoneyReceived)}</p>
                </div>
              </div>
            </section>

            {/* SECTION 2 — MONEY FLOW OVER TIME */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-900">Money Flow Over Time</h2>
                <p className="mt-1 text-sm text-zinc-500">Track lending, principal recovery and interest collection over time.</p>
              </div>
              <MoneyFlowChart data={data.moneyFlow} />
            </section>

            {/* SECTION 3 — MONTHLY COLLECTIONS */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-900">Monthly Collections</h2>
                <p className="mt-1 text-sm text-zinc-500">Principal Recovered vs Interest Income Collected</p>
              </div>
              <MonthlyCollectionsChart data={data.monthlyCollections} />
            </section>

            {/* SECTION 4 & 6 — DONUT CHARTS */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* SECTION 4 — CAPITAL RECOVERY */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col h-full">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-zinc-900">Capital Recovery</h2>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <CapitalRecoveryDonut data={data.capitalRecovery} />
                  <div className="mt-8 flex justify-between border-t border-zinc-100 pt-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Principal Recovered</p>
                      <p className="mt-1 text-lg font-semibold text-blue-600">{formatCurrency(data.capitalRecovery.recovered)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Capital Outstanding</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-400">{formatCurrency(data.capitalRecovery.outstanding)}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 6 — CURRENT PORTFOLIO COMPOSITION */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col h-full">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-zinc-900">Current Portfolio Outstanding</h2>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <PortfolioCompositionDonut data={data.portfolioComposition} />
                  <div className="mt-8 flex justify-between border-t border-zinc-100 pt-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Principal Due</p>
                      <p className="mt-1 text-lg font-semibold text-red-500">{formatCurrency(data.portfolioComposition.principalOutstanding)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Interest Due</p>
                      <p className="mt-1 text-lg font-semibold text-amber-500">{formatCurrency(data.portfolioComposition.interestReceivable)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-900">{formatCurrency(data.portfolioComposition.totalOutstanding)}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* SECTION 5 — INTEREST INCOME GROWTH */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-900">Interest Income Growth</h2>
                <p className="mt-1 text-sm text-zinc-500">Actual collected interest income per month</p>
              </div>
              <InterestGrowthChart data={data.interestGrowth} />
            </section>

            {/* SECTION 7 — TOP OUTSTANDING LOANS */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-zinc-900">TOP OUTSTANDING LOANS</h2>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-zinc-900">Borrower Name</th>
                      <th className="px-6 py-4 font-semibold text-zinc-900">Original Principal</th>
                      <th className="px-6 py-4 font-semibold text-zinc-900">Principal Remaining</th>
                      <th className="px-6 py-4 font-semibold text-zinc-900">Interest Remaining</th>
                      <th className="px-6 py-4 font-semibold text-zinc-900">Total Outstanding</th>
                      <th className="px-6 py-4 font-semibold text-zinc-900">Status</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {data.topOutstandingLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-zinc-50 transition">
                        <td className="px-6 py-4 font-medium text-zinc-900">{loan.borrowerName}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatCurrency(loan.originalPrincipal)}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatCurrency(loan.principalRemaining)}</td>
                        <td className="px-6 py-4 text-zinc-500">{formatCurrency(loan.interestRemaining)}</td>
                        <td className="px-6 py-4 font-semibold text-red-600">{formatCurrency(loan.totalOutstanding)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                              loan.status === "ACTIVE"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/loans/${loan.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            View Loan <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 8 — FINANCIAL SUMMARY */}
            <section>
              <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-black p-8 text-white shadow-xl sm:p-10">
                <h2 className="text-2xl font-bold tracking-tight">Business Position</h2>
                <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Capital Lent</p>
                    <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.overview.totalCapitalLent)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Capital Recovered</p>
                    <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.capitalRecovery.recovered)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Capital Still Outstanding</p>
                    <p className="mt-1 text-2xl font-semibold text-red-400">{formatCurrency(data.capitalRecovery.outstanding)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Interest Income Collected</p>
                    <p className="mt-1 text-2xl font-semibold text-green-400">{formatCurrency(data.overview.allTimeInterestCollected)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Interest Still Receivable</p>
                    <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.portfolioComposition.interestReceivable)}</p>
                  </div>
                  <div className="border-t border-zinc-800 pt-4 sm:border-none sm:pt-0">
                    <p className="text-sm font-medium text-zinc-400">Total Amount Currently Outstanding</p>
                    <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(data.portfolioComposition.totalOutstanding)}</p>
                  </div>
                </div>
              </div>
            </section>
            
          </div>
        )}
      </div>
    </AppShell>
  );
}
