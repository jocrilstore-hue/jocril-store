"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 border border-dashed rounded-lg bg-muted/30">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Erro no Painel de Administração</h2>
                <p className="text-sm text-muted-foreground max-w-[400px]">
                    {error.message || "Ocorreu um erro inesperado."}
                </p>
            </div>
            <Button onClick={() => reset()} variant="outline">
                Tentar novamente
            </Button>
        </div>
    );
}
