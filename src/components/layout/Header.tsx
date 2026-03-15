"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-accent">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Navigating Radiology
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              Courses
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5">
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {open && (
              <>
                <div className="fixed inset-0" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface p-2 shadow-xl">
                  <Link
                    href="/courses/on-call-preparation"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                  >
                    On-Call Prep (CT)
                  </Link>
                  <Link
                    href="/courses/mri-based"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
                  >
                    MRI Based
                  </Link>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden text-muted"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-border bg-surface p-4 sm:hidden">
          <Link
            href="/courses/on-call-preparation"
            onClick={() => setOpen(false)}
            className="block py-2 text-sm text-muted hover:text-foreground"
          >
            On-Call Prep (CT)
          </Link>
          <Link
            href="/courses/mri-based"
            onClick={() => setOpen(false)}
            className="block py-2 text-sm text-muted hover:text-foreground"
          >
            MRI Based
          </Link>
        </div>
      )}
    </header>
  );
}
