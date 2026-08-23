import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ReminderStatus } from "@/lib/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const reminder = await prisma.loanReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, message: "Reminder not found" },
        { status: 404 }
      );
    }

    if (reminder.status !== ReminderStatus.PENDING) {
      return NextResponse.json(
        { success: false, message: "Only pending reminders can be cancelled" },
        { status: 400 }
      );
    }

    const updatedReminder = await prisma.loanReminder.update({
      where: { id },
      data: {
        status: ReminderStatus.CANCELLED,
      },
    });

    return NextResponse.json({ success: true, data: updatedReminder });
  } catch (error) {
    console.error("Failed to cancel reminder:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel reminder" },
      { status: 500 }
    );
  }
}
