"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Что-то пошло не так</h2>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        Произошла ошибка при загрузке страницы. Попробуйте обновить или вернитесь позже.
      </p>
      <button
        onClick={reset}
        className="btn-primary btn-md"
      >
        <RefreshCw className="w-4 h-4" />
        Попробовать снова
      </button>
    </div>
  );
}
