"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { LoanReminder } from "@/lib/generated/prisma/client";

interface ReminderHistoryProps {
  reminders: LoanReminder[];
}

export default function ReminderHistory({ reminders }: ReminderHistoryProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled reminder?")) return;
    
    setCancellingId(id);
    try {
      const res = await fetch(`/api/reminders/${id}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to cancel reminder");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setCancellingId(null);
    }
  };

  if (reminders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="font-semibold text-zinc-900">No reminders sent yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="divide-y divide-zinc-100">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="p-5 hover:bg-zinc-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                reminder.channel === 'WHATSAPP' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {reminder.channel === 'WHATSAPP' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-zinc-900 text-sm">{reminder.type.replace(/_/g, " ")}</h4>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                    reminder.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    reminder.status === "SENT" ? "bg-green-100 text-green-700" :
                    reminder.status === "FAILED" ? "bg-red-100 text-red-700" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>
                    {reminder.status}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 max-w-md">
                  {reminder.message}
                </p>

                <div className="flex gap-4 mt-2 text-[11px] font-medium text-zinc-400">
                  <span>Scheduled: {format(new Date(reminder.scheduledDate), "dd MMM yyyy, h:mm a")}</span>
                  {reminder.sentAt && (
                    <span>Sent: {format(new Date(reminder.sentAt), "dd MMM yyyy, h:mm a")}</span>
                  )}
                </div>
                {reminder.errorDetails && (
                  <p className="mt-1 text-xs text-red-600">Error: {reminder.errorDetails}</p>
                )}
              </div>
            </div>

            {reminder.status === "PENDING" && (
              <button
                onClick={() => handleCancel(reminder.id)}
                disabled={cancellingId === reminder.id}
                className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 border border-red-200 rounded px-3 py-1.5"
              >
                {cancellingId === reminder.id ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
