"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";

type EditLoanPageProps = {
  params: Promise<{
    loanId: string;
  }>;
};

export default function EditLoanPage({ params }: EditLoanPageProps) {
  const router = useRouter();
  
  const [loanId, setLoanId] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestFrequency, setInterestFrequency] = useState<"MONTHLY" | "YEARLY" | "CUSTOM_DATE_RANGE">("MONTHLY");
  const [interestValueType, setInterestValueType] = useState<"PERCENTAGE" | "RUPEES">("RUPEES");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasPayments, setHasPayments] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadLoan() {
      try {
        const resolvedParams = await params;
        setLoanId(resolvedParams.loanId);

        const response = await fetch(`/api/loans/${resolvedParams.loanId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch loan");
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to load loan");
        }

        const loan = result.data;
        setPrincipalAmount(loan.principalAmount.toString());
        setInterestRate(loan.interestRate.toString());
        setInterestFrequency(loan.interestFrequency);
        setInterestValueType(loan.interestValueType);
        
        // Format dates for input type="date"
        if (loan.startDate) {
          setStartDate(new Date(loan.startDate).toISOString().split('T')[0]);
        }
        if (loan.endDate) {
          setEndDate(new Date(loan.endDate).toISOString().split('T')[0]);
        }

        setHasPayments(loan.allocations && loan.allocations.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load loan");
      } finally {
        setLoading(false);
      }
    }
    loadLoan();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principalAmount,
          interestRate,
          interestFrequency,
          interestValueType,
          startDate,
          endDate: endDate || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update loan");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/loans/${loanId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update loan");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl pb-12">
        <div className="mb-8">
          <Link
            href={`/loans/${loanId}`}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
          >
            ← Back to Loan Details
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
            Edit Loan
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Modify the terms of this loan.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            
            {hasPayments && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 flex items-start gap-4 text-blue-700 shadow-sm mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <div>
                  <h4 className="text-sm font-bold">Financial Terms Locked</h4>
                  <p className="mt-1 text-sm text-blue-600">This loan already has recorded payments. Financial terms are locked to protect payment history and calculations. Only non-financial fields (like End Date) can be edited.</p>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <label className="group block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Principal Amount *</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-zinc-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    required
                    min="1"
                    type="number"
                    step="0.01"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    disabled={hasPayments}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-8 pr-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </label>

              <label className="group block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Start Date *</span>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={hasPayments}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </label>

              <label className="group block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Interest Frequency *</span>
                <select
                  value={interestFrequency}
                  onChange={(e) => setInterestFrequency(e.target.value as any)}
                  disabled={hasPayments}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="CUSTOM_DATE_RANGE">Custom Date Range</option>
                </select>
              </label>

              <label className="group block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Interest Type *</span>
                <select
                  value={interestValueType}
                  onChange={(e) => setInterestValueType(e.target.value as any)}
                  disabled={hasPayments}
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="RUPEES">Rupees (per ₹100)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </label>

              <label className="group block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Interest Rate *</span>
                <input
                  required
                  min="0"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  disabled={hasPayments}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </label>

              <label className="group block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">End Date (Optional)</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs text-zinc-500">Leave empty for an active, ongoing loan.</p>
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mt-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 mt-4 font-semibold">
                Loan updated successfully! Redirecting...
              </div>
            )}

            <div className="flex gap-4 pt-6 mt-6 border-t border-zinc-100">
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-1 justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href={`/loans/${loanId}`}
                className="flex flex-1 justify-center items-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
