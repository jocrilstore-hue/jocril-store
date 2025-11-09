import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verifique o seu email</CardTitle>
            <CardDescription>Enviámos um link de confirmação para o seu email</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Por favor, clique no link que enviámos para o seu email para confirmar a sua conta e começar a fazer
              encomendas.
            </p>
            <Link href="/auth/login" className="text-sm text-primary underline underline-offset-4">
              Voltar ao login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
