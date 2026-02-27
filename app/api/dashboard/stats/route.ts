import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const uid = session.id

        const [
            productRows,
            billRows,
            analysisRows,
            profileRows,
            todayRows,
            recentBillRows,
            lowStockRows,
            monthlyRows,
        ] = await Promise.all([
            // Total products + low stock
            sql`SELECT COUNT(*) as total,
            SUM(CASE WHEN stock_qty <= 5 THEN 1 ELSE 0 END) as low_stock
          FROM public.products WHERE user_id = ${uid}`,

            // All bills: revenue, counts
            sql`SELECT total, status, created_at FROM public.bills WHERE user_id = ${uid}`,

            // Market analyses count
            sql`SELECT COUNT(*) as count FROM public.market_analyses WHERE user_id = ${uid}`,

            // Business profile
            sql`SELECT business_name, gst_number FROM public.business_profiles WHERE user_id = ${uid} LIMIT 1`,

            // Today's revenue (paid bills created today)
            sql`SELECT COALESCE(SUM(total), 0) as today_revenue, COUNT(*) as today_bills
          FROM public.bills
          WHERE user_id = ${uid}
            AND status = 'paid'
            AND created_at >= CURRENT_DATE`,

            // Most recent 5 bills
            sql`SELECT id, customer_name, total, status, created_at
          FROM public.bills WHERE user_id = ${uid}
          ORDER BY created_at DESC LIMIT 5`,

            // Low stock products
            sql`SELECT name, stock_qty, unit FROM public.products
          WHERE user_id = ${uid} AND stock_qty <= 5
          ORDER BY stock_qty ASC LIMIT 5`,

            // Monthly revenue trend (last 6 months)
            sql`SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS revenue,
            COUNT(*) AS bills
          FROM public.bills
          WHERE user_id = ${uid}
            AND created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY DATE_TRUNC('month', created_at) ASC`,
        ])

        const paidBills = billRows.filter((b) => b.status === "paid")
        const revenue = paidBills.reduce((s, b) => s + Number(b.total ?? 0), 0)
        const profile = profileRows[0]

        return NextResponse.json({
            products: Number(productRows[0]?.total ?? 0),
            lowStock: Number(productRows[0]?.low_stock ?? 0),
            paidBills: paidBills.length,
            draftBills: billRows.filter((b) => b.status === "draft").length,
            cancelledBills: billRows.filter((b) => b.status === "cancelled").length,
            totalBills: billRows.length,
            revenue,
            analyses: Number(analysisRows[0]?.count ?? 0),
            todayRevenue: Number(todayRows[0]?.today_revenue ?? 0),
            todayBills: Number(todayRows[0]?.today_bills ?? 0),
            businessName: profile?.business_name ?? session.business_name ?? "Your Business",
            displayId: session.display_id ?? "RIQ-0000",
            gstNumber: profile?.gst_number ?? "",
            recentBills: recentBillRows.map((b) => ({
                id: b.id,
                customer: b.customer_name,
                total: Number(b.total),
                status: b.status,
                date: new Date(b.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            })),
            lowStockItems: lowStockRows.map((p) => ({
                name: p.name,
                stock: Number(p.stock_qty),
                unit: p.unit,
            })),
            monthly: monthlyRows.map((r) => ({
                month: r.month,
                revenue: Number(r.revenue),
                bills: Number(r.bills),
            })),
            fetchedAt: new Date().toISOString(),
        })
    } catch (err) {
        console.error("[GET /api/dashboard/stats]", err)
        return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
    }
}
