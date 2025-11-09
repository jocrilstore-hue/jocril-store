import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <Image
                src="/logo-jocril.svg"
                alt="Jocril Acrílicos"
                width={24}
                height={24}
                className="h-6 w-auto dark:invert"
              />
              <span className="sr-only">Jocril Acrílicos</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Soluções profissionais em acrílico para o seu negócio desde 1995.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Produtos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/produtos" className="hover:text-foreground">
                  Todos os Produtos
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="hover:text-foreground">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/produtos?bestseller=true" className="hover:text-foreground">
                  Mais Vendidos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sobre" className="hover:text-foreground">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link href="/termos-condicoes" className="hover:text-foreground">
                  Termos e Condições
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Contacto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(+351) 21 471 89 03</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>geral@jocril.pt</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Massamá, Portugal</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Jocril Acrílicos. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
