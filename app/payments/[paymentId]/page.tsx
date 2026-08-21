"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
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
    hour: "2-digit",
    minute: "2-digit"
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
        <div className="flex justify-center items-center py-40">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-8 pb-12">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-700">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <h1 className="text-2xl font-bold">Payment Not Found</h1>
            <p className="mt-2 text-red-600/80">The payment receipt you are looking for does not exist or has been removed.</p>
            <Link href="/payments" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 shadow-lg shadow-red-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
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
      <div className="mx-auto max-w-4xl pb-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            href={`/borrowers/${payment.borrowerId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 bg-white border border-zinc-200 rounded-xl px-4 py-2 hover:bg-zinc-50 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back to Borrower
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2 text-sm font-bold text-zinc-900 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Print Receipt
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-200/40 print:shadow-none print:border-none print:rounded-none">
          
          {/* Decorative Top Pattern */}
          <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500"></div>

          {/* Header */}
          <div className="bg-zinc-950 px-10 pt-16 pb-12 text-white relative overflow-hidden">
             {/* Background elements */}
             <div className="absolute -top-24 -right-10 opacity-[0.03] transform rotate-12">
               <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
             </div>
             <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div>
                   <div className="flex items-center gap-3 mb-6">
                      <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/5">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-100"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                      </div>
                      <span className="font-bold tracking-[0.2em] uppercase text-xs text-zinc-400">Private Lending</span>
                   </div>
                   <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
                      OFFICIAL RECEIPT
                   </h1>
                   <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mt-2">
                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                     <p className="text-sm text-zinc-300 font-medium font-mono">
                        #{payment.id.split("-")[0].toUpperCase()}
                     </p>
                   </div>
                </div>
                
                <div className="flex items-center justify-start md:justify-end shrink-0">
                   {/* PAID STAMP */}
                   <div className="inline-flex items-center justify-center border-4 border-emerald-500/80 text-emerald-400 rounded-xl px-6 py-2 text-3xl font-black tracking-widest uppercase transform rotate-[-5deg] shadow-[0_0_20px_rgba(16,185,129,0.2)] print:shadow-none print:border-emerald-600 print:text-emerald-600 print:opacity-100">
                     PAID
                   </div>
                </div>
             </div>
          </div>

          <div className="p-10 md:p-12 space-y-12">
              
              {/* Info Section */}
              <div className="grid sm:grid-cols-2 gap-8 md:gap-12">
                 <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Received From</p>
                    <p className="text-2xl font-black text-zinc-900">{payment.borrower.fullName}</p>
                    <p className="text-sm font-medium text-zinc-500">{payment.borrower.phone}</p>
                 </div>
                 <div className="space-y-2 sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Date & Time</p>
                    <p className="text-xl font-bold text-zinc-900">{formatDate(payment.paymentDate)}</p>
                    <p className="text-sm font-medium text-zinc-500">Record ID: {payment.id.split("-")[1]}</p>
                 </div>
              </div>

              {/* Amount Box */}
              <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 p-10 text-white shadow-xl shadow-zinc-900/10">
                 <div className="absolute -right-8 -top-12 opacity-[0.05]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
                 
                 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                       <p className="text-sm font-bold uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-2">
                         Amount Received
                       </p>
                       <p className="mt-3 text-5xl md:text-7xl font-black tracking-tighter text-white">
                         {formatCurrency(Number(payment.amount))}
                       </p>
                    </div>
                    <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                 </div>
              </div>

              {/* Layout for Allocations and Loans */}
              <div className="grid lg:grid-cols-12 gap-12">
                  
                  {/* Allocation Details */}
                  <div className="lg:col-span-5 space-y-8">
                      <div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-6 flex items-center gap-3">
                             <span className="h-px w-8 bg-zinc-200"></span> Allocation
                          </h3>
                          <div className="rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 space-y-5">
                             <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-medium text-sm">Interest Paid</span>
                                <span className="text-lg font-bold text-zinc-900">{formatCurrency(totalInterestAllocated)}</span>
                             </div>
                             <div className="h-px w-full bg-zinc-200/50"></div>
                             <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-medium text-sm">Principal Paid</span>
                                <span className="text-lg font-bold text-zinc-900">{formatCurrency(totalPrincipalAllocated)}</span>
                             </div>
                             
                             {excess > 0 && (
                               <>
                                 <div className="h-px w-full bg-zinc-200/50"></div>
                                 <div className="flex justify-between items-center bg-indigo-50 -mx-3 px-3 py-2 rounded-xl">
                                    <span className="text-indigo-600 font-bold text-sm">Excess Saved</span>
                                    <span className="text-lg font-black text-indigo-700">{formatCurrency(excess)}</span>
                                 </div>
                               </>
                             )}
                          </div>
                      </div>

                      {payment.notes && (
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-4 flex items-center gap-3">
                             <span className="h-px w-8 bg-zinc-200"></span> Notes
                          </h3>
                          <div className="rounded-2xl bg-amber-50/50 border border-amber-100 p-5">
                             <p className="text-sm text-amber-900/80 italic leading-relaxed">
                               &quot;{payment.notes}&quot;
                             </p>
                          </div>
                        </div>
                      )}
                  </div>
                  
                  {/* Affected Loans */}
                  <div className="lg:col-span-7">
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-6 flex items-center gap-3">
                         <span className="h-px w-8 bg-zinc-200"></span> Loan Balances
                      </h3>
                      
                      {loanDetails.length === 0 ? (
                         <p className="text-sm text-zinc-500 italic">No active loans affected.</p>
                      ) : (
                         <div className="space-y-4">
                           {loanDetails.map((detail: any, idx: number) => (
                             <div key={detail.loan.id} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                               <div className="flex justify-between items-center mb-6">
                                 <div className="flex items-center gap-3">
                                   <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 font-bold text-sm">
                                     {idx + 1}
                                   </div>
                                   <div>
                                     <span className="text-sm font-bold text-zinc-900 block">Loan Account</span>
                                     <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">ID: {detail.loan.id.split("-")[0]}</span>
                                   </div>
                                 </div>
                                 <div className="text-right">
                                   <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Original Principal</span>
                                   <span className="text-sm font-semibold text-zinc-700">{formatCurrency(Number(detail.loan.principalAmount))}</span>
                                 </div>
                               </div>
                               
                               <div className="rounded-2xl bg-zinc-50 p-5">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 text-center">Remaining Balances</p>
                                 <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                   <div className="space-y-1">
                                     <p className="text-xs font-medium text-zinc-500">Principal</p>
                                     <p className="text-base font-bold text-zinc-900">{formatCurrency(detail.outstanding.remainingPrincipal)}</p>
                                   </div>
                                   <div className="space-y-1 text-right">
                                     <p className="text-xs font-medium text-zinc-500">Interest</p>
                                     <p className="text-base font-bold text-zinc-900">{formatCurrency(detail.outstanding.remainingInterest)}</p>
                                   </div>
                                   <div className="col-span-2 h-px bg-zinc-200/60 my-1"></div>
                                   <div className="col-span-2 flex justify-between items-end">
                                     <p className="text-sm font-bold text-zinc-800">Total Outstanding</p>
                                     <p className="text-xl font-black text-rose-600">{formatCurrency(detail.outstanding.totalRemaining)}</p>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                      )}
                  </div>
              </div>
          </div>
          
          {/* Footer */}
          <div className="bg-zinc-50 px-10 py-6 border-t border-zinc-100 flex justify-between items-center print:bg-transparent">
             <div className="flex items-center gap-2 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                <span className="text-xs font-medium">Securely recorded in Ledger</span>
             </div>
             <p className="text-xs font-medium text-zinc-400">
                Generated on {formatDate(new Date())}
             </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
