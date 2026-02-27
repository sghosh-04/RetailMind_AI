import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password, business_name, gst_number, business_reg_number, pan_number } = await req.json()

    if (!email || !password || !business_name || !gst_number || !business_reg_number)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    if (!gstRegex.test(gst_number.toUpperCase()))
      return NextResponse.json({ error: "Invalid GST number format (e.g. 22AAAAA0000A1Z5)" }, { status: 400 })

    if (pan_number) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      if (!panRegex.test(pan_number.toUpperCase()))
        return NextResponse.json({ error: "Invalid PAN format (e.g. ABCDE1234F)" }, { status: 400 })
    }

    // Check existing email
    const existing = await sql`SELECT id FROM public.users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`
    if (existing.length > 0)
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const year = new Date().getFullYear()
    const seq = Math.floor(1000 + Math.random() * 9000)
    const display_id = `RIQ-${year}-${seq}`

    // Insert user
    const userRows = await sql`
      INSERT INTO public.users (email, password_hash, display_id)
      VALUES (${email.toLowerCase().trim()}, ${passwordHash}, ${display_id})
      RETURNING id, email, display_id
    `
    const newUser = userRows[0]

    // Insert business profile
    await sql`
      INSERT INTO public.business_profiles (user_id, business_name, gst_number, business_reg_no, pan_number)
      VALUES (
        ${newUser.id},
        ${business_name.trim()},
        ${gst_number.toUpperCase().trim()},
        ${business_reg_number.trim()},
        ${pan_number ? pan_number.toUpperCase().trim() : null}
      )
    `

    // Log them in immediately — no email confirmation needed
    await createSession({
      id: newUser.id,
      email: newUser.email,
      display_id: newUser.display_id,
      business_name: business_name.trim(),
    })

    return NextResponse.json({ success: true, display_id }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error"
    if (msg.includes("unique") || msg.includes("duplicate"))
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
