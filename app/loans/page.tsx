import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import AppShell from "@/components/layout/AppShell";
import { getCalculatedLoanStatus } from "@/lib/services/payment.service";

export const dynamic = "force-dynamic";

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
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInterestRule(
  rate: number,
  valueType: string,
  frequency: string
) {
  const type =
    valueType === "RUPEES"
      ? `₹${rate} per ₹100`
      : `${rate}%`;

  const frequencyText =
    frequency === "MONTHLY"
      ? "per month"
      : frequency === "YEARLY"
        ? "per year"
        : "per custom period";

  return `${type} ${frequencyText}`;
}

type LoansPageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
};

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const { q, filter } = await searchParams;
  const searchQuery = q?.toLowerCase() || "";
  const statusFilter = filter || "ALL";

  const allLoans = await prisma.loan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      borrower: true,
      allocations: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const calculationDate = new Date();

  // Process loans to attach calculated status and outstanding
  let processedLoans = allLoans.map((loan) => {
    const calc = getCalculatedLoanStatus(loan, calculationDate);
    return {
      ...loan,
      calculatedStatus: calc.status,
      totalOutstanding: calc.totalOutstanding,
    };
  });

  // Apply filters
  if (statusFilter !== "ALL") {
    processedLoans = processedLoans.filter(l => l.calculatedStatus === statusFilter);
  }

  if (searchQuery) {
    processedLoans = processedLoans.filter(l => 
      l.borrower.fullName.toLowerCase().includes(searchQuery) ||
      l.borrower.phone.includes(searchQuery)
    );
  }

  const activeLoansCount = processedLoans.filter(l => l.calculatedStatus === "ACTIVE").length;

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
                Loans Directory
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Manage all lending records, view outstanding amounts, and track the status of each loan.
              </p>
            </div>

            <Link
              href="/loans/new"
              className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/20 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Loan
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 shadow-sm focus-within:border-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              name="q"
              defaultValue={q}
              placeholder="Search by name or phone..."
              className="w-full bg-transparent text-sm text-zinc-900 outline-none"
            />
            {filter && <input type="hidden" name="filter" value={filter} />}
            <button type="submit" className="hidden">Search</button>
          </form>

          <div className="flex items-center gap-2">
            <Link 
              href={`/loans?filter=ALL${q ? `&q=${q}` : ''}`}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${statusFilter === 'ALL' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}
            >
              All
            </Link>
            <Link 
              href={`/loans?filter=ACTIVE${q ? `&q=${q}` : ''}`}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${statusFilter === 'ACTIVE' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}
            >
              Active
            </Link>
            <Link 
              href={`/loans?filter=CLOSED${q ? `&q=${q}` : ''}`}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${statusFilter === 'CLOSED' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'}`}
            >
              Closed
            </Link>
          </div>
        </div>

        {/* Content Area */}
        {processedLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 border-dashed bg-zinc-50/50 py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-zinc-900">No loans yet</h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Create your first loan to start tracking lending and payments.
            </p>
            <Link
              href="/loans/new"
              className="mt-8 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Add First Loan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {processedLoans.map((loan) => {
              const initials = loan.borrower.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              const isActive = loan.calculatedStatus === "ACTIVE";

              return (
                <div
                  key={loan.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/50"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 font-bold text-zinc-700 shadow-inner">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-zinc-900 line-clamp-1">
                            {loan.borrower.fullName}
                          </h3>
                          <div className="mt-0.5 text-xs text-zinc-500">
                            {loan.borrower.phone}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                        isActive 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/50' 
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}>
                        {loan.calculatedStatus}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-sm text-zinc-600">
                        <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Original Principal</span>
                        <span className="font-semibold text-zinc-900">{formatCurrency(Number(loan.principalAmount))}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-zinc-600">
                        <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Started</span>
                        <span className="font-medium">{formatDate(loan.startDate)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-zinc-600">
                        <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Interest</span>
                        <span className="font-medium text-xs">{getInterestRule(Number(loan.interestRate), loan.interestValueType, loan.interestFrequency)}</span>
                      </div>

                      <div className={`mt-2 flex justify-between items-center p-3 rounded-xl ${isActive ? 'bg-red-50/50' : 'bg-zinc-50/50'}`}>
                        <span className={`text-xs uppercase tracking-wider font-semibold ${isActive ? 'text-red-600' : 'text-zinc-500'}`}>Total Due</span>
                        <span className={`font-bold ${isActive ? 'text-red-700' : 'text-zinc-400'}`}>{formatCurrency(loan.totalOutstanding)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/loans/${loan.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-900 hover:text-white"
                    >
                      View Loan &rarr;
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
