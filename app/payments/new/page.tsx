"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";

type Loan = {
  id: string;
  principalAmount: number;
  interestRate: number;
  interestFrequency:
    | "MONTHLY"
    | "YEARLY"
    | "CUSTOM_DATE_RANGE";
  interestValueType:
    | "PERCENTAGE"
    | "RUPEES";
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "CLOSED";
};

type Borrower = {
  id: string;
  fullName: string;
  phone: string;
  loans: Loan[];
};

type AllocationPreview = {
  paymentAmount: number;
  interestPaid: number;
  principalPaid: number;
  excessAmount: number;
  remainingPrincipal: number;
  remainingInterest: number;
  totalRemaining: number;
  periodStart: string;
  periodEnd: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInterestRule(loan: Loan) {
  const rate =
    loan.interestValueType === "RUPEES"
      ? `₹${loan.interestRate} per ₹100`
      : `${loan.interestRate}%`;

  const frequency =
    loan.interestFrequency === "MONTHLY"
      ? "per month"
      : loan.interestFrequency === "YEARLY"
        ? "per year"
        : "per custom period";

  return `${rate} ${frequency}`;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const borrowerIdFromUrl =
    searchParams.get("borrowerId");

  const [borrowers, setBorrowers] = useState<
    Borrower[]
  >([]);

  const [selectedBorrowerId, setSelectedBorrowerId] =
    useState(borrowerIdFromUrl || "");

  const [selectedLoanId, setSelectedLoanId] =
    useState("");

  const [amount, setAmount] = useState("");

  const [paymentDate, setPaymentDate] =
    useState(() => {
      const today = new Date();

      const year = today.getFullYear();
      const month = String(
        today.getMonth() + 1
      ).padStart(2, "0");
      const day = String(
        today.getDate()
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    });

  const [notes, setNotes] = useState("");

  const [preview, setPreview] =
    useState<AllocationPreview | null>(null);

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadBorrowers() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/borrowers?includeLoans=true"
        );

        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Request failed (${response.status}): ${text.slice(0, 200)}`
          );
        }

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Expected JSON but received ${contentType}: ${text.slice(0, 200)}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to load borrowers."
          );
        }

        const data: Borrower[] =
          result.data.map(
            (borrower: any) => ({
              id: borrower.id,
              fullName: borrower.fullName,
              phone: borrower.phone,

              loans: (
                borrower.loans || []
              ).map((loan: any) => ({
                id: loan.id,
                principalAmount:
                  Number(
                    loan.principalAmount
                  ),
                interestRate:
                  Number(
                    loan.interestRate
                  ),
                interestFrequency:
                  loan.interestFrequency,
                interestValueType:
                  loan.interestValueType,
                startDate:
                  loan.startDate,
                endDate:
                  loan.endDate,
                status:
                  loan.status,
              })),
            })
          );

        setBorrowers(data);

        const preferredBorrower =
          data.find(
            (borrower) =>
              borrower.id ===
              borrowerIdFromUrl
          );

        if (preferredBorrower) {
          setSelectedBorrowerId(
            preferredBorrower.id
          );

          const firstActiveLoan =
            preferredBorrower.loans.find(
              (loan) =>
                loan.status === "ACTIVE"
            );

          if (firstActiveLoan) {
            setSelectedLoanId(
              firstActiveLoan.id
            );
          }
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load borrowers."
        );
      } finally {
        setLoading(false);
      }
    }

    loadBorrowers();
  }, [borrowerIdFromUrl]);

  const selectedBorrower =
    borrowers.find(
      (borrower) =>
        borrower.id ===
        selectedBorrowerId
    ) || null;

  const activeLoans = useMemo(() => {
    return (
      selectedBorrower?.loans.filter(
        (loan) =>
          loan.status === "ACTIVE"
      ) || []
    );
  }, [selectedBorrower]);

  const selectedLoan =
    activeLoans.find(
      (loan) =>
        loan.id === selectedLoanId
    ) || null;

  useEffect(() => {
    if (
      activeLoans.length === 0
    ) {
      setSelectedLoanId("");
      return;
    }

    const exists = activeLoans.some(
      (loan) =>
        loan.id === selectedLoanId
    );

    if (!exists) {
      setSelectedLoanId(
        activeLoans[0].id
      );
    }
  }, [activeLoans, selectedLoanId]);

  async function calculatePreview() {
    if (
      !selectedLoanId ||
      !amount ||
      Number(amount) <= 0 ||
      !paymentDate
    ) {
      setPreview(null);
      return;
    }

    try {
      setCalculating(true);
      setError("");

      const response = await fetch(
        "/api/payments/preview",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            loanId:
              selectedLoanId,
            amount: Number(amount),
            paymentDate,
          }),
        }
      );

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Request failed (${response.status}): ${text.slice(0, 200)}`
        );
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Expected JSON but received ${contentType}: ${text.slice(0, 200)}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to calculate payment."
        );
      }

      setPreview(result.data);
    } catch (error) {
      setPreview(null);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to calculate payment."
      );
    } finally {
      setCalculating(false);
    }
  }

  useEffect(() => {
    const timer =
      setTimeout(() => {
        calculatePreview();
      }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [
    selectedLoanId,
    amount,
    paymentDate,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!selectedBorrowerId) {
      setError(
        "Please select a borrower."
      );
      return;
    }

    if (!selectedLoanId) {
      setError(
        "Please select an active loan."
      );
      return;
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (!paymentDate) {
      setError(
        "Please select the payment date."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/payments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            borrowerId:
              selectedBorrowerId,
            loanId:
              selectedLoanId,
            amount:
              Number(amount),
            paymentDate,
            notes:
              notes.trim() || null,
          }),
        }
      );

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Request failed (${response.status}): ${text.slice(0, 200)}`
        );
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Expected JSON but received ${contentType}: ${text.slice(0, 200)}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to record payment."
        );
      }

      router.push(
        `/borrowers/${selectedBorrowerId}`
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to record payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={
                selectedBorrowerId
                  ? `/borrowers/${selectedBorrowerId}`
                  : "/borrowers"
              }
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
            >
              ← Back
            </Link>

            <p className="mt-5 text-sm font-medium text-zinc-500">
              Payment Management
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
              Add Money Received
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Record a payment and see exactly how
              it will be applied.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-sm">
            Loading borrowers...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Borrower */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Step 1
              </p>

              <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                Choose Borrower
              </h2>

              <div className="mt-5">
                <label className="text-sm font-medium text-zinc-700">
                  Borrower
                </label>

                <select
                  value={
                    selectedBorrowerId
                  }
                  onChange={(event) => {
                    setSelectedBorrowerId(
                      event.target.value
                    );
                    setPreview(null);
                  }}
                  className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                >
                  <option value="">
                    Select borrower
                  </option>

                  {borrowers.map(
                    (borrower) => (
                      <option
                        key={borrower.id}
                        value={
                          borrower.id
                        }
                      >
                        {borrower.fullName} —{" "}
                        {borrower.phone}
                      </option>
                    )
                  )}
                </select>
              </div>
            </section>

            {/* Loan */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Step 2
              </p>

              <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                Choose Loan
              </h2>

              {!selectedBorrower ? (
                <p className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                  Select a borrower first.
                </p>
              ) : activeLoans.length === 0 ? (
                <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  This borrower has no active loans.
                  Add a new loan before recording a
                  payment.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {activeLoans.map(
                    (loan, index) => (
                      <label
                        key={loan.id}
                        className={`block cursor-pointer rounded-xl border p-4 transition ${
                          selectedLoanId ===
                          loan.id
                            ? "border-zinc-950 bg-zinc-50"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="loan"
                          value={loan.id}
                          checked={
                            selectedLoanId ===
                            loan.id
                          }
                          onChange={() => {
                            setSelectedLoanId(
                              loan.id
                            );
                            setPreview(null);
                          }}
                          className="sr-only"
                        />

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-zinc-950">
                              Loan #{index + 1}
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                              Principal:{" "}
                              {formatCurrency(
                                loan.principalAmount
                              )}
                            </p>
                          </div>

                          <span className="text-sm font-semibold text-zinc-700">
                            {getInterestRule(
                              loan
                            )}
                          </span>
                        </div>
                      </label>
                    )
                  )}
                </div>
              )}
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Step 3
              </p>

              <h2 className="mt-2 text-lg font-semibold text-zinc-950">
                Payment Details
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-zinc-700">
                    Amount Received *
                  </span>

                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-zinc-500">
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                        )
                      }
                      placeholder="Enter amount"
                      className="w-full rounded-xl border border-zinc-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-zinc-950"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-sm font-medium text-zinc-700">
                    Payment Date *
                  </span>

                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) =>
                      setPaymentDate(
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="text-sm font-medium text-zinc-700">
                    Notes
                  </span>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Optional payment note"
                    className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950"
                  />
                </label>
              </div>
            </section>

            {/* Preview */}
            <section className="rounded-2xl bg-zinc-950 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Payment Preview
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                How this payment will be applied
              </h2>

              {calculating ? (
                <p className="mt-6 text-sm text-zinc-400">
                  Calculating...
                </p>
              ) : preview ? (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-sm text-zinc-400">
                      Payment received
                    </span>

                    <span className="font-semibold">
                      {formatCurrency(
                        preview.paymentAmount
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Interest paid
                    </span>

                    <span className="font-semibold text-amber-300">
                      {formatCurrency(
                        preview.interestPaid
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Principal paid
                    </span>

                    <span className="font-semibold text-emerald-300">
                      {formatCurrency(
                        preview.principalPaid
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                    <span className="text-sm text-zinc-400">
                      Remaining principal
                    </span>

                    <span className="text-lg font-semibold">
                      {formatCurrency(
                        preview.remainingPrincipal
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      Remaining interest
                    </span>

                    <span className="font-semibold">
                      {formatCurrency(
                        preview.remainingInterest
                      )}
                    </span>
                  </div>

                  {preview.excessAmount >
                    0 && (
                    <div className="rounded-xl border border-blue-900 bg-blue-950/50 px-4 py-3">
                      <p className="text-sm text-blue-200">
                        Excess payment
                      </p>

                      <p className="mt-1 text-lg font-semibold text-white">
                        {formatCurrency(
                          preview.excessAmount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-blue-300">
                        This amount will be kept as
                        available excess balance.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        Total remaining
                      </span>

                      <span className="text-xl font-bold">
                        {formatCurrency(
                          preview.totalRemaining
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-zinc-400">
                  Select a borrower and loan, then enter
                  the payment amount to see the allocation.
                </p>
              )}
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                href={
                  selectedBorrowerId
                    ? `/borrowers/${selectedBorrowerId}`
                    : "/borrowers"
                }
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedLoanId ||
                  !amount ||
                  Number(amount) <= 0
                }
                className="rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Recording Payment..."
                  : "Confirm Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}