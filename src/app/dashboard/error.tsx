"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Ошибка загрузки</h2>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        Не удалось загрузить данные. Проверьте соединение с интернетом.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-outline btn-md">
          <Home className="w-4 h-4" />
          На главную
        </Link>
        <button onClick={reset} className="btn-primary btn-md">
          <RefreshCw className="w-4 h-4" />
          Обновить
        </button>
      </div>
    </div>
  );
}
