import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import DashboardSidebar from "@/components/dashboard/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const profiles = await sql`
    SELECT bp.business_name, u.display_id
    FROM public.business_profiles bp
    JOIN public.users u ON u.id = bp.user_id
    WHERE bp.user_id = ${session.id} LIMIT 1
  `
  const profile = profiles[0]
  const businessName = profile?.business_name ?? session.email
  const displayId = profile?.display_id ?? session.display_id ?? "RIQ-0000"

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar businessName={businessName} displayId={displayId} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
