import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/services/reminder.service";

// This endpoint should ideally be protected by a cron secret
export async function GET(request: Request) {
  try {
    const result = await processDueReminders();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Cron failed:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
