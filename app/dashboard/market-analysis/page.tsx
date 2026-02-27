import DashboardHeader from "@/components/dashboard/header"
import MarketAnalysisClient from "@/components/dashboard/market-analysis-client"

export default function MarketAnalysisPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader title="Market Analysis" subtitle="AI-powered market intelligence for your business" />
      <main className="flex-1 overflow-y-auto p-6">
        <MarketAnalysisClient
          userCity="Kolkata"
          userState="West Bengal"
        />
      </main>
    </div>
  )
}