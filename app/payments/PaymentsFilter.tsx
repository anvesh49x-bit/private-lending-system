"use client";

import { useRouter, useSearchParams } from "next/navigation";

type PaymentsFilterProps = {
  searchQuery: string;
  statusFilter: string;
  dateFilter: string;
};

export default function PaymentsFilter({ searchQuery, statusFilter, dateFilter }: PaymentsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string>) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "ALL" || value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/payments${query}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="w-full sm:max-w-xs flex gap-2">
        <input
          type="text"
          placeholder="Search borrower or phone..."
          defaultValue={searchQuery}
          onChange={(e) => {
            // Using a simple debounce approach by pushing to router
            updateParams({ q: e.target.value });
          }}
          className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-950"
        />
      </div>
      
      <div className="flex gap-2">
        <select
          value={dateFilter}
          onChange={(e) => updateParams({ date: e.target.value })}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-950"
        >
          <option value="ALL">All Dates</option>
          <option value="TODAY">Today</option>
          <option value="YESTERDAY">Yesterday</option>
          <option value="OLDER">Older Dates</option>
        </select>
      </div>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-950"
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
    </div>
  );
}
