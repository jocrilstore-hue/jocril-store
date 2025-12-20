"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Check, X, AlertCircle, Image } from "lucide-react";
import type { SEOIssue } from "@/app/api/admin/seo/scan/route";
import type { SEOFix } from "@/app/api/admin/seo/auto-fix/route";

interface SEOAutoFixModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: SEOIssue[];
  onFixesApplied: () => void;
}

type Step = "preview" | "generating" | "review" | "applying" | "done";

export function SEOAutoFixModal({
  open,
  onOpenChange,
  issues,
  onFixesApplied,
}: SEOAutoFixModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("preview");
  const [fixes, setFixes] = useState<SEOFix[]>([]);
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Array<{ issueId: string; error: string }>>([]);
  const [appliedCount, setAppliedCount] = useState(0);

  const handleGenerate = async () => {
    setStep("generating");
    setErrors([]);

    try {
      const response = await fetch("/api/admin/seo/auto-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar correções");
      }

      const data = await response.json();
      setFixes(data.fixes || []);
      setErrors(data.errors || []);
      // Select all fixes by default
      setSelectedFixes(new Set((data.fixes || []).map((f: SEOFix) => f.issueId)));
      setStep("review");
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar correções",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const handleApply = async () => {
    const fixesToApply = fixes.filter((f) => selectedFixes.has(f.issueId));
    if (fixesToApply.length === 0) {
      toast({
        title: "Nenhuma correção selecionada",
        description: "Selecione pelo menos uma correção para aplicar.",
        variant: "destructive",
      });
      return;
    }

    setStep("applying");

    try {
      const response = await fetch("/api/admin/seo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixes: fixesToApply }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao aplicar correções");
      }

      const data = await response.json();
      setAppliedCount(data.applied || 0);
      if (data.errors?.length > 0) {
        setErrors((prev) => [...prev, ...data.errors]);
      }
      setStep("done");

      toast({
        title: "Correções aplicadas",
        description: `${data.applied} correções foram aplicadas com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao aplicar correções",
        variant: "destructive",
      });
      setStep("review");
    }
  };

  const handleClose = () => {
    if (step === "done") {
      onFixesApplied();
    }
    onOpenChange(false);
    // Reset state after closing
    setTimeout(() => {
      setStep("preview");
      setFixes([]);
      setSelectedFixes(new Set());
      setErrors([]);
      setAppliedCount(0);
    }, 300);
  };

  const toggleFix = (issueId: string) => {
    setSelectedFixes((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedFixes.size === fixes.length) {
      setSelectedFixes(new Set());
    } else {
      setSelectedFixes(new Set(fixes.map((f) => f.issueId)));
    }
  };

  const getIssueTypeLabel = (type: SEOIssue["type"]) => {
    switch (type) {
      case "missing_meta_description":
        return "Meta Descrição";
      case "duplicate_title":
        return "Título";
      case "missing_alt_text":
        return "Alt Text";
      default:
        return type;
    }
  };

  const getIssueTypeBadgeVariant = (type: SEOIssue["type"]) => {
    switch (type) {
      case "missing_meta_description":
        return "secondary" as const;
      case "duplicate_title":
        return "destructive" as const;
      case "missing_alt_text":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {step === "preview" && "Auto-Corrigir SEO com IA"}
            {step === "generating" && "A gerar correções..."}
            {step === "review" && "Rever correções sugeridas"}
            {step === "applying" && "A aplicar correções..."}
            {step === "done" && "Correções aplicadas"}
          </DialogTitle>
          <DialogDescription>
            {step === "preview" &&
              `${issues.length} problemas selecionados para correção automática.`}
            {step === "generating" &&
              "A IA está a analisar os problemas e a gerar sugestões..."}
            {step === "review" &&
              "Reveja as sugestões antes de aplicar. Pode desmarcar as que não pretende."}
            {step === "applying" && "A guardar as alterações na base de dados..."}
            {step === "done" &&
              `${appliedCount} correções foram aplicadas com sucesso.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "preview" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                A IA irá gerar correções para os seguintes problemas:
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {issues.slice(0, 20).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Badge variant={getIssueTypeBadgeVariant(issue.type)}>
                      {getIssueTypeLabel(issue.type)}
                    </Badge>
                    <span className="text-sm flex-1 truncate">
                      {issue.entityName}
                    </span>
                    {issue.imageUrl && (
                      <Image className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {issues.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    ... e mais {issues.length - 20} problemas
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                A processar {issues.length} problemas...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Isto pode demorar alguns segundos.
              </p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-3">
              {fixes.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="sm" onClick={toggleAll}>
                    {selectedFixes.size === fixes.length
                      ? "Desmarcar todas"
                      : "Selecionar todas"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedFixes.size} de {fixes.length} selecionadas
                  </span>
                </div>
              )}

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {fixes.map((fix) => (
                  <div
                    key={fix.issueId}
                    className={`rounded-lg border p-4 transition-colors ${selectedFixes.has(fix.issueId)
                        ? "border-primary bg-primary/5"
                        : "opacity-60"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedFixes.has(fix.issueId)}
                        onCheckedChange={() => toggleFix(fix.issueId)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getIssueTypeBadgeVariant(fix.type)}>
                            {getIssueTypeLabel(fix.type)}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {fix.entityName}
                          </span>
                        </div>

                        {fix.imageUrl && (
                          <div className="mb-2">
                            <img
                              src={fix.imageUrl}
                              alt="Imagem do produto"
                              className="h-16 w-16 object-cover rounded border"
                            />
                          </div>
                        )}

                        {fix.currentValue && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Atual: </span>
                            <span className="text-destructive line-through">
                              {fix.currentValue}
                            </span>
                          </div>
                        )}

                        <div className="text-sm">
                          <span className="text-muted-foreground">Sugestão: </span>
                          <span className="text-green-600 font-medium">
                            {fix.suggestedValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {errors.length} erros durante a geração
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === "applying" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                A aplicar {selectedFixes.size} correções...
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-lg font-medium mb-2">Concluído!</p>
              <p className="text-sm text-muted-foreground text-center">
                {appliedCount} correções foram aplicadas à sua loja.
                <br />
                Execute novamente o checklist para verificar.
              </p>
              {errors.length > 0 && (
                <p className="text-sm text-destructive mt-4">
                  {errors.length} erros ocorreram durante a aplicação.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Correções
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleApply}
                disabled={selectedFixes.size === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Aplicar {selectedFixes.size} Correções
              </Button>
            </>
          )}

          {step === "done" && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
