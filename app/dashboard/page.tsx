import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import DashboardHeader from "@/components/dashboard/header"
import DashboardOverview from "@/components/dashboard/overview"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const uid = session.id

  // Server-side initial fetch — same queries as the API route for instant first paint
  const [productRows, billRows, analysisRows, profileRows, todayRows, recentBillRows, lowStockRows, monthlyRows] =
    await Promise.all([
      sql`SELECT COUNT(*) as total,
            SUM(CASE WHEN stock_qty <= 5 THEN 1 ELSE 0 END) as low_stock
          FROM public.products WHERE user_id = ${uid}`,
      sql`SELECT total, status, created_at FROM public.bills WHERE user_id = ${uid}`,
      sql`SELECT COUNT(*) as count FROM public.market_analyses WHERE user_id = ${uid}`,
      sql`SELECT business_name, gst_number FROM public.business_profiles WHERE user_id = ${uid} LIMIT 1`,
      sql`SELECT COALESCE(SUM(total), 0) as today_revenue, COUNT(*) as today_bills
          FROM public.bills
          WHERE user_id = ${uid} AND status = 'paid' AND created_at >= CURRENT_DATE`,
      sql`SELECT id, customer_name, total, status, created_at
          FROM public.bills WHERE user_id = ${uid}
          ORDER BY created_at DESC LIMIT 5`,
      sql`SELECT name, stock_qty, unit FROM public.products
          WHERE user_id = ${uid} AND stock_qty <= 5
          ORDER BY stock_qty ASC LIMIT 5`,
      sql`SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0) AS revenue,
            COUNT(*) AS bills
          FROM public.bills
          WHERE user_id = ${uid} AND created_at >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY DATE_TRUNC('month', created_at) ASC`,
    ])

  const paidBills = billRows.filter((b) => b.status === "paid")
  const revenue = paidBills.reduce((s, b) => s + Number(b.total ?? 0), 0)
  const profile = profileRows[0]

  const initialStats = {
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
    businessName: String(profile?.business_name ?? session.business_name ?? "Your Business"),
    displayId: String(session.display_id ?? "RIQ-0000"),
    gstNumber: String(profile?.gst_number ?? ""),
    recentBills: recentBillRows.map((b) => ({
      id: String(b.id),
      customer: String(b.customer_name),
      total: Number(b.total),
      status: String(b.status),
      date: new Date(b.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    })),
    lowStockItems: lowStockRows.map((p) => ({
      name: String(p.name),
      stock: Number(p.stock_qty),
      unit: String(p.unit),
    })),
    monthly: monthlyRows.map((r) => ({
      month: String(r.month),
      revenue: Number(r.revenue),
      bills: Number(r.bills),
    })),
    fetchedAt: new Date().toISOString(),
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader title="Dashboard" subtitle={`Welcome back, ${initialStats.businessName}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <DashboardOverview initialStats={initialStats} />
      </main>
    </div>
  )
}
