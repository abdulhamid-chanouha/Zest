import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { SignInForm } from "@/components/sign-in-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/recipes");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <AuthCard title="Welcome back" description="Sign in to access your recipes and shares.">
        <SignInForm />
      </AuthCard>
    </main>
  );
}
