"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import { calculateEstimatedInterest } from "@/lib/calculations/interest";
import { createBorrowerWithLoan } from "./actions";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function NewBorrowerPage() {
  const [principalAmount, setPrincipalAmount] =
    useState("");

  const [interestRate, setInterestRate] =
    useState("");

  const [interestFrequency, setInterestFrequency] =
    useState<
      "MONTHLY" | "YEARLY" | "CUSTOM_DATE_RANGE"
    >("MONTHLY");

  const [interestValueType, setInterestValueType] =
    useState<"PERCENTAGE" | "RUPEES">("RUPEES");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const calculation = useMemo(() => {
    if (
      !principalAmount ||
      !interestRate ||
      !startDate
    ) {
      return {
        daysElapsed: 0,
        estimatedInterest: 0,
        totalDue: Number(principalAmount) || 0,
      };
    }

    return calculateEstimatedInterest({
      principalAmount: Number(principalAmount),
      interestRate: Number(interestRate),
      interestFrequency,
      interestValueType,
      startDate,
      endDate: endDate || null,
    });
  }, [
    principalAmount,
    interestRate,
    interestFrequency,
    interestValueType,
    startDate,
    endDate,
  ]);

  const interestExplanation =
    interestValueType === "RUPEES"
      ? `₹${interestRate || "0"} interest for every ₹100 principal`
      : `${interestRate || "0"}% interest on the principal`;

  const frequencyExplanation =
    interestFrequency === "MONTHLY"
      ? "This interest is applied monthly."
      : interestFrequency === "YEARLY"
        ? "This interest is applied yearly."
        : "This interest is applied once for the selected custom period.";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-zinc-200 pb-7">
          <Link
            href="/borrowers"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
          >
            ← Back to Borrowers
          </Link>

          <p className="mt-5 text-sm font-medium text-zinc-500">
            New Lending Record
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Add Borrower & Loan
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Add the borrower and configure the loan clearly.
            The estimated interest updates automatically.
          </p>
        </div>

        <form
          action={createBorrowerWithLoan}
          className="mt-8 space-y-6"
        >
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Borrower Information
              </p>

              <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                Who is borrowing the money?
              </h2>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Full Name *
                </span>

                <input
                  name="fullName"
                  required
                  placeholder="Enter borrower name"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />
              </label>

              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Phone Number *
                </span>

                <input
                  name="phone"
                  required
                  type="tel"
                  placeholder="Enter phone number"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-medium text-zinc-700">
                  Address
                </span>

                <input
                  name="address"
                  placeholder="Enter address (optional)"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Loan Information
              </p>

              <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                How should this loan work?
              </h2>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Principal Amount *
                </span>

                <input
                  name="principalAmount"
                  required
                  min="1"
                  type="number"
                  step="0.01"
                  value={principalAmount}
                  onChange={(event) =>
                    setPrincipalAmount(
                      event.target.value
                    )
                  }
                  placeholder="Example: 20000"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />
              </label>

              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Loan Start Date *
                </span>

                <input
                  name="startDate"
                  required
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />
              </label>

              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Interest Frequency *
                </span>

                <select
                  name="interestFrequency"
                  value={interestFrequency}
                  onChange={(event) =>
                    setInterestFrequency(
                      event.target.value as
                        | "MONTHLY"
                        | "YEARLY"
                        | "CUSTOM_DATE_RANGE"
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-zinc-950"
                >
                  <option value="MONTHLY">
                    Monthly
                  </option>

                  <option value="YEARLY">
                    Yearly
                  </option>

                  <option value="CUSTOM_DATE_RANGE">
                    Custom Date Range
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Interest Type *
                </span>

                <select
                  name="interestValueType"
                  value={interestValueType}
                  onChange={(event) =>
                    setInterestValueType(
                      event.target.value as
                        | "PERCENTAGE"
                        | "RUPEES"
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-zinc-950"
                >
                  <option value="RUPEES">
                    Rupees per ₹100
                  </option>

                  <option value="PERCENTAGE">
                    Percentage (%)
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-medium text-zinc-700">
                  Interest Rate *
                </span>

                <input
                  name="interestRate"
                  required
                  min="0"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(event) =>
                    setInterestRate(
                      event.target.value
                    )
                  }
                  placeholder={
                    interestValueType === "RUPEES"
                      ? "Example: 2"
                      : "Example: 2"
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />
              </label>

              <label>
                <span className="text-sm font-medium text-zinc-700">
                  End Date
                </span>

                <input
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none transition focus:border-zinc-950"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Leave empty for an active loan. Interest
                  will calculate until today.
                </p>
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">
                Interest Rule
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                {interestExplanation}
              </p>

              <p className="mt-1 text-sm text-zinc-600">
                {frequencyExplanation}
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-zinc-950 p-6 text-white shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Live Estimate
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                Estimated amount as of today
              </h2>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-zinc-400">
                  Days Elapsed
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {calculation.daysElapsed}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-400">
                  Estimated Interest
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(
                    calculation.estimatedInterest
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-400">
                  Estimated Total Due
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(
                    calculation.totalDue
                  )}
                </p>
              </div>
            </div>

            <p className="mt-6 border-t border-zinc-800 pt-4 text-xs leading-relaxed text-zinc-400">
              This is an automatic estimate based on the
              current date and the interest rule entered
              above.
            </p>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/borrowers"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Create Borrower & Loan
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}