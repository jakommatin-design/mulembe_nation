import { NextResponse } from "next/server";
import { query, initDatabaseSchema } from "@/lib/db";
import crypto from "crypto";

/* ── helpers ─────────────────────────────────────────────────────── */

function hashPassword(plain: string): string {
  // PBKDF2 – no extra deps, available in Node.js built-in crypto
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
  // Allow Kenyan formats: 07xx, 01xx, +2547xx, 2547xx
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
      profession,
    } = body;

    // ── 1. Required-field validation ──────────────────────────────
    const errors: Record<string, string> = {};

    if (!fullName || fullName.trim().length < 2)
      errors.fullName = "Full name is required (at least 2 characters).";
    if (!email && !phone)
      errors.contact = "Either email or phone number is required.";
    if (email && !validateEmail(email))
      errors.email = "Please enter a valid email address.";
    if (phone && !validatePhone(phone))
      errors.phone = "Please enter a valid Kenyan phone number (e.g. 0712 345678).";
    if (!subClan) errors.subClan = "Please select your sub-clan / subcounty.";
    if (!residentialZone) errors.residentialZone = "Please select your residential zone.";
    if (!password) errors.password = "Password is required.";
    else {
      const pwErr = validatePassword(password);
      if (pwErr) errors.password = pwErr;
    }
    if (password && confirmPassword !== password)
      errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    await initDatabaseSchema();

    // ── 2. Uniqueness checks ──────────────────────────────────────
    if (email) {
      const existing = await query<any>(
        "SELECT id FROM members WHERE email = ? LIMIT 1",
        [email.toLowerCase().trim()]
      );
      if (existing.length > 0)
        return NextResponse.json(
          { success: false, errors: { email: "This email is already registered. Please sign in." } },
          { status: 409 }
        );
    }

    if (phone) {
      const normalPhone = phone.replace(/\s/g, "");
      const existing = await query<any>(
        "SELECT id FROM members WHERE phone = ? LIMIT 1",
        [normalPhone]
      );
      if (existing.length > 0)
        return NextResponse.json(
          { success: false, errors: { phone: "This phone number is already registered. Please sign in." } },
          { status: 409 }
        );
    }

    // ── 3. Create member ──────────────────────────────────────────
    const membershipNo = generateMembershipNo();
    const passwordHash = hashPassword(password);
    const normalPhone = phone ? phone.replace(/\s/g, "") : null;

    await query(
      `INSERT INTO members
         (full_name, email, phone, sub_clan, residential_zone, profession,
          membership_no, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'member', 'Verified')`,
      [
        fullName.trim(),
        email ? email.toLowerCase().trim() : null,
        normalPhone,
        subClan,
        residentialZone,
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

