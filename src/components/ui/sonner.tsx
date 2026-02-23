"use client";

import { Toaster as Sonner } from "sonner";

const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        className: "border border-border/60 bg-card text-card-foreground",
      }}
    />
  );
};

export { Toaster };
