"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function TopSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(pathname === "/recipes" ? searchParams.toString() : "");

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    const url = params.toString() ? `/recipes?${params.toString()}` : "/recipes";
    router.push(url);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search recipes by name..."
        className="pl-9"
      />
    </form>
  );
}
