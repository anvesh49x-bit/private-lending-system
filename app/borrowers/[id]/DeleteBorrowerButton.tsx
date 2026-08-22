"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteBorrowerButtonProps = {
  borrowerId: string;
  fullName: string;
  phone: string;
  hasLoans: boolean;
  hasPayments: boolean;
  isFullyPaid?: boolean;
};

export default function DeleteBorrowerButton({
  borrowerId,
  fullName,
  phone,
  hasLoans,
  hasPayments,
  isFullyPaid = false,
}: DeleteBorrowerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mistakeConfirmed, setMistakeConfirmed] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!isFullyPaid && !mistakeConfirmed) {
      setErrorMsg("Please confirm that this borrower was created by mistake.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/borrowers/${borrowerId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to delete borrower.");
        setIsDeleting(false);
      } else {
        router.push("/borrowers");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("An unexpected error occurred while deleting the borrower.");
      setIsDeleting(false);
    }
  }

  const isDeleteDisabled = isDeleting || (!isFullyPaid && !mistakeConfirmed);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 hover:border-red-300"
      >
        Delete Borrower
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-zinc-900">Delete Borrower?</h2>
            
            <div className="mt-3 text-sm text-zinc-600 space-y-2">
              <p>Are you sure you want to delete this borrower?</p>
              <p className="font-semibold text-red-600">This action cannot be undone.</p>
              
              {!isFullyPaid && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 mt-2">
                  <p className="font-semibold text-red-700 mb-3">
                    Warning: This borrower has outstanding loans.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mistakeConfirmed}
                      onChange={(e) => setMistakeConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-red-700">
                      I have created this borrower by mistake.
                    </span>
                  </label>
                </div>
              )}

              {(hasLoans || hasPayments) && (
                <p className="font-semibold text-red-600 mt-2">
                  Any loans, payments, and excess balances associated with this borrower will also be permanently deleted.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-zinc-50 p-4 border border-zinc-100 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500">Name:</span>
                <span className="font-semibold text-zinc-900">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone:</span>
                <span className="font-semibold text-zinc-900">{phone}</span>
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
                  setMistakeConfirmed(false);
                }}
                disabled={isDeleting}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleteDisabled}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition ${
                  isDeleteDisabled
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete Borrower"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

