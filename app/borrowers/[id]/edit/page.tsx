"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/AppShell";

type BorrowerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditBorrowerPage({ params }: BorrowerPageProps) {
  const router = useRouter();
  
  const [id, setId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBorrower() {
      try {
        const resolvedParams = await params;
        setId(resolvedParams.id);

        const response = await fetch(`/api/borrowers/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch borrower");
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to load borrower");
        }

        setFullName(result.data.fullName);
        setPhone(result.data.phone);
        setAddress(result.data.address || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load borrower");
      } finally {
        setLoading(false);
      }
    }
    loadBorrower();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/borrowers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, address }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update borrower");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/borrowers/${id}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update borrower");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl pb-12">
        <div className="mb-8">
          <Link
            href={`/borrowers/${id}`}
            className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
          >
            ← Back to Borrower
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
            Edit Borrower
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Update borrower details below.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Full Name *</span>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Phone Number *</span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Address</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 font-semibold">
                Borrower updated successfully! Redirecting...
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-1 justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href={`/borrowers/${id}`}
                className="flex flex-1 justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
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
