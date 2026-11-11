import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { query, initDatabaseSchema } from "@/lib/db";
import { sendEmail, sendSms, formatKenyaPhone } from "@/lib/notifications";

interface CallerInfo {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  county: string | null;
  county_leader_county: string | null;
  subcounty_admin_zone: string | null;
  ward_leader_ward: string | null;
  area_leader_area_id: number | null;
  jurisdiction: string;
}

async function getCallerInfo(userId: string | null): Promise<CallerInfo | null> {
  if (!userId) return null;

  let rows = await query<any>(
    `SELECT id, full_name, email, phone, role, county, county_leader_county,
            subcounty_admin_zone, ward_leader_ward, area_leader_area_id
     FROM members WHERE clerk_id = ? LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (email) {
      rows = await query<any>(
        `SELECT id, full_name, email, phone, role, county, county_leader_county,
                subcounty_admin_zone, ward_leader_ward, area_leader_area_id
         FROM members WHERE email = ? LIMIT 1`,
        [email.toLowerCase().trim()]
      );
      if (rows.length > 0) {
        await query("UPDATE members SET clerk_id = ? WHERE id = ?", [userId, rows[0].id]);
      }
    }
  }

  // Check if DB has any super admin
  const adminCountRows = await query<any>("SELECT COUNT(*) AS count FROM members WHERE role = 'super_admin'");
  const superAdminCount = Number(adminCountRows[0]?.count || 0);

  if (rows.length === 0) {
    if (superAdminCount === 0) {
      return {
        id: 0,
        full_name: "Initial Super Admin",
        email: null,
        phone: null,
        role: "super_admin",
        county: "Mombasa",
        county_leader_county: null,
        subcounty_admin_zone: null,
        ward_leader_ward: null,
        area_leader_area_id: null,
        jurisdiction: "All 47 Counties (National)",
      };
    }
    return null;
  }

  const m = rows[0];
  let role = m.role || "member";
  if (superAdminCount === 0) role = "super_admin";

  let jurisdiction = "No Leadership Jurisdiction";
  if (role === "national_leader" || role === "super_admin") {
    jurisdiction = "All 47 Counties (National)";
  } else if (role === "county_leader") {
    jurisdiction = `${m.county_leader_county || m.county || "Mombasa"} County`;
  } else if (role === "subcounty_admin") {
    jurisdiction = `${m.subcounty_admin_zone || "Unassigned"} Sub-County`;
  } else if (role === "ward_leader") {
    jurisdiction = `${m.ward_leader_ward || "Unassigned"} Ward`;
  } else if (role === "area_leader") {
    jurisdiction = `Area #${m.area_leader_area_id || "Unassigned"}`;
  }

  return {
    id: m.id,
    full_name: m.full_name,
    email: m.email,
    phone: m.phone,
    role,
    county: m.county,
    county_leader_county: m.county_leader_county,
    subcounty_admin_zone: m.subcounty_admin_zone,
    ward_leader_ward: m.ward_leader_ward,
    area_leader_area_id: m.area_leader_area_id ? Number(m.area_leader_area_id) : null,
    jurisdiction,
  };
}

/* ── GET /api/dispatch ───────────────────────────────────────────── */
// Returns:
// 1. Recipient members strictly under caller's jurisdiction
// 2. Dispatch logs / history
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
    }

    await initDatabaseSchema();
    const caller = await getCallerInfo(userId);
    if (!caller) {
      return NextResponse.json({ success: false, message: "Member record not found." }, { status: 404 });
    }

    if (caller.role === "member") {
      return NextResponse.json({ success: false, message: "Forbidden: Leadership permissions required to access dispatch." }, { status: 403 });
    }

    // Build scoped query for members under caller's jurisdiction
    let memberSql = `
      SELECT id, full_name, email, phone, county, subcounty, ward, area_id, area_name, role, status
      FROM members
      WHERE status != 'Suspended'
    `;
    const memberParams: any[] = [];

    if (caller.role === "area_leader") {
      if (!caller.area_leader_area_id) {
        return NextResponse.json({ success: true, recipients: [], logs: [], caller, message: "No area assigned." });
      }
      memberSql += " AND area_id = ?";
      memberParams.push(caller.area_leader_area_id);
    } else if (caller.role === "ward_leader") {
      if (!caller.ward_leader_ward) {
        return NextResponse.json({ success: true, recipients: [], logs: [], caller, message: "No ward assigned." });
      }
      memberSql += " AND ward = ?";
      memberParams.push(caller.ward_leader_ward);
    } else if (caller.role === "subcounty_admin") {
      if (!caller.subcounty_admin_zone) {
        return NextResponse.json({ success: true, recipients: [], logs: [], caller, message: "No subcounty assigned." });
      }
      memberSql += " AND (subcounty = ? OR residential_zone = ?)";
      memberParams.push(caller.subcounty_admin_zone, caller.subcounty_admin_zone);
    } else if (caller.role === "county_leader") {
      const county = caller.county_leader_county || caller.county || "Mombasa";
      memberSql += " AND county = ?";
      memberParams.push(county);
    }
    // national_leader & super_admin: all members nationwide

    memberSql += " ORDER BY full_name ASC LIMIT 500";
    const recipients = await query<any>(memberSql, memberParams);

    // Fetch dispatch logs
    let logsSql = `
      SELECT id, batch_id, sender_id, sender_name, sender_role, sender_scope,
             channel, recipient_id, recipient_name, recipient_phone, recipient_email,
             recipient_scope, subject, message, status, error_message, created_at
      FROM dispatch_logs
    `;
    const logParams: any[] = [];

    if (caller.role !== "super_admin" && caller.role !== "national_leader") {
      logsSql += " WHERE sender_id = ?";
      logParams.push(caller.id);
    }

    logsSql += " ORDER BY id DESC LIMIT 100";
    const logs = await query<any>(logsSql, logParams);

    return NextResponse.json({
      success: true,
      recipients,
      logs,
      caller: {
        id: caller.id,
        name: caller.full_name,
        role: caller.role,
        jurisdiction: caller.jurisdiction,
      },
    });
  } catch (error: any) {
    console.error("[Dispatch API GET Error]:", error?.message || error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to load dispatch data." }, { status: 500 });
  }
}

/* ── POST /api/dispatch ──────────────────────────────────────────── */
// Dispatches Email and/or SMS to verified recipients with server-side scope enforcement
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized: Please log in." }, { status: 401 });
    }

    await initDatabaseSchema();
    const caller = await getCallerInfo(userId);
    if (!caller) {
      return NextResponse.json({ success: false, message: "Caller record not found." }, { status: 404 });
    }

    if (caller.role === "member") {
      return NextResponse.json({ success: false, message: "Forbidden: Regular members cannot broadcast dispatches." }, { status: 403 });
    }

    const body = await req.json();
    const {
      channel, // "email" | "sms" | "both"
      targetType = "all_in_scope", // "all_in_scope" | "selected_members"
      selectedMemberIds = [],
      subject,
      message,
    } = body;

    if (!channel || !["email", "sms", "both"].includes(channel)) {
      return NextResponse.json({ success: false, message: "Invalid channel. Must be 'email', 'sms', or 'both'." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, message: "Message body cannot be empty." }, { status: 400 });
    }

    if ((channel === "email" || channel === "both") && (!subject || !subject.trim())) {
      return NextResponse.json({ success: false, message: "Subject is required when dispatching emails." }, { status: 400 });
    }

    // ── Scope Verification & Recipient Retrieval ────────────────────
    let scopeSql = `
      SELECT id, full_name, email, phone, county, subcounty, ward, area_id, area_name
      FROM members
      WHERE status != 'Suspended'
    `;
    const scopeParams: any[] = [];

    if (caller.role === "area_leader") {
      if (!caller.area_leader_area_id) {
        return NextResponse.json({ success: false, message: "Forbidden: You have no assigned area." }, { status: 403 });
      }
      scopeSql += " AND area_id = ?";
      scopeParams.push(caller.area_leader_area_id);
    } else if (caller.role === "ward_leader") {
      if (!caller.ward_leader_ward) {
        return NextResponse.json({ success: false, message: "Forbidden: You have no assigned ward." }, { status: 403 });
      }
      scopeSql += " AND ward = ?";
      scopeParams.push(caller.ward_leader_ward);
    } else if (caller.role === "subcounty_admin") {
      if (!caller.subcounty_admin_zone) {
        return NextResponse.json({ success: false, message: "Forbidden: You have no assigned subcounty." }, { status: 403 });
      }
      scopeSql += " AND (subcounty = ? OR residential_zone = ?)";
      scopeParams.push(caller.subcounty_admin_zone, caller.subcounty_admin_zone);
    } else if (caller.role === "county_leader") {
      const county = caller.county_leader_county || caller.county || "Mombasa";
      scopeSql += " AND county = ?";
      scopeParams.push(county);
    }

    // If specific members were selected, enforce that EVERY submitted ID is inside the sender's scope
    if (targetType === "selected_members" && Array.isArray(selectedMemberIds) && selectedMemberIds.length > 0) {
      const placeholders = selectedMemberIds.map(() => "?").join(", ");
      scopeSql += ` AND id IN (${placeholders})`;
      scopeParams.push(...selectedMemberIds);

      const targetRows = await query<any>(scopeSql, scopeParams);
      if (targetRows.length !== selectedMemberIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Forbidden: Security violation. One or more selected recipients are outside your authorized jurisdiction.",
          },
          { status: 403 }
        );
      }
    }

    const recipients = await query<any>(scopeSql, scopeParams);

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, message: "No active members found within your jurisdiction." }, { status: 400 });
    }

    // ── Dispatch Execution & Per-Recipient Logging ─────────────────
    const batchId = `DISPATCH-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    let sentCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    for (const recipient of recipients) {
      let recipientStatus: "Sent" | "Failed" | "Pending" = "Sent";
      let errorReason: string | undefined = undefined;

      const recipientScope = [recipient.county, recipient.subcounty, recipient.ward, recipient.area_name]
        .filter(Boolean)
        .join(" / ");

      // 1. Send SMS if requested
      if (channel === "sms" || channel === "both") {
        if (!recipient.phone) {
          recipientStatus = "Failed";
          errorReason = "Missing phone number for SMS.";
        } else {
          const smsRes = await sendSms({
            to: recipient.phone,
            message: message.trim(),
          });
          if (smsRes.status === "Failed") {
            recipientStatus = "Failed";
            errorReason = smsRes.error || "SMS dispatch failed";
          } else if (smsRes.status === "Pending") {
            recipientStatus = "Pending";
            errorReason = smsRes.error;
          }
        }
      }

      // 2. Send Email if requested
      if (channel === "email" || channel === "both") {
        if (!recipient.email) {
          if (channel === "email") {
            recipientStatus = "Failed";
            errorReason = "Missing email address for Email dispatch.";
          }
        } else {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0D6E38; margin: 0; font-size: 24px;">mulembe<span style="color: #DDA71D;">18</span></h1>
                <p style="color: #6b7280; font-size: 12px; margin: 2px 0 0 0;">Official Leadership Communiqué — ${caller.jurisdiction}</p>
              </div>
              <div style="background-color: #f9fafb; border-left: 4px solid #0D6E38; padding: 14px 18px; margin-bottom: 20px;">
                <h2 style="color: #111827; font-size: 16px; margin: 0 0 4px 0;">${subject}</h2>
                <p style="color: #6b7280; font-size: 12px; margin: 0;">Dispatched by ${caller.full_name} (${caller.role.replace(/_/g, " ").toUpperCase()})</p>
              </div>
              <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">
                ${message.trim()}
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
                You are receiving this communication as a registered member of Mulembe18 Kenya under ${recipientScope}.
              </p>
            </div>
          `;

          const emailRes = await sendEmail({
            to: recipient.email,
            subject: subject ? subject.trim() : "Mulembe18 Kenya Notification",
            html: emailHtml,
            text: message.trim(),
          });

          if (emailRes.status === "Failed") {
            recipientStatus = "Failed";
            errorReason = errorReason ? `${errorReason}; ${emailRes.error}` : emailRes.error;
          } else if (emailRes.status === "Pending" && recipientStatus !== "Failed") {
            recipientStatus = "Pending";
            errorReason = emailRes.error;
          }
        }
      }

      if (recipientStatus === "Sent") sentCount++;
      else if (recipientStatus === "Failed") failedCount++;
      else pendingCount++;

      // Log into dispatch_logs
      await query(
        `INSERT INTO dispatch_logs (
          batch_id, sender_id, sender_name, sender_role, sender_scope,
          channel, recipient_id, recipient_name, recipient_phone, recipient_email,
          recipient_scope, subject, message, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          batchId,
          caller.id,
          caller.full_name,
          caller.role,
          caller.jurisdiction,
          channel,
          recipient.id,
          recipient.full_name,
          recipient.phone || null,
          recipient.email || null,
          recipientScope,
          subject || null,
          message.trim(),
          recipientStatus,
          errorReason || null,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      batchId,
      totalTargeted: recipients.length,
      sentCount,
      failedCount,
      pendingCount,
      message: `Dispatch processed for ${recipients.length} recipient(s). Sent: ${sentCount}, Pending: ${pendingCount}, Failed: ${failedCount}.`,
    });
  } catch (error: any) {
    console.error("[Dispatch API POST Error]:", error?.message || error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to execute dispatch." }, { status: 500 });
  }
}

