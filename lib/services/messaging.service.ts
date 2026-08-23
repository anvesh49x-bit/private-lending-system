import { LoanReminder, ReminderChannel } from "@/lib/generated/prisma/client";

// This simulates external provider integrations like Twilio or WhatsApp API
// Set to true for MVP Demo so it won't actually charge money or need credentials
const DEMO_MODE = true;

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class MessagingService {
  /**
   * Simulates sending a WhatsApp or SMS message.
   * In production, this would route to a provider like Twilio.
   */
  static async sendMessage(
    channel: ReminderChannel,
    to: string,
    message: string
  ): Promise<SendMessageResult> {
    if (DEMO_MODE) {
      return this.simulateDemoSend(channel, to, message);
    }

    // --- Production Implementation Placeholder ---
    // if (channel === 'WHATSAPP') {
    //   return await twilioClient.messages.create({ ... })
    // } else if (channel === 'SMS') {
    //   return await twilioClient.messages.create({ ... })
    // }
    
    throw new Error("Production messaging not implemented yet.");
  }

  private static async simulateDemoSend(
    channel: ReminderChannel,
    to: string,
    message: string
  ): Promise<SendMessageResult> {
    console.log(`[DEMO ${channel}] Sending message to ${to}:\n${message}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      messageId: `demo_${channel.toLowerCase()}_${Date.now()}`,
    };
  }
}
