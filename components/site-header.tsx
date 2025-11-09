"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { CartIcon } from "@/components/cart-icon"
import { UserMenu } from "@/components/user-menu"
import Image from "next/image"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo-jocril.svg"
              alt="Jocril Acrílicos"
              width={32}
              height={32}
              className="h-8 w-auto dark:invert"
              priority
            />
            <span className="sr-only">Jocril Acrílicos</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link href="/produtos" className="text-sm font-medium transition-colors hover:text-primary">
              Produtos
            </Link>
            <Link href="/categorias" className="text-sm font-medium transition-colors hover:text-primary">
              Categorias
            </Link>
            <Link href="/sobre" className="text-sm font-medium transition-colors hover:text-primary">
              Sobre
            </Link>
            <Link href="/contacto" className="text-sm font-medium transition-colors hover:text-primary">
              Contacto
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden text-[11px] uppercase tracking-wide md:flex">
            LOJA ONLINE
          </Button>
          <ThemeToggle />
          <CartIcon />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
