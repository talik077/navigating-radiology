import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-6xl font-bold text-default-300">404</h1>
      <p className="text-lg text-default-500">Page not found</p>
      <Link
        href="/"
        className="rounded-lg bg-primary/20 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/30"
      >
        Back to Home
      </Link>
    </div>
  );
}
