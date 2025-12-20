"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoriesEditor } from "./categories-editor";
import { MaterialsEditor } from "./materials-editor";
import { SEOAutoFixModal } from "./seo-auto-fix-modal";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
  Sparkles,
  Eye,
  EyeOff,
  Percent,
} from "lucide-react";
import Link from "next/link";
import type { SEOIssue, SEOScanResult } from "@/app/api/admin/seo/scan/route";

const AI_MODELS = [
  {
    value: "google/gemini-2.5-flash-preview-09-2025",
    label: "Gemini 2.5 Flash (Recomendado)",
  },
  {
    value: "google/gemini-2.5-flash-lite-preview-09-2025",
    label: "Gemini 2.5 Flash Lite (Económico)",
  },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (Qualidade)" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
];

export function ProductToolsDashboard() {
  const { toast } = useToast();
  const [priceMode, setPriceMode] = useState<"percent" | "fixed">("percent");
  const [priceValue, setPriceValue] = useState("5");

  // AI Settings state
  const [apiKey, setApiKey] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].value);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // SEO Scan state
  const [scanResult, setScanResult] = useState<SEOScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showAutoFixModal, setShowAutoFixModal] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SEOIssue[]>([]);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings || {};
          setApiKey(settings.openrouter_api_key || "");
          setApiKeyConfigured(
            settings.openrouter_api_key_configured === "true",
          );
          if (settings.openrouter_model) {
            setSelectedModel(settings.openrouter_model);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openrouter_api_key: apiKey,
          openrouter_model: selectedModel,
        }),
      });

      if (response.ok) {
        setApiKeyConfigured(true);
        setConnectionStatus("idle");
        toast({
          title: "Configurações guardadas",
          description: "As definições de IA foram atualizadas com sucesso.",
        });
        // Reload to get masked key
        const reloadResponse = await fetch("/api/admin/settings");
        if (reloadResponse.ok) {
          const data = await reloadResponse.json();
          setApiKey(data.settings?.openrouter_api_key || "");
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao guardar");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao guardar configurações",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus("idle");
    try {
      const response = await fetch("/api/admin/settings/test", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setConnectionStatus("success");
        toast({
          title: "Conexão bem sucedida",
          description: `Modelo ${data.model} está operacional.`,
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Falha na conexão",
          description: data.error || "Verifique a chave API.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("error");
      toast({
        title: "Erro",
        description: "Não foi possível testar a conexão.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSeoScan = async () => {
    setScanning(true);
    try {
      const response = await fetch("/api/admin/seo/scan");
      if (response.ok) {
        const data: SEOScanResult = await response.json();
        setScanResult(data);
        toast({
          title: "Análise SEO concluída",
          description: `Encontrados ${data.summary.total} problemas para resolver.`,
        });
      } else {
        throw new Error("Erro ao analisar SEO");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível executar a análise SEO.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleAutoFix = (issueType?: SEOIssue["type"]) => {
    if (!scanResult) return;

    let issuesToFix = scanResult.issues;
    if (issueType) {
      issuesToFix = scanResult.issues.filter((i) => i.type === issueType);
    }

    setSelectedIssues(issuesToFix);
    setShowAutoFixModal(true);
  };

  const handleFixesApplied = useCallback(() => {
    // Re-scan after fixes are applied
    handleSeoScan();
  }, []);

  const handleBulkPrice = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Atualização agendada",
      description: `Serão aplicados ${priceMode === "percent" ? `${priceValue}%` : `${priceValue}€`} aos preços selecionados.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* AI Settings Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações IA
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure a chave API para usar funcionalidades de IA na otimização
            SEO.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              OpenRouter API
            </CardTitle>
            <CardDescription>
              Acesso a múltiplos modelos de IA (Gemini, Claude, GPT) através de
              uma única API.
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary underline"
              >
                Obter chave API
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSettings ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chave API</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo</label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Gemini 2.5 Pro suporta análise de imagens para gerar alt
                    text mais preciso.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings || !apiKey}
                  >
                    {savingSettings ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Guardar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiKeyConfigured}
                  >
                    {testingConnection ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Testar Conexão
                  </Button>
                  {connectionStatus === "success" && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Conectado
                    </span>
                  )}
                  {connectionStatus === "error" && (
                    <span className="flex items-center gap-1 text-sm text-destructive">
                      <XCircle className="h-4 w-4" />
                      Falhou
                    </span>
                  )}
                </div>

                {apiKeyConfigured && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Chave API configurada
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table Management Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Tabelas</h2>
          <p className="text-sm text-muted-foreground">
            Gerir categorias e materiais que podem ser atribuídos aos produtos.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <CategoriesEditor />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <MaterialsEditor />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Price Tiers Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Escalões de Desconto
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure descontos progressivos baseados no valor do pedido.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Descontos por Quantidade</CardTitle>
            <CardDescription>
              Defina escalões de desconto que são automaticamente calculados
              para cada produto com base no seu preço.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg border">
                <p className="text-muted-foreground">Pedido &gt; 200 EUR</p>
                <p
                  className="font-medium"
                  style={{ color: "var(--accent-100)" }}
                >
                  -0.5%
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-muted-foreground">Pedido &gt; 400 EUR</p>
                <p
                  className="font-medium"
                  style={{ color: "var(--accent-100)" }}
                >
                  -1%
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-muted-foreground">Pedido &gt; 800 EUR</p>
                <p
                  className="font-medium"
                  style={{ color: "var(--accent-100)" }}
                >
                  -1.5%
                </p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-muted-foreground">Pedido &gt; 1000 EUR</p>
                <p
                  className="font-medium"
                  style={{ color: "var(--accent-100)" }}
                >
                  -3%
                </p>
              </div>
            </div>
            <Link href="/admin/tools/price-tiers">
              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Escalões
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Existing Tools Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Ferramentas de Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Operações em massa, auditorias e exportações.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Atualização em massa de preços</CardTitle>
              <CardDescription>
                Recalcule preços por categoria, material ou SKUs específicos.
              </CardDescription>
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
                    <SelectItem value="template">
                      Template específico
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={priceMode}
                  onValueChange={(value: "percent" | "fixed") =>
                    setPriceMode(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Variação percentual</SelectItem>
                    <SelectItem value="fixed">Variação fixa (€)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={priceValue}
                  onChange={(event) => setPriceValue(event.target.value)}
                />
                <Button type="submit" className="w-full">
                  Prever alterações
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestão de imagens</CardTitle>
              <CardDescription>
                Detete problemas comuns antes da publicação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Imagens em falta</p>
                  <p className="text-xs text-muted-foreground">
                    8 variações sem fotografia
                  </p>
                </div>
                <Badge variant="destructive">8</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Possível marca d'água</p>
                  <p className="text-xs text-muted-foreground">
                    4 ficheiros suspeitos
                  </p>
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
              <CardTitle className="flex items-center gap-2">
                Checklist SEO
                {apiKeyConfigured && (
                  <Badge variant="secondary" className="ml-auto">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA disponível
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Sinalize metadados em falta ou duplicados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Cobertura atual</span>
                  <span>{scanResult?.coverage ?? 0}%</span>
                </div>
                <Progress value={scanResult?.coverage ?? 0} />
              </div>

              {scanResult ? (
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          scanResult.summary.missingMetaDescriptions === 0
                        }
                        disabled
                      />
                      <span>
                        {scanResult.summary.missingMetaDescriptions === 0
                          ? "Meta descrições completas"
                          : `${scanResult.summary.missingMetaDescriptions} meta descrições em falta`}
                      </span>
                    </div>
                    {scanResult.summary.missingMetaDescriptions > 0 &&
                      apiKeyConfigured && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleAutoFix("missing_meta_description")
                          }
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Corrigir
                        </Button>
                      )}
                  </li>
                  <li className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={scanResult.summary.duplicateTitles === 0}
                        disabled
                      />
                      <span>
                        {scanResult.summary.duplicateTitles === 0
                          ? "Títulos únicos"
                          : `${scanResult.summary.duplicateTitles} títulos duplicados`}
                      </span>
                    </div>
                    {scanResult.summary.duplicateTitles > 0 &&
                      apiKeyConfigured && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAutoFix("duplicate_title")}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Corrigir
                        </Button>
                      )}
                  </li>
                  <li className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={scanResult.summary.missingAltText === 0}
                        disabled
                      />
                      <span>
                        {scanResult.summary.missingAltText === 0
                          ? "Alt text completo"
                          : `${scanResult.summary.missingAltText} imagens sem alt text`}
                      </span>
                    </div>
                    {scanResult.summary.missingAltText > 0 &&
                      apiKeyConfigured && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAutoFix("missing_alt_text")}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Corrigir
                        </Button>
                      )}
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Execute a análise para ver os resultados.
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSeoScan}
                  disabled={scanning}
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Executar checklist
                </Button>
                {scanResult &&
                  scanResult.summary.total > 0 &&
                  apiKeyConfigured && (
                    <Button
                      variant="secondary"
                      onClick={() => handleAutoFix()}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Auto-Corrigir Tudo
                    </Button>
                  )}
              </div>

              {!apiKeyConfigured &&
                scanResult &&
                scanResult.summary.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Configure a chave API acima para usar a correção automática
                    com IA.
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportação & importação</CardTitle>
              <CardDescription>
                Troque dados com ERP ou folhas de cálculo.
              </CardDescription>
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
      </div>

      {/* SEO Auto-Fix Modal */}
      <SEOAutoFixModal
        open={showAutoFixModal}
        onOpenChange={setShowAutoFixModal}
        issues={selectedIssues}
        onFixesApplied={handleFixesApplied}
      />
    </div>
  );
}
