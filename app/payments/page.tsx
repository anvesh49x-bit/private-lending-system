import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/prisma";
import PaymentsFilter from "./PaymentsFilter";

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

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

type PaymentsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    date?: string;
  }>;
};

export default async function PaymentsHistoryPage({ searchParams }: PaymentsPageProps) {
  const { q, status, date } = await searchParams;
  const searchQuery = q?.toLowerCase() || "";
  const statusFilter = status || "ALL";
  const dateFilter = date || "ALL";

  const payments = await prisma.payment.findMany({
    orderBy: {
      paymentDate: "desc",
    },
    include: {
      borrower: {
        select: {
          fullName: true,
          phone: true,
        },
      },
      allocations: true,
    },
  });

  const filteredPayments = payments.filter(payment => {
    // Search
    if (searchQuery) {
      const matchesSearch = 
        payment.borrower.fullName.toLowerCase().includes(searchQuery) ||
        payment.borrower.phone.includes(searchQuery);
      if (!matchesSearch) return false;
    }

    // Status
    if (statusFilter !== "ALL" && payment.status !== statusFilter) {
      return false;
    }

    // Date
    if (dateFilter !== "ALL") {
      const pDate = new Date(payment.paymentDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (dateFilter === "TODAY" && !isSameDay(pDate, today)) return false;
      if (dateFilter === "YESTERDAY" && !isSameDay(pDate, yesterday)) return false;
      if (dateFilter === "OLDER") {
        if (isSameDay(pDate, today) || isSameDay(pDate, yesterday)) return false;
      }
    }

    return true;
  });

  // Group by date text
  const groupedPayments: { [key: string]: typeof filteredPayments } = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  filteredPayments.forEach(payment => {
    const pDate = new Date(payment.paymentDate);
    let groupKey = formatDate(pDate);
    
    if (isSameDay(pDate, today)) {
      groupKey = "TODAY";
    } else if (isSameDay(pDate, yesterday)) {
      groupKey = "YESTERDAY";
    } else {
      groupKey = groupKey.toUpperCase();
    }

    if (!groupedPayments[groupKey]) {
      groupedPayments[groupKey] = [];
    }
    groupedPayments[groupKey].push(payment);
  });

  const groupKeys = Object.keys(groupedPayments);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Payments
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Transaction history of all payments received.
            </p>
          </div>
          
          <Link
            href="/payments/new"
            className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 self-start sm:self-auto"
          >
            + Receive Payment
          </Link>
        </div>

        {/* Filters */}
        <PaymentsFilter 
          searchQuery={searchQuery} 
          statusFilter={statusFilter} 
          dateFilter={dateFilter} 
        />

        {groupKeys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-zinc-900">No payments found</p>
            <p className="mt-1 text-sm text-zinc-500">Adjust your filters or record a new payment.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {groupKeys.map((dateGroup, idx) => (
              <div key={dateGroup} className={idx > 0 ? "border-t border-zinc-100" : ""}>
                <div className="bg-zinc-50 px-5 py-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    {dateGroup}
                  </h3>
                </div>
                <div className="divide-y divide-zinc-100">
                  {groupedPayments[dateGroup].map(payment => {
                    let principalAllocated = 0;
                    let interestAllocated = 0;

                    if (payment.allocations) {
                      payment.allocations.forEach((alloc) => {
                        principalAllocated += Number(alloc.principalAmount || 0);
                        interestAllocated += Number(alloc.interestAmount || 0);
                      });
                    }

                    const paymentAmount = Number(payment.amount);
                    const excess = Math.max(0, paymentAmount - principalAllocated - interestAllocated);

                    return (
                      <Link 
                        key={payment.id} 
                        href={`/payments/${payment.id}`}
                        className="group flex flex-row items-center justify-between px-5 py-4 transition hover:bg-zinc-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 transition group-hover:bg-green-100">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                          
                          <div className="flex min-w-0 flex-col justify-center">
                            <p className="truncate text-[15px] font-semibold text-zinc-900 group-hover:text-zinc-950">
                              Received from {payment.borrower.fullName}
                            </p>
                            
                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                              {payment.borrower.phone}
                            </p>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">
                              <span>{formatDate(payment.paymentDate)}</span>
                              <span className="text-zinc-300">•</span>
                              <span className="text-amber-700/80">Interest paid {formatCurrency(interestAllocated)}</span>
                              <span className="text-zinc-300">•</span>
                              <span className="text-green-700/80">Principal paid {formatCurrency(principalAllocated)}</span>
                              {excess > 0 && (
                                <>
                                  <span className="text-zinc-300">•</span>
                                  <span className="text-zinc-500">Excess {formatCurrency(excess)}</span>
                                </>
                              )}
                            </div>
                            
                            {payment.notes && (
                              <p className="mt-1 text-[11px] italic text-zinc-400">
                                Note: {payment.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end pl-3">
                          <p className="text-lg font-bold text-zinc-900">
                            +{formatCurrency(paymentAmount)}
                          </p>
                          {payment.status !== "COMPLETED" && (
                            <p className="mt-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                              {payment.status.replace("_", " ")}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
