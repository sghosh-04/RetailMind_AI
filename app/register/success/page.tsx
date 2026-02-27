import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060d1f] text-white">
          Loading...
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}