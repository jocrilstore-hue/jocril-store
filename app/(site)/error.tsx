"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
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
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center">
            <div className="bg-destructive/10 p-6 rounded-full">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Algo correu mal!</h2>
            <p className="text-muted-foreground max-w-[500px]">
                Ocorreu um erro ao carregar esta página. A nossa equipa foi notificada.
            </p>
            <Button onClick={() => reset()} variant="default">
                Tentar novamente
            </Button>
        </div>
    );
}
