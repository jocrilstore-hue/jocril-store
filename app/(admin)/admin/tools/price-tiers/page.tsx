"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Save, RefreshCw } from "lucide-react";

interface DiscountTier {
  id: number;
  min_value: number;
  discount_pct: number;
}

const DEFAULT_TIERS: DiscountTier[] = [
  { id: 1, min_value: 200, discount_pct: 0.5 },
  { id: 2, min_value: 400, discount_pct: 1.0 },
  { id: 3, min_value: 800, discount_pct: 1.5 },
  { id: 4, min_value: 1000, discount_pct: 3.0 },
];

export default function PriceTiersPage() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<DiscountTier[]>(DEFAULT_TIERS);
  const [isApplying, setIsApplying] = useState(false);
  const [stats, setStats] = useState<{
    variants: number;
    tiers: number;
  } | null>(null);

  const addTier = () => {
    const maxId = Math.max(...tiers.map((t) => t.id), 0);
    const lastTier = tiers[tiers.length - 1];
    setTiers([
      ...tiers,
      {
        id: maxId + 1,
        min_value: lastTier ? lastTier.min_value + 200 : 200,
        discount_pct: lastTier ? lastTier.discount_pct + 0.5 : 0.5,
      },
    ]);
  };

  const removeTier = (id: number) => {
    if (tiers.length <= 1) {
      toast({
        title: "Erro",
        description: "Deve existir pelo menos um escalão de desconto.",
        variant: "destructive",
      });
      return;
    }
    setTiers(tiers.filter((t) => t.id !== id));
  };

  const updateTier = (
    id: number,
    field: "min_value" | "discount_pct",
    value: number
  ) => {
    setTiers(
      tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const validateTiers = (): string | null => {
    // Check for valid values
    for (const tier of tiers) {
      if (tier.min_value <= 0) {
        return "O valor mínimo deve ser maior que 0.";
      }
      if (tier.discount_pct <= 0 || tier.discount_pct > 100) {
        return "A percentagem de desconto deve estar entre 0 e 100.";
      }
    }

    // Check for ascending order
    const sorted = [...tiers].sort((a, b) => a.min_value - b.min_value);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min_value <= sorted[i - 1].min_value) {
        return "Os valores mínimos devem ser únicos e em ordem crescente.";
      }
    }

    return null;
  };

  const applyTiers = async () => {
    const error = validateTiers();
    if (error) {
      toast({
        title: "Erro de validação",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);

    try {
      const response = await fetch("/api/admin/price-tiers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiers: tiers.map((t) => ({
            min_value: t.min_value,
            discount_pct: t.discount_pct,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao aplicar escalões");
      }

      setStats({
        variants: result.variantsUpdated,
        tiers: result.tiersCreated,
      });

      toast({
        title: "Escalões aplicados",
        description: `${result.tiersCreated} escalões criados para ${result.variantsUpdated} variantes.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao aplicar escalões",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const sortedTiers = [...tiers].sort((a, b) => a.min_value - b.min_value);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-foreground mb-2">
          Escalões de Desconto por Quantidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure os descontos progressivos baseados no valor total do pedido.
          Os escalões são convertidos em quantidades por produto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Configurar Escalões
            </CardTitle>
            <CardDescription>
              Defina o valor mínimo do pedido e a percentagem de desconto para
              cada escalão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Valor Mínimo (EUR)</TableHead>
                  <TableHead className="w-[180px]">Desconto (%)</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">&gt;</span>
                        <Input
                          type="number"
                          value={tier.min_value}
                          onChange={(e) =>
                            updateTier(
                              tier.id,
                              "min_value",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-28"
                          min={1}
                          step={50}
                        />
                        <span className="text-muted-foreground">EUR</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={tier.discount_pct}
                          onChange={(e) =>
                            updateTier(
                              tier.id,
                              "discount_pct",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24"
                          min={0.1}
                          max={100}
                          step={0.5}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTier(tier.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={addTier}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Escalão
              </Button>
              <Button onClick={applyTiers} disabled={isApplying}>
                {isApplying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Aplicar a Todos os Produtos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Os descontos são baseados no <strong>valor total</strong> do
                pedido, não na quantidade.
              </p>
              <p>
                Para cada produto, o sistema calcula automaticamente a
                quantidade necessária para atingir cada escalão de valor.
              </p>
              <p>
                <strong>Exemplo:</strong> Para um produto de 2,50 EUR com
                escalão &gt;200 EUR:
              </p>
              <p className="pl-4 border-l-2 border-muted">
                200 / 2,50 = 80 unidades para ativar o desconto
              </p>
            </CardContent>
          </Card>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Última Aplicação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-light text-foreground">
                      {stats.variants}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Variantes
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-light text-foreground">
                      {stats.tiers}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Escalões Criados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex justify-between items-center py-2 border-b border-dashed border-muted last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      Pedido &gt; {tier.min_value} EUR
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--accent-100)" }}
                    >
                      -{tier.discount_pct}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
