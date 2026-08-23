import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { parse, set } from "date-fns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      borrowerId,
      principalAmount,
      interestFrequency,
      interestValueType,
      interestRate,
      startDate,
      endDate,
      collectionReminderDate, // Keep for backward compatibility if needed, though we rely on new system
      reminderEnabled,
      reminderMode,
      reminderTime,
      reminderCustomDate,
    } = body;

    if (!borrowerId) {
      return NextResponse.json({ error: "Borrower ID is required" }, { status: 400 });
    }

    if (!principalAmount || Number(principalAmount) <= 0) {
      return NextResponse.json({ error: "Principal amount must be greater than 0" }, { status: 400 });
    }

    if (!interestRate || Number(interestRate) < 0) {
      return NextResponse.json({ error: "Valid interest rate is required" }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 });
    }

    if (interestFrequency === "CUSTOM_DATE_RANGE" && !endDate) {
      return NextResponse.json({ error: "End date is required for custom date range loans" }, { status: 400 });
    }

    let scheduledDate: Date | null = null;
    if (reminderEnabled) {
      if (!reminderTime) {
        return NextResponse.json({ error: "Reminder time is required when reminder is enabled" }, { status: 400 });
      }
      
      const timeParsed = parse(reminderTime, "HH:mm", new Date());
      
      if (reminderMode === "DEFAULT_DUE_DATE") {
        if (!endDate) {
           return NextResponse.json({ error: "End date/Due date is required for default due date reminder" }, { status: 400 });
        }
        const baseDate = new Date(endDate);
        scheduledDate = set(baseDate, { hours: timeParsed.getHours(), minutes: timeParsed.getMinutes(), seconds: 0, milliseconds: 0 });
      } else if (reminderMode === "CUSTOM") {
        if (!reminderCustomDate) {
          return NextResponse.json({ error: "Custom reminder date is required" }, { status: 400 });
        }
        const baseDate = new Date(reminderCustomDate);
        scheduledDate = set(baseDate, { hours: timeParsed.getHours(), minutes: timeParsed.getMinutes(), seconds: 0, milliseconds: 0 });
      } else {
        return NextResponse.json({ error: "Invalid reminder mode" }, { status: 400 });
      }

      if (scheduledDate < new Date()) {
        return NextResponse.json({ error: "Scheduled reminder date/time cannot be in the past" }, { status: 400 });
      }
    }

    const loan = await prisma.loan.create({
      data: {
        borrowerId,
        principalAmount: Number(principalAmount),
        interestFrequency,
        interestValueType,
        interestRate: Number(interestRate),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        collectionReminderDate: collectionReminderDate ? new Date(collectionReminderDate) : null,
        ...(reminderEnabled && scheduledDate && {
          reminders: {
            create: {
              mode: reminderMode,
              type: "CUSTOM",
              channel: "WHATSAPP", // Defaulting to WHATSAPP for legacy
              scheduledDate: scheduledDate,
              status: "PENDING",
            }
          }
        })
      },
      include: {
        reminders: true
      }
    });

    return NextResponse.json({ success: true, loan }, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Failed to create loan" },
      { status: 500 }
    );
  }
}
