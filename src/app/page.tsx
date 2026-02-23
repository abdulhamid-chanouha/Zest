import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Search, Share2, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

const highlights = [
  {
    icon: Search,
    title: "Powerful recipe search",
    description: "Find recipes by name, ingredients, cuisine, prep time, and status in seconds.",
  },
  {
    icon: Share2,
    title: "Multi-user sharing",
    description: "Share read-only recipes by email or secure link, then revoke access anytime.",
  },
  {
    icon: WandSparkles,
    title: "AI-native workflows",
    description: "Parse pasted recipes, adapt existing ones, and get pantry-driven suggestions.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/recipes");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <header className="mb-14 flex items-center justify-between rounded-2xl border border-border/60 bg-white/70 px-6 py-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-yellow-100 p-2 text-yellow-900">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-semibold">Zest</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Create account</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-900">
            Version 3 Recipe Management System
          </p>
          <h1 className="font-heading text-4xl leading-tight text-slate-900 sm:text-5xl">
            Keep your recipes organized, shareable, and intelligently adaptable.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-600">
            Zest is a focused recipe manager for real cooking workflows: ownership controls, secure sharing,
            AI-assisted structuring, and clean everyday usability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">I already have an account</Link>
            </Button>
          </div>
        </div>

        <Card className="border-yellow-100 bg-white/80 shadow-md">
          <CardContent className="space-y-5 p-6">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <item.icon className="h-4 w-4 text-yellow-700" />
                  {item.title}
                </div>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
