import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import DashboardHeader from "@/components/dashboard/header"
import SalesAnalysisClient from "@/components/dashboard/sales-analysis-client"

export default async function SalesAnalysisPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const userId = session.id

  // 1. All bills with their items for this user
  const [bills, billItems, products, monthlyRows, topProductRows, categoryRows] = await Promise.all([
    sql`
      SELECT id, bill_number, customer_name, subtotal, gst_amount, total, status, created_at
      FROM public.bills
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `,
    sql`
      SELECT bi.name AS product_name, bi.qty AS quantity, bi.price AS unit_price, bi.amount, b.created_at, b.status
      FROM public.bill_items bi
      JOIN public.bills b ON b.id = bi.bill_id
      WHERE b.user_id = ${userId}
    `,
    sql`
      SELECT name, category, price, stock_qty, cost_price AS cost
      FROM public.products
      WHERE user_id = ${userId}
    `,
    // Monthly revenue (last 6 months)
    sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS month,
        DATE_TRUNC('month', created_at) AS month_date,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) AS revenue,
        COUNT(*) AS bill_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count
      FROM public.bills
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY')
      ORDER BY month_date ASC
    `,
    // Top 5 products by revenue
    sql`
      SELECT bi.name AS product_name, SUM(bi.amount) AS revenue, SUM(bi.qty) AS units_sold
      FROM public.bill_items bi
      JOIN public.bills b ON b.id = bi.bill_id
      WHERE b.user_id = ${userId} AND b.status = 'paid'
      GROUP BY bi.name
      ORDER BY revenue DESC
      LIMIT 5
    `,
    // Revenue by category
    sql`
      SELECT p.category, SUM(bi.amount) AS revenue, SUM(bi.qty) AS units
      FROM public.bill_items bi
      JOIN public.bills b ON b.id = bi.bill_id
      JOIN public.products p ON p.id = bi.product_id AND p.user_id = ${userId}
      WHERE b.user_id = ${userId} AND b.status = 'paid'
      GROUP BY p.category
      ORDER BY revenue DESC
    `,
  ])

  // Compute KPIs
  const totalRevenue = bills.reduce((s, b) => b.status === "paid" ? s + Number(b.total) : s, 0)
  const totalBills = bills.length
  const paidBills = bills.filter((b) => b.status === "paid").length
  const draftBills = bills.filter((b) => b.status === "draft").length
  const cancelledBills = bills.filter((b) => b.status === "cancelled").length
  const avgOrderValue = paidBills > 0 ? totalRevenue / paidBills : 0
  const totalUnits = billItems.reduce((s, i) => i.status === "paid" ? s + Number(i.quantity) : s, 0)
  const totalGst = bills.reduce((s, b) => b.status === "paid" ? s + Number(b.gst_amount) : s, 0)

  const stats = {
    totalRevenue,
    totalBills,
    paidBills,
    draftBills,
    cancelledBills,
    avgOrderValue,
    totalUnits,
    totalGst,
    totalProducts: products.length,
  }

  const monthly = monthlyRows.map((r) => ({
    month: r.month as string,
    revenue: Number(r.revenue),
    billCount: Number(r.bill_count),
    paidCount: Number(r.paid_count),
  }))

  const topProducts = topProductRows.map((r) => ({
    name: r.product_name as string,
    revenue: Number(r.revenue),
    units: Number(r.units_sold),
  }))

  const byCategory = categoryRows.map((r) => ({
    category: (r.category as string) || "Uncategorised",
    revenue: Number(r.revenue),
    units: Number(r.units),
  }))

  // Recent transactions (last 8 bills)
  const recentBills = bills.slice(0, 8).map((b) => ({
    billNumber: b.bill_number as string,
    customer: b.customer_name as string,
    total: Number(b.total),
    status: b.status as string,
    date: new Date(b.created_at as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader
        title="Sales Analysis"
        subtitle="Real-time sales performance, revenue trends & product insights from your actual business data"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <SalesAnalysisClient
          stats={stats}
          monthly={monthly}
          topProducts={topProducts}
          byCategory={byCategory}
          recentBills={recentBills}
        />
      </main>
    </div>
  )
}