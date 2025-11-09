import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface Breadcrumb {
  label: string
  href: string
}

interface MiniHeroProps {
  title: string
  breadcrumbs?: Breadcrumb[]
}

export function MiniHero({ title, breadcrumbs = [] }: MiniHeroProps) {
  return (
    <section 
      className="relative border-b border-border bg-cover bg-center"
      style={{
        backgroundImage: `url('/hero-background.jpg')`,
        minHeight: '200px',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="container mx-auto px-4 py-8 lg:py-12 relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">{title}</h1>
        
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-white/80">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center gap-1">
                <Link
                  href={breadcrumb.href}
                  className="hover:text-white transition-colors"
                >
                  {breadcrumb.label}
                </Link>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}
