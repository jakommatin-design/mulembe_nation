import { query } from "./db";

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

export interface DeliveryResult {
  success: boolean;
  status: "Sent" | "Failed" | "Pending";
  error?: string;
  id?: string;
}

/**
 * Normalizes Kenyan phone numbers to international +254 format
 */
export function formatKenyaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+254")) return cleaned;
  if (cleaned.startsWith("254")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
  return cleaned;
}

/**
 * Sends an email notification using Resend (or records queued/simulated status if key is not configured)
 */
export async function sendEmail({ to, subject, html, text }: EmailPayload): Promise<DeliveryResult> {
  const content = text || html?.replace(/<[^>]*>/g, "") || "";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_FROM_EMAIL || "Mulembe18 Kenya <notifications@mulembe18.co.ke>",
          to: [to],
          subject,
          html: html || `<p>${content}</p>`,
          text: content,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        console.log(`[Resend Email] Successfully sent to: ${to} (ID: ${data.id})`);
        return { success: true, status: "Sent", id: data.id };
      } else {
        const errorMsg = data?.message || `HTTP ${res.status}`;
        console.warn(`[Resend Email] Dispatch failed to: ${to} - ${errorMsg}`);
        return { success: false, status: "Failed", error: errorMsg };
      }
    } catch (err: any) {
      console.warn("[Resend Email] Network/Fetch exception:", err?.message || err);
      return { success: false, status: "Failed", error: err?.message || "Network error" };
    }
  }

  // Fallback when RESEND_API_KEY is not yet in .env
  console.log(`[Resend Email Simulated] -> To: ${to} | Subject: "${subject}" | (API Key not set: Marked Pending)`);
  return { success: true, status: "Pending", error: "Simulated: RESEND_API_KEY not configured in .env" };
}

/**
 * Sends an SMS notification using Africa's Talking (or records queued/simulated status if keys not configured)
 */
export async function sendSms({ to, message }: SmsPayload): Promise<DeliveryResult> {
  const formattedPhone = formatKenyaPhone(to);
  const atApiKey = process.env.AFRICASTALKING_API_KEY;
  const atUsername = process.env.AFRICASTALKING_USERNAME;
  const atSenderId = process.env.AFRICASTALKING_SENDER_ID;

  if (atApiKey && atUsername) {
    try {
      const bodyParams = new URLSearchParams({
        username: atUsername,
        to: formattedPhone,
        message,
      });
      if (atSenderId) {
        bodyParams.append("from", atSenderId);
      }

      const res = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          "apiKey": atApiKey,
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: bodyParams,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const recipients = data?.SMSMessageData?.Recipients || [];
        const recipientStatus = recipients[0]?.status;
        const isSuccess = recipientStatus === "Success" || recipientStatus === "Sent" || recipients.length > 0;

        console.log(`[Africa's Talking SMS] Sent to: ${formattedPhone} (Status: ${recipientStatus || "OK"})`);
        return {
          success: isSuccess,
          status: isSuccess ? "Sent" : "Failed",
          error: isSuccess ? undefined : recipientStatus || "Dispatch rejected",
        };
      } else {
        const errorMsg = data?.errorMessage || `HTTP ${res.status}`;
        console.warn(`[Africa's Talking SMS] Failed to: ${formattedPhone} - ${errorMsg}`);
        return { success: false, status: "Failed", error: errorMsg };
      }
    } catch (err: any) {
      console.warn("[Africa's Talking SMS] Network/Fetch exception:", err?.message || err);
      return { success: false, status: "Failed", error: err?.message || "Network error" };
    }
  }

  // Fallback when AFRICASTALKING_API_KEY is not yet in .env
  console.log(`[Africa's Talking SMS Simulated] -> To: ${formattedPhone} | Message: "${message}" | (API Key not set: Marked Pending)`);
  return { success: true, status: "Pending", error: "Simulated: AFRICASTALKING_API_KEY not configured in .env" };
}

/**
 * Convenience helper: sends both Email & SMS welcome notifications upon registration
 */
export async function sendWelcomeNotification(params: {
  name: string;
  email?: string | null;
  phone?: string | null;
  membershipNo: string;
  county: string;
}) {
  const { name, email, phone, membershipNo, county } = params;

  const smsText = `Mulembe18: Welcome ${name}! Your membership is active under ${county} County. Your official Member ID is ${membershipNo}. Mulembe ni Nguvu!`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0D6E38; margin: 0; font-size: 26px;">mulembe<span style="color: #DDA71D;">18</span></h1>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Kenya Community Welfare & Cultural Association</p>
      </div>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h2 style="color: #166534; font-size: 18px; margin: 0 0 8px 0;">Welcome, ${name}!</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.5; margin: 0;">
          Your registration as a verified member of Mulembe18 Kenya has been successfully completed and recorded in the national directory.
        </p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Member ID:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #0D6E38; font-family: monospace;">${membershipNo}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Registered County:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #1f2937;">${county} County</td>
        </tr>
      </table>
      <div style="text-align: center;">
        <a href="https://mulembe18.co.ke/dashboard" style="background-color: #0D6E38; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block;">
          Open Member Portal
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
        © ${new Date().getFullYear()} Mulembe18 Kenya. All Rights Reserved.
      </p>
    </div>
  `;

  await Promise.allSettled([
    phone ? sendSms({ to: phone, message: smsText }) : Promise.resolve(),
    email ? sendEmail({ to: email, subject: "Welcome to Mulembe18 Kenya — Membership Confirmed", html: emailHtml, text: smsText }) : Promise.resolve(),
  ]);
}

/**
 * Convenience helper: sends notification when a leader role is assigned
 */
export async function sendRoleAssignmentNotification(params: {
  name: string;
  email?: string | null;
  phone?: string | null;
  newRole: string;
  jurisdiction?: string | null;
}) {
  const { name, email, phone, newRole, jurisdiction } = params;
  const roleName = newRole.replace(/_/g, " ").toUpperCase();
  const areaText = jurisdiction ? ` (${jurisdiction})` : "";

  const smsText = `Mulembe18: Hello ${name}, you have been appointed as a ${roleName}${areaText} in the Mulembe18 leadership council. Log in to your leadership dashboard to access your tools.`;

  await Promise.allSettled([
    phone ? sendSms({ to: phone, message: smsText }) : Promise.resolve(),
    email
      ? sendEmail({
          to: email,
          subject: `Leadership Appointment: ${roleName} — Mulembe18 Kenya`,
          text: smsText,
          html: `<p>Hello <strong>${name}</strong>,</p><p>You have been formally appointed as <strong>${roleName}${areaText}</strong> in Mulembe18 Kenya.</p><p><a href="https://mulembe18.co.ke/dashboard">Access your leadership dashboard here</a>.</p>`,
        })
      : Promise.resolve(),
  ]);
}
