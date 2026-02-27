import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import DashboardHeader from "@/components/dashboard/header"
import QualityDashboardClient from "@/components/dashboard/quality-dashboard-client"

export default async function QualityDashboardPage() {
    const session = await getSession()
    if (!session) redirect("/login")

    const userId = session.id

    const [billRows, billItemRows, productRows, analysisRows, monthlyQualityRows] = await Promise.all([
        sql`
      SELECT id, status, total, gst_amount, subtotal, created_at
      FROM public.bills
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `,
        sql`
      SELECT bi.id, bi.qty AS quantity, bi.price AS unit_price, bi.amount, b.status
      FROM public.bill_items bi
      JOIN public.bills b ON b.id = bi.bill_id
      WHERE b.user_id = ${userId}
    `,
        sql`
      SELECT id, name, category, price, cost_price AS cost, stock_qty, created_at
      FROM public.products
      WHERE user_id = ${userId}
    `,
        sql`
      SELECT id, query, category, created_at
      FROM public.market_analyses
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `,
        // Monthly bill quality trend (last 6 months)
        sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
        DATE_TRUNC('month', created_at) AS month_date,
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS defects,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS pending
      FROM public.bills
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY')
      ORDER BY month_date ASC
    `,
    ])

    // --- KPI Computations ---
    const totalTasks = billRows.length             // Total bills = total tasks
    const totalSamples = billItemRows.length        // Each line item = a sample
    const defects = billRows.filter((b) => b.status === "cancelled").length  // Cancelled = defect/failure
    const fatalErrors = productRows.filter((p) => Number(p.stock_qty) === 0).length // Out-of-stock = fatal
    const paidBills = billRows.filter((b) => b.status === "paid").length
    const qualityScore = totalTasks > 0
        ? Math.round(((totalTasks - defects - fatalErrors) / totalTasks) * 100)
        : 100

    // Products with margin info (cost vs price)
    const productsWithMargin = productRows.map((p) => {
        const price = Number(p.price)
        const cost = Number(p.cost ?? 0)
        const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null
        return { name: p.name as string, category: p.category as string, price, cost, stock: Number(p.stock_qty), margin }
    }).sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0)).slice(0, 8)

    // Category quality breakdown
    const categoryMap = new Map<string, { tasks: number; defects: number }>()
    for (const a of analysisRows) {
        const cat = (a.category as string) || "General"
        const prev = categoryMap.get(cat) ?? { tasks: 0, defects: 0 }
        categoryMap.set(cat, { tasks: prev.tasks + 1, defects: prev.defects })
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, d]) => ({
        category: cat,
        tasks: d.tasks,
        defects: d.defects,
        score: d.tasks > 0 ? Math.round(((d.tasks - d.defects) / d.tasks) * 100) : 100,
    }))

    // Monthly trend
    const monthly = monthlyQualityRows.map((r) => ({
        month: r.month as string,
        totalTasks: Number(r.total_tasks),
        completed: Number(r.completed),
        defects: Number(r.defects),
        pending: Number(r.pending),
        score: Number(r.total_tasks) > 0
            ? Math.round(((Number(r.total_tasks) - Number(r.defects)) / Number(r.total_tasks)) * 100)
            : 100,
    }))

    // Recent analysis queries as "audit log"
    const recentAnalyses = analysisRows.slice(0, 6).map((a) => ({
        query: a.query as string,
        category: (a.category as string) || "General",
        date: new Date(a.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    }))

    const kpis = { totalTasks, totalSamples, defects, fatalErrors, qualityScore, paidBills }

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <DashboardHeader
                title="Quality Dashboard"
                subtitle="Real-time quality metrics computed from your actual business operations"
            />
            <main className="flex-1 overflow-y-auto p-6">
                <QualityDashboardClient
                    kpis={kpis}
                    monthly={monthly}
                    productsWithMargin={productsWithMargin}
                    categoryBreakdown={categoryBreakdown}
                    recentAnalyses={recentAnalyses}
                    totalProducts={productRows.length}
                    totalAnalyses={analysisRows.length}
                />
            </main>
        </div>
    )
}
