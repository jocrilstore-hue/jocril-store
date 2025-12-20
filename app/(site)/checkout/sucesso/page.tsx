import { Suspense } from "react"
import CheckoutSuccessContent from "./checkout-success-content"

// Force dynamic rendering to prevent prerender errors with useSearchParams
export const dynamic = "force-dynamic"

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-64 mx-auto mb-4 bg-muted animate-pulse rounded" />
          <div className="h-6 w-96 mx-auto mb-8 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
