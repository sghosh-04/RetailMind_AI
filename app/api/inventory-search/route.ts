import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim() || ""

    if (!query) {
        // Return all products with their sales totals
        const products = await sql`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.category,
        p.unit,
        p.price,
        p.cost_price,
        p.gst_rate,
        p.stock_qty,
        COALESCE(SUM(bi.qty), 0)::int          AS total_sold,
        COALESCE(SUM(bi.amount), 0)::numeric   AS total_revenue,
        COALESCE(COUNT(DISTINCT bi.bill_id), 0)::int AS bill_count
      FROM public.products p
      LEFT JOIN public.bill_items bi ON bi.product_id = p.id
      WHERE p.user_id = ${session.id}
      GROUP BY p.id
      ORDER BY total_sold DESC
    `
        return NextResponse.json({ products })
    }

    // Search with query
    const products = await sql`
    SELECT
      p.id,
      p.name,
      p.sku,
      p.category,
      p.unit,
      p.price,
      p.cost_price,
      p.gst_rate,
      p.stock_qty,
      COALESCE(SUM(bi.qty), 0)::int          AS total_sold,
      COALESCE(SUM(bi.amount), 0)::numeric   AS total_revenue,
      COALESCE(COUNT(DISTINCT bi.bill_id), 0)::int AS bill_count
    FROM public.products p
    LEFT JOIN public.bill_items bi ON bi.product_id = p.id
    WHERE p.user_id = ${session.id}
      AND (
        p.name ILIKE ${"%" + query + "%"} OR
        p.sku  ILIKE ${"%" + query + "%"} OR
        p.category ILIKE ${"%" + query + "%"}
      )
    GROUP BY p.id
    ORDER BY total_sold DESC
  `

    // For each matched product, also fetch monthly sales breakdown from bills
    const productIds = products.map((p: any) => p.id)
    let monthlySales: any[] = []
    if (productIds.length > 0) {
        monthlySales = await sql`
      SELECT
        bi.product_id,
        TO_CHAR(b.bill_date, 'Mon YYYY') AS month,
        TO_CHAR(b.bill_date, 'YYYY-MM')  AS month_key,
        SUM(bi.qty)::int                 AS qty_sold,
        SUM(bi.amount)::numeric          AS revenue
      FROM public.bill_items bi
      JOIN public.bills b ON b.id = bi.bill_id
      WHERE bi.product_id = ANY(${productIds})
        AND b.user_id = ${session.id}
      GROUP BY bi.product_id, month, month_key
      ORDER BY month_key ASC
    `
    }

    return NextResponse.json({ products, monthlySales })
}
