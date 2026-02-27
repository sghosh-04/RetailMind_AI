import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { products } = body as {
        products: Array<{
            name: string
            sku?: string
            category?: string
            description?: string
            unit?: string
            price: number
            cost_price?: number
            gst_rate?: number
            stock_qty?: number
        }>
    }

    if (!Array.isArray(products) || products.length === 0)
        return NextResponse.json({ error: "No products provided" }, { status: 400 })

    const results: Array<{ name: string; status: "inserted" | "skipped" | "error"; reason?: string }> = []

    // Get existing SKUs for this user to detect duplicates
    const existingRows = await sql`
    SELECT sku FROM public.products WHERE user_id = ${session.id} AND sku IS NOT NULL
  `
    const existingSkus = new Set(existingRows.map((r: any) => r.sku?.toLowerCase()))

    for (const p of products) {
        try {
            if (!p.name?.trim() || p.price == null || isNaN(Number(p.price))) {
                results.push({ name: p.name || "(unnamed)", status: "skipped", reason: "Missing name or price" })
                continue
            }

            const skuNorm = p.sku?.trim()?.toLowerCase()
            if (skuNorm && existingSkus.has(skuNorm)) {
                results.push({ name: p.name, status: "skipped", reason: `SKU "${p.sku}" already exists` })
                continue
            }

            await sql`
        INSERT INTO public.products (user_id, name, sku, category, description, unit, price, cost_price, gst_rate, stock_qty)
        VALUES (
          ${session.id},
          ${p.name.trim()},
          ${p.sku?.trim() || null},
          ${p.category?.trim() || null},
          ${p.description?.trim() || null},
          ${p.unit?.trim() || "pcs"},
          ${Number(p.price)},
          ${Number(p.cost_price) || 0},
          ${Number(p.gst_rate) ?? 18},
          ${Number(p.stock_qty) || 0}
        )
      `
            if (skuNorm) existingSkus.add(skuNorm)
            results.push({ name: p.name, status: "inserted" })
        } catch (err: any) {
            results.push({ name: p.name || "(unnamed)", status: "error", reason: err?.message || "DB error" })
        }
    }

    const inserted = results.filter((r) => r.status === "inserted").length
    const skipped = results.filter((r) => r.status === "skipped").length
    const errors = results.filter((r) => r.status === "error").length

    return NextResponse.json({ results, summary: { inserted, skipped, errors } }, { status: 200 })
}
