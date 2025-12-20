"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

function SiteSearchInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Initialize with empty string to avoid hydration mismatch if search params are not yet available
    const [query, setQuery] = React.useState("")

    // Use useEffect to sync state with URL params
    React.useEffect(() => {
        const search = searchParams.get("search")
        if (search) {
            setQuery(search)
        } else {
            setQuery("")
        }
    }, [searchParams])

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Always navigate to /produtos with the search query
        // We clear other parameters to ensure a fresh search
        if (query.trim()) {
            router.push(`/produtos?search=${encodeURIComponent(query.trim())}`)
        } else {
            router.push(`/produtos`)
        }
    }

    return (
        <form onSubmit={onSubmit} className="relative hidden w-full max-w-sm sm:flex items-center mr-4">
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
                type="search"
                placeholder="Pesquisar produtos..."
                className="w-[200px] lg:w-[300px] h-9 pl-9 pr-4 bg-background border-dashed border-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </form>
    )
}

export function SiteSearch() {
    return (
        <React.Suspense fallback={
            <div className="relative hidden w-full max-w-sm sm:flex items-center mr-4">
                <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="search"
                    placeholder="Pesquisar produtos..."
                    className="w-[200px] lg:w-[300px] h-9 pl-9 pr-4 bg-background border-dashed border-input"
                    disabled
                />
            </div>
        }>
            <SiteSearchInner />
        </React.Suspense>
    )
}
