"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { calculateEstimatedInterest } from "@/lib/calculations/interest";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type Borrower = {
  id: string;
  fullName: string;
  phone: string;
};

export default function NewLoanForm({ borrowers }: { borrowers: Borrower[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const borrowerIdFromUrl = searchParams.get("borrowerId");
  
  const [borrowerId, setBorrowerId] = useState(borrowerIdFromUrl || (borrowers[0]?.id || ""));
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestFrequency, setInterestFrequency] = useState<"MONTHLY" | "CUSTOM_DATE_RANGE">("MONTHLY");
  const [interestValueType, setInterestValueType] = useState<"PERCENTAGE" | "RUPEES">("RUPEES");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [collectionReminderDate, setCollectionReminderDate] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const calculation = useMemo(() => {
    if (!principalAmount || !interestRate || !startDate) {
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
  }, [principalAmount, interestRate, interestFrequency, interestValueType, startDate, endDate]);

  const interestExplanation =
    interestValueType === "RUPEES"
      ? `₹${interestRate || "0"} interest for every ₹100 principal`
      : `${interestRate || "0"}% interest on the principal`;

  const frequencyExplanation =
    interestFrequency === "MONTHLY"
      ? "This interest is applied monthly (prorated by days)."
      : "This interest is calculated across the entire selected duration (prorated identically to monthly).";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId,
          principalAmount,
          interestFrequency,
          interestValueType,
          interestRate,
          startDate,
          endDate: endDate || null,
          collectionReminderDate: collectionReminderDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create loan");
      }

      router.push(`/loans/${data.loan.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
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
              href={borrowerIdFromUrl ? `/borrowers/${borrowerIdFromUrl}` : "/loans"}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {borrowerIdFromUrl ? "Back to Borrower" : "Back to Loans"}
            </Link>

            <div className="mt-8 max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
                Add New Loan
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Configure a new loan for an existing borrower.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Borrower Info Card */}
              <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">Borrower Selection</h2>
                      <p className="text-xs font-medium text-zinc-500">Who is borrowing the money?</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <label className="group block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700">Select Borrower *</span>
                    <div className="relative">
                      <select
                        name="borrowerId"
                        required
                        value={borrowerId}
                        onChange={(e) => setBorrowerId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 group-hover:border-zinc-300"
                      >
                        {borrowers.length === 0 && <option value="" disabled>No borrowers found. Please add a borrower first.</option>}
                        {borrowers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.fullName} ({b.phone})
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

              {/* Loan Info Card */}
              <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">Loan Configuration</h2>
                      <p className="text-xs font-medium text-zinc-500">How should this loan calculate?</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Principal Amount *</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-zinc-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          name="principalAmount"
                          required
                          min="1"
                          type="number"
                          step="0.01"
                          value={principalAmount}
                          onChange={(e) => setPrincipalAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-8 pr-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                        />
                      </div>
                    </label>

                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Start Date *</span>
                      <input
                        name="startDate"
                        required
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                      />
                    </label>

                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Interest Frequency *</span>
                      <div className="relative">
                        <select
                          name="interestFrequency"
                          value={interestFrequency}
                          onChange={(e) => setInterestFrequency(e.target.value as any)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="CUSTOM_DATE_RANGE">Custom Date Range</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </label>

                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Interest Type *</span>
                      <div className="relative">
                        <select
                          name="interestValueType"
                          value={interestValueType}
                          onChange={(e) => setInterestValueType(e.target.value as any)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                        >
                          <option value="RUPEES">Rupees (per ₹100)</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </label>

                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Interest Rate *</span>
                      <input
                        name="interestRate"
                        required
                        min="0"
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="e.g. 2"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                      />
                    </label>

                    <label className="group block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">End Date {interestFrequency === "CUSTOM_DATE_RANGE" && "*"}</span>
                      <input
                        name="endDate"
                        type="date"
                        required={interestFrequency === "CUSTOM_DATE_RANGE"}
                        min={startDate || undefined}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                      />
                      <p className="mt-2 text-xs text-zinc-500">
                        {interestFrequency === "CUSTOM_DATE_RANGE" 
                          ? "Required for custom date range loans." 
                          : "Leave empty for an active, ongoing loan."}
                      </p>
                    </label>

                    <label className="group block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Collection Reminder Date</span>
                      <input
                        name="collectionReminderDate"
                        type="date"
                        value={collectionReminderDate}
                        onChange={(e) => setCollectionReminderDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 group-hover:border-zinc-300"
                      />
                      <p className="mt-2 text-xs text-zinc-500">
                        Optional. Set a date to remind you to collect money from this borrower.
                      </p>
                    </label>
                  </div>

                  <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                    <div className="flex gap-3">
                      <div className="mt-0.5 text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">Current Rule Summary</p>
                        <p className="mt-1 text-sm text-indigo-700">{interestExplanation}. {frequencyExplanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Estimate & Actions */}
            <div className="space-y-6">
              <div className="sticky top-8">
                <section className="overflow-hidden rounded-3xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/20">
                  <div className="relative p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        Live Estimate
                      </div>
                      
                      <div className="mt-8 space-y-6">
                        <div>
                          <p className="text-sm font-medium text-zinc-400">Days Elapsed</p>
                          <p className="mt-1 text-3xl font-bold tracking-tight">{calculation.daysElapsed}</p>
                        </div>
                        
                        <div className="h-px w-full bg-white/10" />

                        <div>
                          <p className="text-sm font-medium text-zinc-400">Estimated Interest</p>
                          <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-400">{formatCurrency(calculation.estimatedInterest)}</p>
                        </div>
                        
                        <div className="h-px w-full bg-white/10" />

                        <div>
                          <p className="text-sm font-medium text-zinc-400">Total Due as of Today</p>
                          <p className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(calculation.totalDue)}</p>
                        </div>
                      </div>

                      <p className="mt-8 text-xs leading-relaxed text-zinc-500">
                        Automatically calculated based on today&apos;s date and the parameters entered in the form.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !borrowerId}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? "Creating..." : "Create Loan"}
                    {!isSubmitting && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    )}
                  </button>
                  
                  <Link
                    href="/loans"
                    className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300"
                  >
                    Cancel & Return
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
