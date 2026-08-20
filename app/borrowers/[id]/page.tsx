import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/prisma";
import { calculateLoanOutstanding } from "@/lib/services/payment.service";

type BorrowerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
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

export default async function BorrowerDetailsPage({
  params,
}: BorrowerPageProps) {
  const { id } = await params;

  const borrower = await prisma.borrower.findUnique({
    where: {
      id,
    },
    include: {
      loans: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          allocations: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
  });

  if (!borrower) {
    notFound();
  }

  /*
   * Calculate the REAL current position of every loan.
   *
   * We use payment allocations, not just the original
   * loan principal.
   */
  const loanDetails = borrower.loans.map((loan) => {
    const outstanding = calculateLoanOutstanding(loan, new Date());
    const isClosed = outstanding.remainingPrincipal <= 0 && outstanding.remainingInterest <= 0;
    
    const daysElapsed = Math.floor(
      (new Date().getTime() - loan.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...loan,
      status: isClosed ? "CLOSED" : "ACTIVE",
      originalPrincipal: outstanding.originalPrincipal,
      principalPaid: outstanding.principalPaid,
      remainingPrincipal: outstanding.remainingPrincipal,
      accruedInterest: outstanding.accruedInterest,
      interestPaid: outstanding.interestPaid,
      remainingInterest: outstanding.remainingInterest,
      totalDue: outstanding.totalRemaining,
      daysElapsed,
    };
  });

  const activeLoans = loanDetails.filter(
    (loan) => loan.status === "ACTIVE"
  );

  /*
   * Account summary uses the REAL remaining amounts.
   */
  const activePrincipal = roundMoney(
    activeLoans.reduce(
      (total, loan) =>
        total + loan.remainingPrincipal,
      0
    )
  );

  const interestTillToday = roundMoney(
    activeLoans.reduce(
      (total, loan) =>
        total + loan.remainingInterest,
      0
    )
  );

  const totalMoneyReceived = roundMoney(
    borrower.payments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    )
  );

  const totalDue = roundMoney(
    activePrincipal + interestTillToday
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/borrowers"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
            >
              ← Back to Borrowers
            </Link>

            <p className="mt-5 text-sm font-medium text-zinc-500">
              Borrower Account
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              {borrower.fullName}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
              <span>📞 {borrower.phone}</span>

              {borrower.address && (
                <span>📍 {borrower.address}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/loans/new?borrowerId=${borrower.id}`}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-950"
            >
              + Add New Loan
            </Link>

            <Link
              href={`/payments/new?borrowerId=${borrower.id}`}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              + Add Money Received
            </Link>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-zinc-950">
            Account Summary
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Live outstanding amounts after recorded payments.
          </p>

          <div className="mt-6 flex flex-col gap-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-600">
                Total Outstanding Today
              </p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-red-700">
                {formatCurrency(totalDue)}
              </p>
              <p className="mt-3 text-sm font-medium text-red-500/80">
                Principal Remaining + Interest Due Now
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                  Principal Remaining
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  {formatCurrency(activePrincipal)}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Money still with borrower
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">
                  Interest Due Now
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  {formatCurrency(interestTillToday)}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Interest accumulated after payments
                </p>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <p className="text-sm font-medium text-green-700">
                  Total Money Received
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-green-700">
                  {formatCurrency(totalMoneyReceived)}
                </p>
                <p className="mt-2 text-xs text-green-600/70">
                  All payments collected separately
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Loan Details
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Original loan, payments applied, and current outstanding balance.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              {loanDetails.length} loan
              {loanDetails.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {loanDetails.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-zinc-900">
                  No loans found
                </p>
              </div>
            ) : (
              loanDetails.map((loan, index) => (
                <div
                  key={loan.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-zinc-950">
                          Loan #{index + 1}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            loan.status === "ACTIVE"
                              ? "bg-green-50 text-green-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {loan.status === "ACTIVE"
                            ? "Active"
                            : "Closed"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-zinc-500">
                        Started{" "}
                        {formatDate(loan.startDate)} ·{" "}
                        {loan.daysElapsed} days elapsed
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="rounded-xl bg-zinc-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Interest Rule
                        </p>

                        <p className="mt-1 text-sm font-semibold text-zinc-950">
                          {getInterestRule(
                            Number(loan.interestRate),
                            loan.interestValueType,
                            loan.interestFrequency
                          )}
                        </p>
                      </div>
                      
                      <Link 
                        href={`/loans/${loan.id}`}
                        className="flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                      >
                        View Loan →
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 bg-red-50/50 px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                          Total Outstanding for Loan #{index + 1}
                        </p>
                        <p className="mt-1 text-3xl font-bold tracking-tight text-red-700">
                          {formatCurrency(loan.totalDue)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-red-500/80">
                        Principal Remaining + Interest Remaining
                      </p>
                    </div>
                  </div>

                  <div className="grid divide-y divide-zinc-100 border-t border-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
                    <div className="p-6 sm:px-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Principal Remaining
                      </p>
                      <p className="mt-2 text-xl font-semibold text-zinc-900">
                        {formatCurrency(loan.remainingPrincipal)}
                      </p>
                      <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-400">
                        <div className="flex justify-between">
                          <span>Original</span>
                          <span className="font-medium text-zinc-600">{formatCurrency(loan.originalPrincipal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(loan.principalPaid)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 sm:px-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Interest Remaining
                      </p>
                      <p className="mt-2 text-xl font-semibold text-zinc-900">
                        {formatCurrency(loan.remainingInterest)}
                      </p>
                      <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-400">
                        <div className="flex justify-between">
                          <span>Accrued</span>
                          <span className="font-medium text-zinc-600">{formatCurrency(loan.accruedInterest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(loan.interestPaid)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50/30 p-6 sm:px-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                        Total Paid Towards Loan
                      </p>
                      <p className="mt-2 text-xl font-semibold text-green-700">
                        {formatCurrency(loan.principalPaid + loan.interestPaid)}
                      </p>
                      <p className="mt-3 text-xs text-green-600/70">
                        Principal Paid + Interest Paid
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Payment History
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                All money received from this borrower.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              {borrower.payments.length} payment{borrower.payments.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {borrower.payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-zinc-900">
                  No payments recorded
                </p>
              </div>
            ) : (
              borrower.payments.map((payment) => {
                let principalAllocated = 0;
                let interestAllocated = 0;

                borrower.loans.forEach((loan) => {
                  loan.allocations.forEach((allocation) => {
                    if (allocation.paymentId === payment.id) {
                      principalAllocated += Number(allocation.principalAmount);
                      interestAllocated += Number(allocation.interestAmount);
                    }
                  });
                });

                const paymentAmount = Number(payment.amount);
                const excess = Math.max(0, paymentAmount - principalAllocated - interestAllocated);

                return (
                  <div
                    key={payment.id}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Payment Received
                        </h3>
                        <p className="mt-1 text-sm font-medium text-zinc-900">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-bold tracking-tight text-zinc-900">
                          {formatCurrency(paymentAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="grid divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                      <div className="bg-amber-50/30 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                          Interest Paid
                        </p>
                        <p className="mt-2 text-xl font-medium text-amber-700">
                          {formatCurrency(interestAllocated)}
                        </p>
                      </div>

                      <div className="bg-green-50/30 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                          Principal Paid
                        </p>
                        <p className="mt-2 text-xl font-medium text-green-700">
                          {formatCurrency(principalAllocated)}
                        </p>
                      </div>

                      <div className="bg-zinc-50/50 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                          Excess
                        </p>
                        <p className="mt-2 text-xl font-medium text-zinc-600">
                          {formatCurrency(excess)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}