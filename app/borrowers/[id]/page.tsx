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

  const loanDetails = borrower.loans.map((loan) => {
    const calculation =
      calculateEstimatedInterest({
        principalAmount: Number(
          loan.principalAmount
        ),
        interestRate: Number(loan.interestRate),
        interestFrequency: loan.interestFrequency,
        interestValueType: loan.interestValueType,
        startDate: loan.startDate,
        endDate: loan.endDate,
      });

    return {
      ...loan,
      principalAmount: Number(
        loan.principalAmount
      ),
      interestRate: Number(loan.interestRate),
      ...calculation,
    };
  });

  const activeLoans = loanDetails.filter(
    (loan) => loan.status === "ACTIVE"
  );

  const activePrincipal = activeLoans.reduce(
    (total, loan) =>
      total + loan.principalAmount,
    0
  );

  const interestTillToday = activeLoans.reduce(
    (total, loan) =>
      total + loan.estimatedInterest,
    0
  );

  const totalMoneyReceived =
    borrower.payments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

  const totalDue =
    activePrincipal + interestTillToday;

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
            The most important amounts as of today.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Principal Currently Active
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(activePrincipal)}
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Money currently with borrower
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">
                Interest Till Today
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(interestTillToday)}
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Automatically estimated
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
                Payments recorded so far
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-950 p-6 text-white shadow-sm">
              <p className="text-sm font-medium text-zinc-400">
                Estimated Total Due Today
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {formatCurrency(totalDue)}
              </p>

              <p className="mt-3 text-sm text-zinc-400">
                Principal + accumulated interest
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
                Each loan is calculated automatically up to today.
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

                    <p className="text-sm font-medium text-zinc-600">
                      {getInterestRule(
                        loan.interestRate,
                        loan.interestValueType,
                        loan.interestFrequency
                      )}
                    </p>
                  </div>

                  <div className="grid divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Principal Given
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.principalAmount
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Interest Till Today
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.estimatedInterest
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Total Due Today
                      </p>

                      <p className="mt-3 text-2xl font-semibold text-zinc-950">
                        {formatCurrency(
                          loan.totalDue
                        )}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Interest Rule
                      </p>

                      <p className="mt-3 text-base font-semibold text-zinc-950">
                        {getInterestRule(
                          loan.interestRate,
                          loan.interestValueType,
                          loan.interestFrequency
                        )}
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