"use client"

import { usePathname } from "next/navigation"
import { MiniHero } from "@/components/mini-hero"

const pageConfig: Record<string, { title: string; breadcrumbs: Array<{ label: string; href: string }> }> = {
  "/produtos": {
    title: "Produtos",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Produtos", href: "/produtos" },
    ],
  },
  "/categorias": {
    title: "Categorias",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Categorias", href: "/categorias" },
    ],
  },
  "/contacto": {
    title: "Contacto",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  "/carrinho": {
    title: "Carrinho",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Carrinho", href: "/carrinho" },
    ],
  },
  "/checkout": {
    title: "Checkout",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Carrinho", href: "/carrinho" },
      { label: "Checkout", href: "/checkout" },
    ],
  },
  "/conta": {
    title: "Minha Conta",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Minha Conta", href: "/conta" },
    ],
  },
  "/encomendas": {
    title: "Minhas Encomendas",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Minha Conta", href: "/conta" },
      { label: "Encomendas", href: "/encomendas" },
    ],
  },
  "/termos-condicoes": {
    title: "Termos e Condições",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Termos e Condições", href: "/termos-condicoes" },
    ],
  },
  "/faq": {
    title: "Perguntas Frequentes",
    breadcrumbs: [
      { label: "Início", href: "/" },
      { label: "Perguntas Frequentes", href: "/faq" },
    ],
  },
}

const pagesWithoutMiniHero = ["/", "/sobre"]

export function MiniHeroWrapper() {
  const pathname = usePathname()
  const shouldShowMiniHero = !pagesWithoutMiniHero.includes(pathname)

  if (!shouldShowMiniHero) {
    return null
  }

  let config = pageConfig[pathname]

  if (!config) {
    if (pathname.startsWith("/categorias/")) {
      config = {
        title: "Categoria",
        breadcrumbs: [
          { label: "Início", href: "/" },
          { label: "Categorias", href: "/categorias" },
          { label: "Categoria", href: pathname },
        ],
      }
    } else if (pathname.startsWith("/produtos/")) {
      config = {
        title: "Produto",
        breadcrumbs: [
          { label: "Início", href: "/" },
          { label: "Produtos", href: "/produtos" },
          { label: "Produto", href: pathname },
        ],
      }
    }
  }

  if (!config) {
    return null
  }

  return <MiniHero title={config.title} breadcrumbs={config.breadcrumbs} />
}
