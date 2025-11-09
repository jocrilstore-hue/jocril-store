"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

export function ProductToolsDashboard() {
  const { toast } = useToast()
  const [priceMode, setPriceMode] = useState<"percent" | "fixed">("percent")
  const [priceValue, setPriceValue] = useState("5")

  const handleBulkPrice = (event: React.FormEvent) => {
    event.preventDefault()
    toast({
      title: "Atualização agendada",
      description: `Serão aplicados ${priceMode === "percent" ? `${priceValue}%` : `${priceValue}€`} aos preços selecionados.`,
    })
  }

  const handleSeoScan = () => {
    toast({
      title: "Análise SEO concluída",
      description: "Foram identificadas oportunidades de melhoria.",
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Atualização em massa de preços</CardTitle>
          <CardDescription>Recalcule preços por categoria, material ou SKUs específicos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleBulkPrice}>
            <Select defaultValue="category">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                <SelectItem value="category">Por categoria</SelectItem>
                <SelectItem value="material">Por material</SelectItem>
                <SelectItem value="template">Template específico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceMode} onValueChange={(value: "percent" | "fixed") => setPriceMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Variação percentual</SelectItem>
                <SelectItem value="fixed">Variação fixa (€)</SelectItem>
              </SelectContent>
            </Select>
            <Input value={priceValue} onChange={(event) => setPriceValue(event.target.value)} />
            <Button type="submit" className="w-full">
              Prever alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de imagens</CardTitle>
          <CardDescription>Detete problemas comuns antes da publicação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Imagens em falta</p>
              <p className="text-xs text-muted-foreground">8 variações sem fotografia</p>
            </div>
            <Badge variant="destructive">8</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Possível marca d'água</p>
              <p className="text-xs text-muted-foreground">4 ficheiros suspeitos</p>
            </div>
            <Badge variant="outline">4</Badge>
          </div>
          <Button variant="outline" className="w-full">
            Executar nova análise
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist SEO</CardTitle>
          <CardDescription>Sinalize metadados em falta ou duplicados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Cobertura atual</p>
            <Progress value={72} />
          </div>
          <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Checkbox checked disabled />
              <span>Meta descrição definida em 81 templates</span>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox />
              <span>Resolver 12 títulos duplicados</span>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox />
              <span>Adicionar alt text a 23 imagens</span>
            </li>
          </ul>
          <Button className="w-full" onClick={handleSeoScan}>
            Executar checklist
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportação & importação</CardTitle>
          <CardDescription>Troque dados com ERP ou folhas de cálculo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline">Exportar produtos</Button>
            <Button variant="outline">Exportar variações</Button>
            <Button variant="outline">Exportar preços</Button>
            <Button variant="outline">Exportar stock</Button>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Importação rápida</p>
            <Input type="file" className="mt-2" accept=".csv" />
            <Button className="mt-3 w-full" variant="secondary">
              Carregar CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
