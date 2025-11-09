import type React from "react"
import { cn } from "@/lib/utils"

interface AdminPageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function AdminPageHeader({ title, description, actions, className, children }: AdminPageHeaderProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4 rounded-xl border bg-background/80 p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
