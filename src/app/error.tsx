"use client";

import { Button } from "@heroui/react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-6xl font-bold text-default-300">500</h1>
      <p className="text-lg text-default-500">Something went wrong</p>
      <Button onPress={reset} color="primary" variant="flat" size="sm">
        Try Again
      </Button>
    </div>
  );
}
