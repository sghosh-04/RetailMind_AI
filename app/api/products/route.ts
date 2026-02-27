import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await sql`
    SELECT * FROM public.products
    WHERE user_id = ${session.id}
    ORDER BY created_at DESC
  `
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, sku, category, description, unit, price, cost_price, gst_rate, stock_qty } = await req.json()
  if (!name || price == null)
    return NextResponse.json({ error: "Name and price are required." }, { status: 400 })

  const rows = await sql`
    INSERT INTO public.products (user_id, name, sku, category, description, unit, price, cost_price, gst_rate, stock_qty)
    VALUES (
      ${session.id}, ${name}, ${sku || null}, ${category || null},
      ${description || null}, ${unit || "pcs"}, ${Number(price)},
      ${Number(cost_price) || 0}, ${Number(gst_rate) || 18}, ${Number(stock_qty) || 0}
    )
    RETURNING *
  `
  return NextResponse.json({ product: rows[0] }, { status: 201 })
}
