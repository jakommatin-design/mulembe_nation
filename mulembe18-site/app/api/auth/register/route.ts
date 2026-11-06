import { NextResponse } from "next/server";
import { query, initDatabaseSchema } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";

/* ── helpers ─────────────────────────────────────────────────────── */

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(plain, salt, 100_000, 64, "sha256")
    .toString("hex");
  return `${salt}:${hash}`;
}

function generateMembershipNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `M18-${year}-${rand}`;
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return null;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  return /^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""));
}

/* ── POST /api/auth/register ─────────────────────────────────────── */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      subClan,
      residentialZone,
      county,
      subcounty,
      ward,
      areaId,
      areaName,
      profession,
      clerkId: providedClerkId,
    } = body;

    const resolvedSubcounty = subcounty || residentialZone;

    // ── 1. Validation ─────────────────────────────────────────────
    const errors: Record<string, string> = {};

    if (!fullName || fullName.trim().length < 2)
      errors.fullName = "Full name is required (at least 2 characters).";
    if (!email && !phone)
      errors.contact = "Either email or phone number is required.";
    if (email && !validateEmail(email))
      errors.email = "Please enter a valid email address.";
    if (phone && !validatePhone(phone))
      errors.phone = "Please enter a valid Kenyan phone number (e.g. 0712 345678).";
    if (!subClan) errors.subClan = "Please select your ancestral Luhya sub-community / clan.";
    if (!resolvedSubcounty) errors.subcounty = "Please select your subcounty.";
    if (!ward) errors.ward = "Please select your ward (required dependent on subcounty).";

    // Password validation if not already authenticated via Clerk
    if (!providedClerkId) {
      if (!password) {
        errors.password = "Password is required.";
      } else {
        const pwErr = validatePassword(password);
        if (pwErr) errors.password = pwErr;
      }
      if (password && confirmPassword !== password) {
        errors.confirmPassword = "Passwords do not match.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    await initDatabaseSchema();

    // ── 2. Database Uniqueness checks ─────────────────────────────
    const normalEmail = email ? email.toLowerCase().trim() : null;
    const normalPhone = phone ? phone.replace(/\s/g, "") : null;

    if (normalEmail) {
      const existing = await query<any>(
        "SELECT id, clerk_id FROM members WHERE email = ? LIMIT 1",
        [normalEmail]
      );
      if (existing.length > 0 && !providedClerkId) {
        return NextResponse.json(
          { success: false, errors: { email: "This email is already registered in Mulembe18. Please sign in." } },
          { status: 409 }
        );
      }
    }

    if (normalPhone) {
      const existing = await query<any>(
        "SELECT id FROM members WHERE phone = ? LIMIT 1",
        [normalPhone]
      );
      if (existing.length > 0 && !providedClerkId) {
        return NextResponse.json(
          { success: false, errors: { phone: "This phone number is already registered. Please sign in." } },
          { status: 409 }
        );
      }
    }

    // ── 3. Create Account Directly in Clerk (Approach 1) ──────────
    let finalClerkId: string | null = providedClerkId || null;

    if (!finalClerkId && normalEmail && password) {
      try {
        const client = await clerkClient();
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "Member";
        const lastName = nameParts.slice(1).join(" ") || undefined;

        // Check if user already exists in Clerk
        const existingUsers = await client.users.getUserList({
          emailAddress: [normalEmail],
        });

        if (existingUsers.data && existingUsers.data.length > 0) {
          finalClerkId = existingUsers.data[0].id;
        } else {
          // Derive safe username (required by instance)
          let baseUsername = normalEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 18);
          if (baseUsername.length < 4) baseUsername = `${baseUsername}_m18`;

          let createdUser = null;
          try {
            createdUser = await client.users.createUser({
              emailAddress: [normalEmail],
              username: baseUsername,
              password: password,
              firstName,
              lastName,
            });
          } catch (unameErr: any) {
            // If username is taken, try with unique suffix
            const altUsername = `${baseUsername.slice(0, 14)}_${Math.floor(1000 + Math.random() * 9000)}`;
            createdUser = await client.users.createUser({
              emailAddress: [normalEmail],
              username: altUsername,
              password: password,
              firstName,
              lastName,
            });
          }

          if (createdUser) {
            finalClerkId = createdUser.id;
          }
        }
      } catch (clerkErr: any) {
        console.warn("[Register API] Clerk account creation error:", clerkErr?.message || clerkErr);
        if (clerkErr?.errors?.[0]) {
          const cErr = clerkErr.errors[0];
          const param = cErr.meta?.paramName || "password";
          const msg = cErr.longMessage || cErr.message || "Account creation failed in Clerk.";
          return NextResponse.json(
            { success: false, errors: { [param]: msg } },
            { status: 400 }
          );
        }
      }
    }

    // ── 4. Insert / Update into members table ─────────────────────
    const membershipNo = generateMembershipNo();
    const passwordHash = password ? hashPassword(password) : null;

    if (normalEmail) {
      const existing = await query<any>(
        "SELECT id FROM members WHERE email = ? LIMIT 1",
        [normalEmail]
      );
      if (existing.length > 0) {
        await query(
          `UPDATE members
           SET clerk_id = COALESCE(?, clerk_id),
               full_name = ?,
               phone = COALESCE(?, phone),
               sub_clan = ?,
               residential_zone = ?,
               county = ?,
               subcounty = ?,
               ward = ?,
               area_id = ?,
               area_name = ?,
               profession = ?
           WHERE id = ?`,
          [
            finalClerkId,
            fullName.trim(),
            normalPhone,
            subClan,
            resolvedSubcounty,
            county || "Mombasa",
            resolvedSubcounty,
            ward,
            areaId ? Number(areaId) : null,
            areaName || null,
            profession || "Community Member",
            existing[0].id,
          ]
        );

        return NextResponse.json({
          success: true,
          message: "Profile updated successfully!",
          membershipNo,
        });
      }
    }

    await query(
      `INSERT INTO members
         (clerk_id, full_name, email, phone, sub_clan, residential_zone,
          county, subcounty, ward, area_id, area_name, profession,
          membership_no, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'member', 'Verified')`,
      [
        finalClerkId,
        fullName.trim(),
        normalEmail,
        normalPhone,
        subClan,
        resolvedSubcounty,
        county || "Mombasa",
        resolvedSubcounty,
        ward,
        areaId ? Number(areaId) : null,
        areaName || null,
        profession || "Community Member",
        membershipNo,
        passwordHash,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Registration successful! Welcome to Mulembe18.",
      membershipNo,
    });
  } catch (error: any) {
    console.error("[Register API] Error:", error?.message || error);
    return NextResponse.json(
      { success: false, errors: { form: error?.message || "Registration failed. Please try again." } },
      { status: 500 }
    );
  }
}
