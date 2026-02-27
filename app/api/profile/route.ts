import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await sql`
    SELECT * FROM public.business_profiles WHERE user_id = ${session.id} LIMIT 1
  `
  const profile = rows[0] ? { ...rows[0], email: session.email } : null
  return NextResponse.json({ profile })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { business_name, gst_number, business_reg_no, pan_number, phone, address, city, state, pincode, logo_url } =
    await req.json()

  const rows = await sql`
    UPDATE public.business_profiles SET
      business_name = ${business_name},
      gst_number = ${gst_number?.toUpperCase() || null},
      business_reg_no = ${business_reg_no || null},
      pan_number = ${pan_number?.toUpperCase() || null},
      phone = ${phone || null},
      address = ${address || null},
      city = ${city || null},
      state = ${state || null},
      pincode = ${pincode || null},
      logo_url = COALESCE(${logo_url || null}, logo_url),
      updated_at = NOW()
    WHERE user_id = ${session.id}
    RETURNING *
  `
  return NextResponse.json({ profile: rows[0] })
}
