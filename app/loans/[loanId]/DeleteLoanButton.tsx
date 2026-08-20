"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteLoanButtonProps = {
  loanId: string;
  borrowerName: string;
  principalAmount: number;
  hasAllocations: boolean;
};

export default function DeleteLoanButton({
  loanId,
  borrowerName,
  principalAmount,
  hasAllocations,
}: DeleteLoanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  async function handleDelete() {
    if (hasAllocations) {
      setErrorMsg("This loan cannot be deleted because payments have already been recorded against it.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to delete loan.");
        setIsDeleting(false);
      } else {
        router.push("/loans");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("An unexpected error occurred while deleting the loan.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 hover:border-red-300"
      >
        Delete Loan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-zinc-900">Delete Loan?</h2>
            
            <div className="mt-3 text-sm text-zinc-600 space-y-2">
              <p>Are you sure you want to delete this loan?</p>
              <p className="font-semibold text-red-600">This action cannot be undone.</p>
            </div>

            <div className="mt-4 rounded-lg bg-zinc-50 p-4 border border-zinc-100 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500">Borrower:</span>
                <span className="font-semibold text-zinc-900">{borrowerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Principal:</span>
                <span className="font-semibold text-zinc-900">{formatCurrency(principalAmount)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setErrorMsg("");
                }}
                disabled={isDeleting}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || hasAllocations}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition ${
                  hasAllocations || isDeleting
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete Loan"}
              </button>
            </div>
            
            {hasAllocations && !errorMsg && (
              <p className="mt-3 text-xs text-red-600 text-center font-medium">
                Payments have been recorded against this loan. It cannot be deleted.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
