import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
            <div className="bg-muted p-6 rounded-full">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Página não encontrada</h2>
            <p className="text-muted-foreground max-w-[400px]">
                Lamentamos, mas a página que procura não existe ou foi removida.
            </p>
            <div className="flex gap-4 pt-4">
                <Button asChild variant="default">
                    <Link href="/">Voltar à Página Inicial</Link>
                </Button>
            </div>
        </div>
    );
}
