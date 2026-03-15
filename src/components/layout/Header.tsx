"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const courseTypes = [
  {
    slug: "on-call-preparation",
    name: "On-Call Prep",
    description: "CT-based emergency radiology",
  },
  {
    slug: "mri-based",
    name: "MRI Based",
    description: "Comprehensive MRI courses",
  },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="Navigating Radiology"
            width={28}
            height={28}
            className="rounded"
          />
          <span className="text-lg font-bold text-accent">Navigating Radiology</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                pathname.startsWith("/courses")
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Courses
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              >
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface p-1.5 shadow-xl">
                {courseTypes.map((ct) => (
                  <Link
                    key={ct.slug}
                    href={`/courses/${ct.slug}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover ${
                      pathname.includes(ct.slug) ? "bg-surface-hover" : ""
                    }`}
                  >
                    <div className="text-sm font-medium">{ct.name}</div>
                    <div className="text-xs text-muted">{ct.description}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="sm:hidden text-muted"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface p-4 sm:hidden">
          {courseTypes.map((ct) => (
            <Link
              key={ct.slug}
              href={`/courses/${ct.slug}`}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm text-muted hover:text-foreground"
            >
              {ct.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
