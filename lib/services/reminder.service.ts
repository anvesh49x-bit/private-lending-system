import { prisma } from "@/lib/db/prisma";
import twilio from "twilio";

export async function processDueReminders() {
  const now = new Date();

  // 1. Find due reminders that are PENDING
  const dueReminders = await prisma.loanReminder.findMany({
    where: {
      status: "PENDING",
      scheduledDate: {
        lte: now,
      },
    },
    include: {
      loan: {
        include: {
          borrower: true,
        },
      },
    },
  });

  if (dueReminders.length === 0) {
    return { processedCount: 0 };
  }

  // 2. Prevent duplicate sends by updating to PROCESSING atomically
  const reminderIds = dueReminders.map(r => r.id);
  
  await prisma.loanReminder.updateMany({
    where: {
      id: { in: reminderIds },
      status: "PENDING"
    },
    data: {
      status: "PROCESSING"
    }
  });

  // Fetch them again to ensure we only process the ones we successfully locked
  const processingReminders = await prisma.loanReminder.findMany({
    where: {
      id: { in: reminderIds },
      status: "PROCESSING"
    },
    include: {
      loan: {
        include: {
          borrower: true,
        },
      },
    },
  });

  let successCount = 0;
  let failureCount = 0;

  for (const reminder of processingReminders) {
    try {
      // 3. Send the message (mock for now, easily replaced with SMS/WhatsApp provider)
      await sendReminder(reminder);

      // 4 & 5. Update reminder status and record send history
      await prisma.loanReminder.update({
        where: { id: reminder.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error);
      await prisma.loanReminder.update({
        where: { id: reminder.id },
        data: {
          status: "FAILED",
          errorDetails: error instanceof Error ? error.message : "Unknown error",
        },
      });
      failureCount++;
    }
  }

  return { processedCount: processingReminders.length, successCount, failureCount };
}

/**
 * Adapter function to actually send the message using Twilio.
 */
async function sendReminder(reminder: any) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. 'whatsapp:+14155238886'
  const fromSms = process.env.TWILIO_SMS_NUMBER; // e.g. '+1234567890'

  if (!accountSid || !authToken) {
    console.warn("[MOCK SEND] Twilio credentials not found in env. Falling back to mock.");
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[MOCK SEND] Reminder sent to ${reminder.loan.borrower.fullName} at ${reminder.loan.borrower.phone}`);
    return;
  }

  const client = twilio(accountSid, authToken);
  
  // Format the phone number (needs to be E.164 format, e.g., +919876543210)
  // For safety, assuming the phone number might not have the plus prefix
  let toPhone = reminder.loan.borrower.phone.replace(/[^0-9+]/g, '');
  if (!toPhone.startsWith('+')) {
    // Defaulting to India (+91) if no country code is present. 
    // You may want to adjust this based on your user base.
    toPhone = `+91${toPhone}`;
  }

  const messageBody = `Hi ${reminder.loan.borrower.fullName},\n\nThis is a gentle reminder regarding your loan payment. Please ensure your payment is made on time.\n\nThank you!`;

  // Prefer WhatsApp if configured, otherwise fallback to SMS
  if (fromWhatsApp) {
    await client.messages.create({
      body: messageBody,
      from: fromWhatsApp,
      to: `whatsapp:${toPhone}`
    });
    console.log(`[TWILIO] WhatsApp reminder sent to ${toPhone}`);
  } else if (fromSms) {
    await client.messages.create({
      body: messageBody,
      from: fromSms,
      to: toPhone
    });
    console.log(`[TWILIO] SMS reminder sent to ${toPhone}`);
  } else {
    throw new Error("Twilio is configured but no sender number (TWILIO_WHATSAPP_NUMBER or TWILIO_SMS_NUMBER) is provided.");
  }
}
