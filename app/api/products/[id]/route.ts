import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, sku, category, description, unit, price, cost_price, gst_rate, stock_qty } = await req.json()

  const rows = await sql`
    UPDATE public.products SET
      name = ${name}, sku = ${sku || null}, category = ${category || null},
      description = ${description || null}, unit = ${unit || "pcs"},
      price = ${Number(price)}, cost_price = ${Number(cost_price) || 0},
      gst_rate = ${Number(gst_rate) || 18}, stock_qty = ${Number(stock_qty) || 0},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${session.id}
    RETURNING *
  `
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ product: rows[0] })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM public.products WHERE id = ${id} AND user_id = ${session.id}`
  return NextResponse.json({ success: true })
}
