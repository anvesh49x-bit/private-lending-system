import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/prisma";
import { getCalculatedLoanStatus } from "@/lib/services/payment.service";
import DeleteLoanButton from "./DeleteLoanButton";

type LoanPageProps = {
  params: Promise<{
    loanId: string;
  }>;
};

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

function roundMoney(value: number) {
  return Number(value.toFixed(2));
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

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

export default async function LoanDetailsPage({ params }: LoanPageProps) {
  const { loanId } = await params;

  const loan = await prisma.loan.findUnique({
    where: {
      id: loanId,
    },
    include: {
      borrower: true,
      allocations: {
        include: {
          payment: true,
        },
        orderBy: {
          payment: {
            paymentDate: "desc",
          },
        },
      },
    },
  });

  if (!loan) {
    notFound();
  }

  const calc = getCalculatedLoanStatus(loan);
  const isActive = calc.status === "ACTIVE";
  const displayStatus = calc.status;

  const originalPrincipal = Number(loan.principalAmount);
  // calculate totalReceivedForThisLoan just by adding up allocations, since it's only used for display here
  const principalPaid = loan.allocations.reduce((sum, a) => sum + Number(a.principalAmount), 0);
  const interestPaid = loan.allocations.reduce((sum, a) => sum + Number(a.interestAmount), 0);
  const totalReceivedForThisLoan = roundMoney(principalPaid + interestPaid);

  const remainingPrincipal = calc.remainingPrincipal;
  const remainingInterest = calc.remainingInterest;
  const totalDue = calc.totalOutstanding;
  
  // Actually, we don't need accruedInterest anymore, but we can compute it for display if needed
  // Or just say "Interest Till Today" = remainingInterest + interestPaid
  const accruedInterest = roundMoney(calc.remainingInterest + interestPaid);

  // Group allocations by Payment Date for the PhonePe UI
  const groupedAllocations: { [key: string]: typeof loan.allocations } = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  loan.allocations.forEach((allocation) => {
    const pDate = new Date(allocation.payment.paymentDate);
    let groupKey = formatDate(pDate);

    if (isSameDay(pDate, today)) {
      groupKey = "TODAY";
    } else if (isSameDay(pDate, yesterday)) {
      groupKey = "YESTERDAY";
    } else {
      groupKey = groupKey.toUpperCase();
    }

    if (!groupedAllocations[groupKey]) {
      groupedAllocations[groupKey] = [];
    }
    groupedAllocations[groupKey].push(allocation);
  });

  const groupKeys = Object.keys(groupedAllocations); // Already sorted descending because allocations were ordered by paymentDate desc

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href={`/loans`}
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
            >
              ← Back to Loans
            </Link>

            <div className="mt-5 flex flex-wrap gap-4 items-center">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                Loan Details
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {displayStatus}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
              <span className="font-medium text-zinc-700">Borrower: {loan.borrower.fullName}</span>
              <span>Phone: {loan.borrower.phone}</span>
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
              <span>Started: {formatDate(loan.startDate)}</span>
              <span>Interest Rule: {getInterestRule(Number(loan.interestRate), loan.interestValueType, loan.interestFrequency)}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/borrowers/${loan.borrowerId}`}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-950"
            >
              View Borrower
            </Link>
            <Link
              href={`/loans/${loan.id}/edit`}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-950"
            >
              Edit Loan
            </Link>
            <DeleteLoanButton
              loanId={loan.id}
              borrowerName={loan.borrower.fullName}
              principalAmount={originalPrincipal}
              hasAllocations={loan.allocations.length > 0}
            />
            <Link
              href={`/payments/new?loanId=${loan.id}&borrowerId=${loan.borrowerId}`}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              + Receive Payment
            </Link>
          </div>
        </div>

        {/* ALERTS */}
        {isActive && loan.endDate && totalDue > 0 && (() => {
          const now = new Date();
          const nowMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const endDateMs = new Date(loan.endDate.getFullYear(), loan.endDate.getMonth(), loan.endDate.getDate()).getTime();
          const diffDays = Math.floor((endDateMs - nowMs) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            return (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-4 shadow-sm">
                <div className="text-red-600 mt-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">OVERDUE</h3>
                  <p className="mt-1 text-sm text-red-800">This loan is overdue by {Math.abs(diffDays)} days.</p>
                  <p className="mt-2 text-base font-semibold text-red-900">Outstanding: {formatCurrency(totalDue)}</p>
                </div>
              </div>
            );
          } else if (diffDays <= 7) {
            return (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4 shadow-sm">
                <div className="text-amber-600 mt-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">DUE SOON</h3>
                  <p className="mt-1 text-sm text-amber-800">
                    {diffDays === 0 ? "Due today." : `Due in ${diffDays} days.`}
                  </p>
                  <p className="mt-2 text-base font-semibold text-amber-900">Outstanding: {formatCurrency(totalDue)}</p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Loan Summary */}
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">
            Loan Summary
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Original Principal</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(originalPrincipal)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Interest Till Today</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(accruedInterest)}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <p className="text-sm font-medium text-green-700">Total Money Received</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-green-700">
                {formatCurrency(totalReceivedForThisLoan)}
              </p>
            </div>
          </div>
        </section>

        {/* Total Outstanding */}
        <section>
          {!isActive ? (
            <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 shadow-sm sm:p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 rounded-bl-xl bg-green-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-700 shadow-sm">
                Fully Paid
              </div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Loan fully settled</h3>
              <p className="mt-1 text-sm text-zinc-500">This loan is closed and has no outstanding balances.</p>
              
              <div className="mt-6 flex justify-center gap-12 border-t border-zinc-200 pt-6">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Total Outstanding</p>
                  <p className="mt-1 text-xl font-semibold text-zinc-400">{formatCurrency(0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Principal Remaining</p>
                  <p className="mt-1 text-xl font-semibold text-zinc-400">{formatCurrency(0)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">Interest Remaining</p>
                  <p className="mt-1 text-xl font-semibold text-zinc-400">{formatCurrency(0)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-red-600">
                    Total Outstanding Today
                  </p>
                  <p className="mt-2 text-5xl font-bold tracking-tight text-red-700">
                    {formatCurrency(totalDue)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-red-200/60 pt-6 sm:flex-row sm:gap-12">
                <div>
                  <p className="text-sm font-medium text-red-600/80">Principal Remaining</p>
                  <p className="mt-1 text-2xl font-semibold text-red-700">{formatCurrency(remainingPrincipal)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600/80">Interest Remaining</p>
                  <p className="mt-1 text-2xl font-semibold text-red-700">{formatCurrency(remainingInterest)}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Payment History */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-950">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Only displaying payments allocated to this specific loan.
            </p>
          </div>

          {groupKeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <p className="font-semibold text-zinc-900">No payments allocated to this loan</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {groupKeys.map((dateGroup, idx) => (
                <div key={dateGroup} className={idx > 0 ? "border-t border-zinc-100" : ""}>
                  <div className="bg-zinc-50 px-5 py-2.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                      {dateGroup}
                    </h3>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {groupedAllocations[dateGroup].map(allocation => {
                      const p = allocation.payment;
                      const allocPrincipal = Number(allocation.principalAmount);
                      const allocInterest = Number(allocation.interestAmount);
                      const allocTotal = allocPrincipal + allocInterest;

                      return (
                        <Link 
                          href={`/payments/${p.id}`}
                          key={allocation.id}
                          className="flex flex-row items-center justify-between px-5 py-4 transition hover:bg-zinc-50/50 block"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                            
                            <div className="flex min-w-0 flex-col justify-center">
                              <p className="truncate text-[15px] font-semibold text-zinc-900">
                                Payment received
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">
                                <span>{formatDate(p.paymentDate)}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-amber-700/80">Interest paid {formatCurrency(allocInterest)}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-green-700/80">Principal paid {formatCurrency(allocPrincipal)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end pl-3">
                            <p className="text-lg font-bold text-zinc-900">
                              +{formatCurrency(allocTotal)}
                            </p>
                            {p.status !== "COMPLETED" && (
                              <p className="mt-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                {p.status.replace("_", " ")}
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
        </section>

        {/* Loan Information Footer */}
        <section>
          <h2 className="text-xl font-semibold text-zinc-950 mb-4">
            Loan Information
          </h2>
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Loan Amount</p>
                <p className="mt-2 text-lg font-medium text-zinc-900">{formatCurrency(originalPrincipal)}</p>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Interest Rule</p>
                <p className="mt-2 text-lg font-medium text-zinc-900">
                  {getInterestRule(Number(loan.interestRate), loan.interestValueType, loan.interestFrequency)}
                </p>
              </div>
              <div className="p-6 border-t border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Loan Start Date</p>
                <p className="mt-2 text-lg font-medium text-zinc-900">{formatDate(loan.startDate)}</p>
              </div>
              <div className="p-6 border-t border-zinc-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Loan Status</p>
                <p className={`mt-2 text-lg font-medium ${isActive ? "text-green-700" : "text-zinc-500"}`}>
                  {displayStatus}
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
