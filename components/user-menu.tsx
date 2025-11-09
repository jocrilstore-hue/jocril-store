"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Package, UserCircle, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { userHasAdminAccess, userHasAdminAccessDB } from "@/lib/auth/permissions"

// Cache admin status to avoid repeated DB queries
const adminStatusCache = new Map<string, { isAdmin: boolean; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)

    const checkAdminStatus = async (currentUser: SupabaseUser) => {
      // First check metadata (fast, no DB)
      if (userHasAdminAccess(currentUser)) {
        setIsAdmin(true)
        return
      }

      // Check cache
      const cached = adminStatusCache.get(currentUser.id)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsAdmin(cached.isAdmin)
        return
      }

      // Only query DB if metadata check failed and cache is stale
      try {
        const hasAdminAccessDB = await userHasAdminAccessDB(supabase, currentUser.id)
        adminStatusCache.set(currentUser.id, {
          isAdmin: hasAdminAccessDB,
          timestamp: Date.now()
        })
        setIsAdmin(hasAdminAccessDB)
      } catch {
        setIsAdmin(false)
      }
    }

    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        await checkAdminStatus(currentUser)
      } else {
        setIsAdmin(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await checkAdminStatus(session.user)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Clear cache on logout
    if (user) {
      adminStatusCache.delete(user.id)
    }
    router.push("/")
    router.refresh()
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">Entrar</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/registar">Criar Conta</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Minha Conta</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Área Administrativa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/conta" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/encomendas" className="cursor-pointer">
            <Package className="mr-2 h-4 w-4" />
            Minhas Encomendas
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
