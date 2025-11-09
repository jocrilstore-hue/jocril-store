import type React from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { MiniHeroWrapper } from "@/components/mini-hero-wrapper"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="min-h-[calc(100vh-10rem)]">
        <MiniHeroWrapper />
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
