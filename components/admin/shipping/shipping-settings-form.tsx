"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, AlertCircle, Settings, Save, Info } from "lucide-react"
import type { ShippingSetting } from "@/lib/types/shipping"

export function ShippingSettingsForm() {
  const [settings, setSettings] = useState<ShippingSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volumetricDivisor, setVolumetricDivisor] = useState("4000")
  const { toast } = useToast()

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/shipping/settings")
      if (!response.ok) throw new Error("Erro ao carregar definições")
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
        const divisor = data.data.find((s: ShippingSetting) => s.setting_key === "volumetric_divisor")
        if (divisor) {
          setVolumetricDivisor(divisor.setting_value)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/shipping/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting_key: "volumetric_divisor",
          setting_value: volumetricDivisor,
          description: "Divisor para cálculo de peso volumétrico (cm³/divisor = kg)",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao guardar definições")
      }

      toast({
        title: "Definições guardadas",
        description: "As definições de envio foram atualizadas com sucesso",
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao guardar definições",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={fetchSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Definições de Envio
          </CardTitle>
          <CardDescription>
            Configure os parâmetros gerais do sistema de envio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volumetric-divisor">Divisor Volumétrico</Label>
              <div className="flex gap-4 items-start">
                <div className="w-48">
                  <Input
                    id="volumetric-divisor"
                    type="number"
                    value={volumetricDivisor}
                    onChange={(e) => setVolumetricDivisor(e.target.value)}
                    min="1"
                    max="10000"
                  />
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  <p>
                    O divisor volumétrico é usado para calcular o peso volumétrico:
                  </p>
                  <p className="font-mono bg-muted px-2 py-1 rounded mt-1 inline-block">
                    Peso Volumétrico (kg) = (Comprimento × Largura × Altura em cm) / {volumetricDivisor}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "A guardar..." : "Guardar Definições"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
            <Info className="h-5 w-5" />
            Como Funciona o Peso Volumétrico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-blue-900 dark:text-blue-200">
          <p>
            O peso volumétrico é usado quando o volume de um pacote é grande em relação ao seu peso real.
            As transportadoras cobram pelo maior valor entre o peso real e o peso volumétrico.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <h4 className="font-medium mb-2">Exemplo 1 - Peso Real Maior</h4>
              <ul className="space-y-1 text-xs">
                <li>Caixa: 30×20×10 cm = 6.000 cm³</li>
                <li>Peso volumétrico: 6.000 / {volumetricDivisor} = {(6000 / parseInt(volumetricDivisor || "4000")).toFixed(2)} kg</li>
                <li>Peso real: 5 kg</li>
                <li className="font-medium text-blue-700 dark:text-blue-300">
                  Peso faturado: 5 kg (peso real)
                </li>
              </ul>
            </div>
            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <h4 className="font-medium mb-2">Exemplo 2 - Peso Volumétrico Maior</h4>
              <ul className="space-y-1 text-xs">
                <li>Caixa: 60×40×40 cm = 96.000 cm³</li>
                <li>Peso volumétrico: 96.000 / {volumetricDivisor} = {(96000 / parseInt(volumetricDivisor || "4000")).toFixed(2)} kg</li>
                <li>Peso real: 2 kg</li>
                <li className="font-medium text-blue-700 dark:text-blue-300">
                  Peso faturado: {(96000 / parseInt(volumetricDivisor || "4000")).toFixed(2)} kg (volumétrico)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
