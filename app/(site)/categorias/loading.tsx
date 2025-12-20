import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="container py-8 space-y-8">
            <div className="space-y-4 text-center">
                <Skeleton className="h-10 w-64 mx-auto" />
                <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-4">
                        <Skeleton className="h-[250px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
