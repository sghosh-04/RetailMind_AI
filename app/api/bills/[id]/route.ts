import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const bills = await sql`
    SELECT b.*, json_agg(bi.*) FILTER (WHERE bi.id IS NOT NULL) AS bill_items
    FROM public.bills b
    LEFT JOIN public.bill_items bi ON bi.bill_id = b.id
    WHERE b.id = ${id} AND b.user_id = ${session.id}
    GROUP BY b.id
    LIMIT 1
  `
  if (!bills.length) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const profiles = await sql`
    SELECT * FROM public.business_profiles WHERE user_id = ${session.id} LIMIT 1
  `
  const profile = profiles[0] ? { ...profiles[0], email: session.email } : null

  return NextResponse.json({ bill: bills[0], items: bills[0].bill_items ?? [], profile })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  if (!["draft", "paid", "cancelled"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  await sql`
    UPDATE public.bills SET status = ${status}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${session.id}
  `
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM public.bills WHERE id = ${id} AND user_id = ${session.id}`
  return NextResponse.json({ success: true })
}
