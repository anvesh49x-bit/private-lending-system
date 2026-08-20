"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const response = await fetch(`/api/payments/${paymentId}/receipt`);
        if (!response.ok) {
          if (response.status === 404) {
            setError(true);
          } else {
            throw new Error("Failed to load receipt");
          }
        }
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [paymentId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-20 text-sm text-zinc-500">
          Loading receipt...
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-8 pb-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center text-red-700">
            <h1 className="text-2xl font-bold">Payment Not Found</h1>
            <p className="mt-2">The payment receipt you are looking for does not exist.</p>
            <Link href="/payments" className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700">
              Go to Payments
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { payment, loanDetails } = data;

  const totalPrincipalAllocated = payment.allocations.reduce(
    (sum: number, a: any) => sum + Number(a.principalAmount),
    0
  );
  const totalInterestAllocated = payment.allocations.reduce(
    (sum: number, a: any) => sum + Number(a.interestAmount),
    0
  );
  const excess = Math.max(
    0,
    Number(payment.amount) - totalPrincipalAllocated - totalInterestAllocated
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href={`/borrowers/${payment.borrowerId}`}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
          >
            ← Back to Borrower
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-950"
            >
              Print Receipt
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm print:shadow-none print:border-none">
          <div className="border-b border-zinc-100 bg-zinc-50 px-8 py-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              PAYMENT RECEIPT
            </h1>
            <p className="mt-2 text-sm text-zinc-500 font-medium">
              Receipt #{payment.id.split("-")[0].toUpperCase()}
            </p>
          </div>

          <div className="p-8 space-y-10">
            {/* Top Details */}
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Received From
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  {payment.borrower.fullName}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {payment.borrower.phone}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Payment Date
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  {formatDate(payment.paymentDate)}
                </p>
              </div>
            </div>

            {/* Amount Received */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-green-700">
                Amount Received
              </p>
              <p className="mt-2 text-5xl font-bold tracking-tight text-green-800">
                {formatCurrency(Number(payment.amount))}
              </p>
            </div>

            {/* Payment Allocation Summary */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
                Payment Allocation
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-600">Interest Paid</span>
                  <span className="font-bold text-zinc-900">{formatCurrency(totalInterestAllocated)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-600">Principal Paid</span>
                  <span className="font-bold text-zinc-900">{formatCurrency(totalPrincipalAllocated)}</span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-zinc-100">
                  <span className="font-medium text-zinc-600">Excess Saved</span>
                  <span className="font-bold text-zinc-900">{formatCurrency(excess)}</span>
                </div>
              </div>
            </div>

            {/* Loans Affected */}
            {loanDetails.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
                  Loan Details
                </h3>
                <div className="mt-4 space-y-6">
                  {loanDetails.map((detail: any, idx: number) => (
                    <div key={detail.loan.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-zinc-900">Loan #{idx + 1}</span>
                        <span className="text-xs text-zinc-500">Original Principal: {formatCurrency(Number(detail.loan.principalAmount))}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">After This Payment</p>
                          <p className="text-sm text-zinc-600">Principal Remaining</p>
                        </div>
                        <div className="text-right flex items-end justify-end">
                          <p className="text-sm font-bold text-zinc-900">{formatCurrency(detail.outstanding.remainingPrincipal)}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-zinc-600">Interest Remaining</p>
                        </div>
                        <div className="text-right flex items-end justify-end">
                          <p className="text-sm font-bold text-zinc-900">{formatCurrency(detail.outstanding.remainingInterest)}</p>
                        </div>
                        
                        <div className="col-span-2 border-t border-zinc-200 mt-2 pt-3 flex justify-between items-center">
                          <p className="text-sm font-bold text-zinc-800">Total Outstanding</p>
                          <p className="text-lg font-bold text-red-600">{formatCurrency(detail.outstanding.totalRemaining)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {payment.notes && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">
                  Notes
                </h3>
                <p className="mt-3 text-sm text-zinc-600 italic">
                  &quot;{payment.notes}&quot;
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-zinc-50 p-6 text-center text-xs text-zinc-400 print:bg-transparent">
            Generated on {formatDate(new Date())}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
