"use client";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </>
  );
}
