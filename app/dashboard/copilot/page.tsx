import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard/header"
import CopilotChat from "@/components/dashboard/copilot-chat"

export default async function CopilotPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardHeader title="AI Copilot" subtitle="Your intelligent retail business assistant" />
      <main className="flex-1 overflow-hidden p-6">
        <CopilotChat />
      </main>
    </div>
  )
}
