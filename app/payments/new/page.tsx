"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

  const [successPaymentId, setSuccessPaymentId] =
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
      !selectedBorrowerId ||
      !borrowers.find((b) => b.id === selectedBorrowerId) ||
      activeLoans.length === 0
    ) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setSelectedLoanId("");
      return;
    }

    const exists = activeLoans.some(
      (loan) =>
        loan.id === selectedLoanId
    );

    if (!exists) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setSuccessPaymentId(result.data.payment.id);
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
      <div className="mx-auto max-w-5xl pb-12">
        {/* Advanced Header */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 text-white shadow-2xl sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          
          <div className="relative z-10">
            <Link
              href={
                borrowerIdFromUrl
                  ? `/borrowers/${borrowerIdFromUrl}`
                  : "/payments"
              }
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {borrowerIdFromUrl ? "Back to Borrower" : "Back to Payments"}
            </Link>

            <div className="mt-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">Payment Management</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
                Record Money Received
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Log a payment securely. Select the borrower and loan, and our system will automatically calculate how the funds are allocated between principal and interest.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 border-dashed bg-zinc-50/50 py-24 text-center">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
             <p className="mt-4 text-sm font-medium text-zinc-600">Loading borrowers...</p>
          </div>
        ) : successPaymentId ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-green-200 bg-green-50/50 py-24 text-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
             </div>
             <h2 className="text-2xl font-bold text-zinc-900">Payment recorded successfully</h2>
             <p className="mt-2 text-zinc-600 max-w-sm">The payment has been received and allocated automatically according to your loan rules.</p>
             <div className="mt-8 flex gap-4">
               <Link href={`/payments/${successPaymentId}`} className="rounded-xl bg-zinc-950 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800">
                 View Receipt
               </Link>
               <Link href={selectedBorrowerId ? `/borrowers/${selectedBorrowerId}` : "/borrowers"} className="rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:border-zinc-300">
                 Back to Borrower
               </Link>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Step 1: Borrower */}
                <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">Choose Borrower</h2>
                        <p className="text-xs font-medium text-zinc-500">Who is making the payment?</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Select Borrower *</span>
                      <div className="relative">
                        <select
                          value={selectedBorrowerId}
                          onChange={(event) => {
                            setSelectedBorrowerId(event.target.value);
                            setPreview(null);
                          }}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 group-hover:border-zinc-300"
                        >
                          <option value="">Select borrower...</option>
                          {borrowers.map((borrower) => (
                            <option key={borrower.id} value={borrower.id}>
                              {borrower.fullName} — {borrower.phone}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>

                {/* Step 2: Loan */}
                <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">Choose Loan</h2>
                        <p className="text-xs font-medium text-zinc-500">Which active loan is this for?</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {!selectedBorrower ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center text-sm text-zinc-500">
                        Please select a borrower above first.
                      </div>
                    ) : activeLoans.length === 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-700">
                        This borrower has no active loans.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeLoans.map((loan, index) => (
                          <label
                            key={loan.id}
                            className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all ${
                              selectedLoanId === loan.id
                                ? "border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500"
                                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                            }`}
                          >
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
                              <div className={`h-3 w-3 rounded-full ${selectedLoanId === loan.id ? "bg-indigo-500" : "bg-transparent"}`} />
                            </div>
                            <input
                              type="radio"
                              name="loan"
                              value={loan.id}
                              checked={selectedLoanId === loan.id}
                              onChange={() => {
                                setSelectedLoanId(loan.id);
                                setPreview(null);
                              }}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className={`font-bold ${selectedLoanId === loan.id ? "text-indigo-900" : "text-zinc-900"}`}>
                                  Loan #{index + 1}
                                </h3>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${selectedLoanId === loan.id ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-600"}`}>
                                  {getInterestRule(loan)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm font-medium text-zinc-500">
                                Original Principal: <span className="text-zinc-700">{formatCurrency(loan.principalAmount)}</span>
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Step 3: Payment Details */}
                    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="border-b border-zinc-100 bg-zinc-50/50 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">Payment Details</h2>
                        <p className="text-xs font-medium text-zinc-500">Enter the exact amount received</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="group block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-700">Amount Received *</span>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <span className="text-zinc-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-8 pr-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                          />
                        </div>
                      </label>

                      <label className="group block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-700">Payment Date *</span>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(event) => setPaymentDate(event.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                        />
                      </label>

                      <label className="group block md:col-span-2">
                        <span className="mb-2 block text-sm font-semibold text-zinc-700">Notes (Optional)</span>
                        <textarea
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          rows={3}
                          placeholder="Add any additional details or reference numbers here..."
                          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                        />
                      </label>
                    </div>
                  </div>
                </section>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4 text-red-700 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                      <h4 className="text-sm font-bold">Error</h4>
                      <p className="mt-1 text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Live Preview */}
              <div className="space-y-6">
                <div className="sticky top-8">
                  <section className="overflow-hidden rounded-3xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/20">
                    <div className="relative p-8">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                          <div className={`h-2 w-2 rounded-full ${calculating ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" : preview ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-zinc-600"}`} />
                          Allocation Preview
                        </div>
                        
                        {calculating ? (
                          <div className="mt-8 flex flex-col items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
                            <p className="mt-4 text-sm font-medium text-zinc-400">Crunching numbers...</p>
                          </div>
                        ) : preview ? (
                          <div className="mt-8 space-y-6">
                            <div>
                              <p className="text-sm font-medium text-zinc-400">Total Received</p>
                              <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatCurrency(preview.paymentAmount)}</p>
                            </div>
                            
                            <div className="h-px w-full bg-white/10" />

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Towards Interest</p>
                                <p className="mt-1 text-xl font-bold text-amber-400">{formatCurrency(preview.interestPaid)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Towards Principal</p>
                                <p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(preview.principalPaid)}</p>
                              </div>
                            </div>

                            {preview.excessAmount > 0 && (
                              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Excess Balance</p>
                                </div>
                                <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(preview.excessAmount)}</p>
                                <p className="mt-1 text-xs text-indigo-200">Automatically saved for future use.</p>
                              </div>
                            )}

                            <div className="h-px w-full bg-white/10" />

                            <div>
                              <p className="text-sm font-medium text-zinc-400">Remaining Balance</p>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-500">Principal</span>
                                  <span className="font-semibold text-white">{formatCurrency(preview.remainingPrincipal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-500">Interest</span>
                                  <span className="font-semibold text-white">{formatCurrency(preview.remainingInterest)}</span>
                                </div>
                              </div>
                              <p className="mt-4 text-3xl font-bold tracking-tight text-white">{formatCurrency(preview.totalRemaining)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 py-12 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            <p className="mt-4 max-w-[200px] text-sm text-zinc-400">
                              Fill out the form details to instantly see how this payment will be allocated.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={submitting || !selectedLoanId || !amount || Number(amount) <= 0}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {submitting ? "Processing Payment..." : "Confirm & Save Payment"}
                      {!submitting && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      )}
                    </button>
                    
                    <Link
                      href={selectedBorrowerId ? `/borrowers/${selectedBorrowerId}` : "/borrowers"}
                      className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      Cancel
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}