"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { PackageSearch, Wrench, Gauge, Bell, Users } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const NAV_ITEMS = [
  {
    title: "Templates",
    description: "Conteúdo base e taxonomias",
    href: "/admin/products",
    icon: PackageSearch,
  },
  {
    title: "Ferramentas",
    description: "Operações em massa e manutenção",
    href: "/admin/products/tools",
    icon: Wrench,
  },
  {
    title: "Utilizadores",
    description: "Gerir utilizadores e admins",
    href: "/admin/users",
    icon: Users,
  },
]

export interface AdminUserProfile {
  id: string
  email: string | null
  name?: string | null
  avatarUrl?: string | null
}

export function AdminShell({ user, children }: { user: AdminUserProfile; children: React.ReactNode }) {
  const pathname = usePathname()
  const initials =
    (
      user.name
        ?.split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || user.email?.[0]?.toUpperCase()
    )?.slice(0, 2) ?? "AD"

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-muted/40 text-foreground">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <Link href="/admin" className="flex flex-col items-center gap-3 p-4 group-data-[collapsible=icon]:p-2">
              <Image
                src="/jocril.svg"
                alt="Jocril"
                width={80}
                height={80}
                className="h-20 w-20 flex-shrink-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8"
              />
              <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Backoffice</h2>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Gestão</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.description}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 py-2"
                          data-active={pathname.startsWith(item.href)}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/40 p-3">
              <Avatar className="h-9 w-9 flex-shrink-0">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name ?? "Administrador"} />
                ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-1 overflow-hidden min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">{user.name ?? user.email ?? "Administrador"}</p>
                <Badge variant="secondary" className="text-[11px]">
                  Administrador
                </Badge>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 overflow-x-hidden">
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="flex h-14 items-center gap-4 px-6">
              <SidebarTrigger className="hidden lg:flex" />
              <div className="flex flex-1 items-center gap-4">
                <div className="hidden flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:border-foreground/20 lg:flex">
                  <Gauge className="h-4 w-4 text-primary" />
                  Gestão de Produtos
                </div>
                <div className="flex flex-1 items-center gap-2 lg:hidden">
                  <Input type="search" placeholder="Pesquisar em produtos..." className="w-full" />
                </div>
                <Separator orientation="vertical" className="hidden h-6 lg:flex" />
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-primary" />
                  <span className="sr-only">Notificações</span>
                </Button>
              </div>
            </div>
          </header>
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
