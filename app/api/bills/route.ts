import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const bills = await sql`
    SELECT b.*, json_agg(bi.*) FILTER (WHERE bi.id IS NOT NULL) AS bill_items
    FROM public.bills b
    LEFT JOIN public.bill_items bi ON bi.bill_id = b.id
    WHERE b.user_id = ${session.id}
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `
  return NextResponse.json({ bills })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { customer_name, customer_email, customer_phone, customer_address, customer_gst, notes, bill_date, items } =
      await req.json()

    if (!customer_name || !items?.length)
      return NextResponse.json({ error: "Customer name and at least one item required" }, { status: 400 })

    let subtotal = 0
    let gst_amount = 0
    const processedItems = items.map((item: { qty: number; price: number; gst_rate?: number; product_id?: string; name: string; unit?: string }) => {
      const lineTotal = item.qty * item.price
      const lineGst = (lineTotal * (item.gst_rate ?? 18)) / 100
      subtotal += lineTotal
      gst_amount += lineGst
      return { ...item, gst_amount: lineGst, amount: lineTotal + lineGst }
    })
    const total = subtotal + gst_amount

    const billRows = await sql`
      INSERT INTO public.bills (user_id, customer_name, customer_email, customer_phone, customer_address, customer_gst, subtotal, gst_amount, total, notes, bill_date, status)
      VALUES (
        ${session.id}, ${customer_name}, ${customer_email || null}, ${customer_phone || null},
        ${customer_address || null}, ${customer_gst || null}, ${subtotal}, ${gst_amount}, ${total},
        ${notes || null}, ${bill_date || new Date().toISOString().split("T")[0]}, 'draft'
      )
      RETURNING *
    `
    const bill = billRows[0]

    for (const item of processedItems) {
      await sql`
        INSERT INTO public.bill_items
          (bill_id, product_id, name, unit, qty, price, gst_rate, gst_amount, amount,
           product_name, quantity, unit_price)
        VALUES (
          ${bill.id}, ${item.product_id || null}, ${item.name}, ${item.unit || "pcs"},
          ${item.qty}, ${item.price}, ${item.gst_rate ?? 18}, ${item.gst_amount}, ${item.amount},
          ${item.name}, ${Math.ceil(item.qty)}, ${item.price}
        )
      `
    }

    return NextResponse.json({ bill }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/bills]", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

