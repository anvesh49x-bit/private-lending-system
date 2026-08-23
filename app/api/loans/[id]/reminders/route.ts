import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { MessagingService } from "@/lib/services/messaging.service";
import { ReminderType, ReminderChannel, ReminderStatus } from "@/lib/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const reminders = await prisma.loanReminder.findMany({
      where: { loanId: id },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json({ success: true, data: reminders });
  } catch (error) {
    console.error("Failed to get reminders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, channel, message, scheduledDate } = body as {
      type: ReminderType;
      channel: ReminderChannel;
      message: string;
      scheduledDate?: string;
    };

    if (!type || !channel || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { borrower: true },
    });

    if (!loan) {
      return NextResponse.json(
        { success: false, message: "Loan not found" },
        { status: 404 }
      );
    }

    const isSendNow = !scheduledDate;
    const dateToSchedule = isSendNow ? new Date() : new Date(scheduledDate);

    // Validate future date for scheduled
    if (!isSendNow && dateToSchedule < new Date()) {
      return NextResponse.json(
        { success: false, message: "Scheduled date must be in the future" },
        { status: 400 }
      );
    }

    // Save reminder to DB
    const reminder = await prisma.loanReminder.create({
      data: {
        loanId: id,
        type,
        channel,
        message,
        scheduledDate: dateToSchedule,
        status: isSendNow ? ReminderStatus.PROCESSING : ReminderStatus.PENDING,
      },
    });

    if (isSendNow) {
      // Process it right away
      try {
        const result = await MessagingService.sendMessage(
          channel,
          loan.borrower.phone,
          message
        );

        if (result.success) {
          const updatedReminder = await prisma.loanReminder.update({
            where: { id: reminder.id },
            data: {
              status: ReminderStatus.SENT,
              sentAt: new Date(),
            },
          });
          return NextResponse.json({ success: true, data: updatedReminder });
        } else {
          const updatedReminder = await prisma.loanReminder.update({
            where: { id: reminder.id },
            data: {
              status: ReminderStatus.FAILED,
              errorDetails: result.error,
            },
          });
          return NextResponse.json(
            { success: false, message: "Failed to send message", data: updatedReminder },
            { status: 500 }
          );
        }
      } catch (err: any) {
        const updatedReminder = await prisma.loanReminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.FAILED,
            errorDetails: err.message,
          },
        });
        return NextResponse.json(
          { success: false, message: "Failed to send message", data: updatedReminder },
          { status: 500 }
        );
      }
    }

    // Returning for Schedule for Later
    return NextResponse.json({ success: true, data: reminder });
  } catch (error) {
    console.error("Failed to create reminder:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
