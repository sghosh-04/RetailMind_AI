import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 })

    const rows = await sql`
      SELECT u.id, u.email, u.password_hash, u.display_id,
             bp.business_name
      FROM public.users u
      LEFT JOIN public.business_profiles bp ON bp.user_id = u.id
      WHERE u.email = ${email.toLowerCase().trim()}
      LIMIT 1
    `
    const user = rows[0]
    if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })

    await createSession({
      id: user.id,
      email: user.email,
      display_id: user.display_id || "RIQ-0000",
      business_name: user.business_name || "Business",
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
