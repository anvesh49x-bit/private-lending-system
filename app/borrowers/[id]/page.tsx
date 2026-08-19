import Link from "next/link";
import { notFound } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { prisma } from "@/lib/db/prisma";
import { calculateEstimatedInterest } from "@/lib/calculations/interest";

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
    const originalPrincipal = Number(
      loan.principalAmount
    );

    const principalPaid = roundMoney(
      loan.allocations.reduce(
        (total, allocation) =>
          total + Number(allocation.principalAmount),
        0
      )
    );

    const interestPaid = roundMoney(
      loan.allocations.reduce(
        (total, allocation) =>
          total + Number(allocation.interestAmount),
        0
      )
    );

    const remainingPrincipal = roundMoney(
      Math.max(
        0,
        originalPrincipal - principalPaid
      )
    );

    /*
     * Calculate interest using the current remaining
     * principal.
     */
    const calculation =
      remainingPrincipal > 0
        ? calculateEstimatedInterest({
            principalAmount: remainingPrincipal,
            interestRate: Number(
              loan.interestRate
            ),
            interestFrequency:
              loan.interestFrequency,
            interestValueType:
              loan.interestValueType,
            startDate: loan.startDate,
            endDate: loan.endDate,
          })
        : {
            estimatedInterest: 0,
            totalDue: 0,
            daysElapsed: 0,
          };

    const accruedInterest = roundMoney(
      calculation.estimatedInterest
    );

    const remainingInterest = roundMoney(
      Math.max(
        0,
        accruedInterest - interestPaid
      )
    );

    const totalDue = roundMoney(
      remainingPrincipal + remainingInterest
    );

    return {
      ...loan,
      originalPrincipal,
      principalPaid,
      remainingPrincipal,
      accruedInterest,
      interestPaid,
      remainingInterest,
      totalDue,
      daysElapsed: calculation.daysElapsed,
      estimatedInterest: accruedInterest,
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

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Principal Remaining
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(activePrincipal)}
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Money still with borrower
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Interest Remaining
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(interestTillToday)}
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Interest due after payments
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Total Money Received
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(totalMoneyReceived)}
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                All payments recorded so far
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-6 text-white shadow-sm">
              <p className="text-sm font-medium text-zinc-400">
                Total Outstanding Today
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {formatCurrency(totalDue)}
              </p>

              <p className="mt-3 text-sm text-zinc-400">
                Remaining principal + remaining interest
              </p>
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
                  </div>

                  <div className="grid divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Original Principal
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.originalPrincipal
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Principal Paid
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-green-700">
                        {formatCurrency(
                          loan.principalPaid
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Principal Remaining
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.remainingPrincipal
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Interest Accrued
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.accruedInterest
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Interest Paid
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-green-700">
                        {formatCurrency(
                          loan.interestPaid
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Interest Remaining
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.remainingInterest
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 bg-zinc-950 px-6 py-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-zinc-400">
                        Total Outstanding Today
                      </p>

                      <p className="text-3xl font-semibold text-white">
                        {formatCurrency(loan.totalDue)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}