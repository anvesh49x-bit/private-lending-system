"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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
  const [interestFrequency, setInterestFrequency] = useState<"MONTHLY" | "CUSTOM_DATE_RANGE">("MONTHLY");
  const [interestValueType, setInterestValueType] = useState<"PERCENTAGE" | "RUPEES">("RUPEES");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [collectionReminderDate, setCollectionReminderDate] = useState("");
  const [hasPayments, setHasPayments] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMode, setReminderMode] = useState<"DEFAULT_DUE_DATE" | "CUSTOM">("DEFAULT_DUE_DATE");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderCustomDate, setReminderCustomDate] = useState("");

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
        if (loan.collectionReminderDate) {
          setCollectionReminderDate(new Date(loan.collectionReminderDate).toISOString().split('T')[0]);
        }

        if (loan.reminder) {
          setReminderEnabled(true);
          setReminderMode(loan.reminder.mode);
          
          const scheduled = new Date(loan.reminder.scheduledDate);
          
          // Format time to HH:mm
          const hours = scheduled.getHours().toString().padStart(2, '0');
          const minutes = scheduled.getMinutes().toString().padStart(2, '0');
          setReminderTime(`${hours}:${minutes}`);

          if (loan.reminder.mode === "CUSTOM") {
            setReminderCustomDate(scheduled.toISOString().split('T')[0]);
          }
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

  const reminderPreview = useMemo(() => {
    if (!reminderEnabled) return null;
    if (reminderMode === "DEFAULT_DUE_DATE" && (!endDate || !reminderTime)) return null;
    if (reminderMode === "CUSTOM" && (!reminderCustomDate || !reminderTime)) return null;

    try {
      const dStr = reminderMode === "DEFAULT_DUE_DATE" ? endDate : reminderCustomDate;
      const baseDate = new Date(dStr);
      if (isNaN(baseDate.getTime())) return null;

      const [hours, minutes] = reminderTime.split(":");
      baseDate.setHours(Number(hours), Number(minutes), 0, 0);
      return format(baseDate, "dd MMM yyyy 'at' hh:mm a");
    } catch {
      return null;
    }
  }, [reminderEnabled, reminderMode, endDate, reminderCustomDate, reminderTime]);

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
          collectionReminderDate: collectionReminderDate || null,
          reminderEnabled,
          reminderMode: reminderEnabled ? reminderMode : undefined,
          reminderTime: reminderEnabled ? reminderTime : undefined,
          reminderCustomDate: reminderEnabled && reminderMode === "CUSTOM" ? reminderCustomDate : undefined,
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
                  <p className="mt-1 text-sm text-blue-600">This loan already has recorded payments. Financial terms are locked to protect payment history and calculations. Only non-financial fields (like End Date and Reminders) can be edited.</p>
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

              <label className="group block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">End Date {interestFrequency === "CUSTOM_DATE_RANGE" && "*"}</span>
                <input
                  type="date"
                  required={interestFrequency === "CUSTOM_DATE_RANGE" || (reminderEnabled && reminderMode === "DEFAULT_DUE_DATE")}
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  {interestFrequency === "CUSTOM_DATE_RANGE"
                    ? "Required for custom date range loans."
                    : "Leave empty for an active, ongoing loan (unless using Default Due Date reminders)."}
                </p>
              </label>

              <label className="group block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Collection Reminder Date</span>
                <input
                  type="date"
                  value={collectionReminderDate}
                  onChange={(e) => setCollectionReminderDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Optional. Set a date to remind you to collect money from this borrower.
                </p>
              </label>
            </div>

            {/* Payment Reminder Section */}
            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50/30">
              <div className="border-b border-zinc-100 bg-zinc-50/50 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Payment Reminder</h2>
                    <p className="text-xs font-medium text-zinc-500">Schedule automatic reminders.</p>
                  </div>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${reminderEnabled ? 'bg-purple-500' : 'bg-zinc-200'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${reminderEnabled ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              {reminderEnabled && (
                <div className="p-8 space-y-6">
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="reminderMode"
                        value="DEFAULT_DUE_DATE"
                        className="peer sr-only"
                        checked={reminderMode === "DEFAULT_DUE_DATE"}
                        onChange={() => setReminderMode("DEFAULT_DUE_DATE")}
                      />
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 peer-checked:border-purple-500 peer-checked:bg-purple-50/50 peer-checked:ring-1 peer-checked:ring-purple-500 transition-all">
                        <p className="font-semibold text-zinc-900">On Loan Due Date</p>
                        <p className="text-xs text-zinc-500 mt-1">Automatically uses the loan&apos;s End Date.</p>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="reminderMode"
                        value="CUSTOM"
                        className="peer sr-only"
                        checked={reminderMode === "CUSTOM"}
                        onChange={() => setReminderMode("CUSTOM")}
                      />
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 hover:bg-zinc-50 peer-checked:border-purple-500 peer-checked:bg-purple-50/50 peer-checked:ring-1 peer-checked:ring-purple-500 transition-all">
                        <p className="font-semibold text-zinc-900">Choose Custom Date & Time</p>
                        <p className="text-xs text-zinc-500 mt-1">Pick an exact future date and time.</p>
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {reminderMode === "CUSTOM" && (
                      <label className="group block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-700">Reminder Date *</span>
                        <input
                          required
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={reminderCustomDate}
                          onChange={(e) => setReminderCustomDate(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
                        />
                      </label>
                    )}
                    
                    <label className="group block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-700">Reminder Time *</span>
                      <input
                        required
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
                      />
                    </label>
                  </div>

                  {reminderPreview && (
                    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                      <p className="text-sm font-medium text-purple-900">
                        Reminder will be sent on: <br/>
                        <span className="font-bold text-lg">{reminderPreview}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
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
