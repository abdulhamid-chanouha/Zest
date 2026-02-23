import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { SignUpForm } from "@/components/sign-up-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/recipes");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <AuthCard title="Create your Zest account" description="Manage your recipes, AI flows, and sharing.">
        <SignUpForm />
      </AuthCard>
    </main>
  );
}
