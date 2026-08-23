"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ReminderType, ReminderChannel } from "@/lib/generated/prisma/client";

interface LoanData {
  id: string;
  borrowerName: string;
  borrowerPhone: string;
  principal: number;
  calculatedInterest: number;
  totalPayable: number;
  amountPaid: number;
  outstandingAmount: number;
  endDate: string | null;
}

interface SendReminderModalProps {
  loan: LoanData;
}

export default function SendReminderModal({ loan }: SendReminderModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ReminderType>("PAYMENT_DUE");
  const [channel, setChannel] = useState<ReminderChannel>("WHATSAPP");
  const [timing, setTiming] = useState<"NOW" | "LATER">("NOW");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const generatedMessage = (() => {
    if (type === "CUSTOM" && customMessage) return customMessage;
    
    let msg = `Hi ${loan.borrowerName} 👋\n\n`;
    if (type === "PAYMENT_DUE") {
      msg += `This is a reminder regarding your loan payment.\n\n`;
    } else if (type === "LOAN_END_DATE") {
      msg += `This is a reminder that your loan is approaching its end date.\n\n`;
    } else {
      msg += `This is a reminder regarding your loan.\n\n`;
    }

    msg += `Loan Amount: ${formatCurrency(loan.principal)}\n`;
    msg += `Total Payable: ${formatCurrency(loan.totalPayable)}\n`;
    msg += `Amount Paid: ${formatCurrency(loan.amountPaid)}\n`;
    msg += `Outstanding Amount: ${formatCurrency(loan.outstandingAmount)}\n`;
    
    if (loan.endDate) {
      msg += `Loan End Date: ${format(new Date(loan.endDate), "dd MMM yyyy")}\n`;
    }
    
    msg += `\nPlease make the payment on or before the due date.\n\nThank you.`;
    return msg;
  })();

  const handleSend = async () => {
    if (timing === "LATER" && (!scheduledDate || !scheduledTime)) {
      setFeedback({ message: "Please select both date and time", type: "error" });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      let combinedDate = undefined;
      if (timing === "LATER") {
        combinedDate = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const res = await fetch(`/api/loans/${loan.id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          channel,
          message: generatedMessage,
          scheduledDate: combinedDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ 
          message: timing === "NOW" ? `Reminder sent successfully via ${channel}` : `Reminder scheduled successfully`,
          type: "success"
        });
        setTimeout(() => {
          setIsOpen(false);
          setFeedback(null);
          router.refresh();
        }, 2000);
      } else {
        setFeedback({ message: data.message || "Failed to send reminder", type: "error" });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Something went wrong", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-zinc-950 bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        Send Reminder
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">
            
            {/* Form Section */}
            <div className="p-6 md:w-1/2 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-zinc-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">Send Reminder</h2>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Reminder Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ReminderType)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="PAYMENT_DUE">Payment Due Reminder</option>
                  <option value="LOAN_END_DATE">Loan End Date Reminder</option>
                  <option value="CUSTOM">Custom Reminder</option>
                </select>
              </div>

              {type === "CUSTOM" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Custom Message</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    placeholder="Type your custom message..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Delivery Channel</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="channel"
                      value="WHATSAPP"
                      checked={channel === "WHATSAPP"}
                      onChange={() => setChannel("WHATSAPP")}
                      className="text-zinc-950 focus:ring-zinc-950"
                    />
                    <span className="text-sm text-zinc-900">WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="channel"
                      value="SMS"
                      checked={channel === "SMS"}
                      onChange={() => setChannel("SMS")}
                      className="text-zinc-950 focus:ring-zinc-950"
                    />
                    <span className="text-sm text-zinc-900">SMS</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Sending Time</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="timing"
                      value="NOW"
                      checked={timing === "NOW"}
                      onChange={() => setTiming("NOW")}
                      className="text-zinc-950 focus:ring-zinc-950"
                    />
                    <span className="text-sm text-zinc-900">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="timing"
                      value="LATER"
                      checked={timing === "LATER"}
                      onChange={() => setTiming("LATER")}
                      className="text-zinc-950 focus:ring-zinc-950"
                    />
                    <span className="text-sm text-zinc-900">Schedule for Later</span>
                  </label>
                </div>

                {timing === "LATER" && (
                  <div className="flex gap-3 items-center">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
                    />
                    <span className="text-xs text-zinc-500">Asia/Kolkata</span>
                  </div>
                )}
              </div>

              {feedback && (
                <div className={`p-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {feedback.message}
                </div>
              )}

              <div className="mt-auto flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="rounded-xl bg-zinc-950 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-70 flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Sending...
                    </>
                  ) : timing === "NOW" ? "Send Now" : "Schedule Reminder"}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="p-6 md:w-1/2 bg-zinc-50 flex flex-col items-center border-t md:border-t-0 md:border-l border-zinc-200">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 w-full text-center">
                Message Preview
              </h3>

              {/* Mobile Phone Mockup */}
              <div className="w-[300px] h-[600px] bg-white rounded-[3rem] border-8 border-zinc-900 p-4 shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-6 bg-zinc-900 rounded-b-3xl mx-auto w-1/2"></div>
                
                {/* Chat Header */}
                <div className={`mt-4 pb-3 border-b flex items-center gap-3 ${channel === 'WHATSAPP' ? 'border-green-100' : 'border-zinc-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${channel === 'WHATSAPP' ? 'bg-green-500' : 'bg-blue-500'}`}>
                    <span className="font-bold">{loan.borrowerName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">{loan.borrowerName}</p>
                    <p className="text-[10px] text-zinc-500">{loan.borrowerPhone} • {channel}</p>
                  </div>
                </div>

                {/* Chat Body */}
                <div className={`flex-1 mt-4 p-3 rounded-2xl relative whitespace-pre-wrap text-sm shadow-sm ${channel === 'WHATSAPP' ? 'bg-[#E1FDD7] text-[#054D40]' : 'bg-blue-500 text-white'}`}>
                  {generatedMessage}
                  
                  <div className="text-[10px] opacity-70 text-right mt-2">
                    {format(new Date(), "h:mm a")}
                  </div>
                  {/* Tail */}
                  <div className={`absolute top-0 -left-2 w-4 h-4 ${channel === 'WHATSAPP' ? 'bg-[#E1FDD7]' : 'bg-blue-500'}`} style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
