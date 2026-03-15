"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import NextImage from "next/image";
import NextLink from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const courseTypes = [
  {
    key: "on-call-preparation",
    name: "On-Call Prep",
    description: "CT-based emergency radiology",
  },
  {
    key: "mri-based",
    name: "MRI Based",
    description: "Comprehensive MRI courses",
  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      isBordered
      classNames={{
        base: "bg-content1/95 backdrop-blur-md",
        wrapper: "px-4",
      }}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <NextLink href="/" className="flex items-center gap-2.5">
            <NextImage
              src="/images/logo.png"
              alt="Navigating Radiology"
              width={28}
              height={28}
              className="rounded"
            />
            <span className="text-lg font-bold text-primary">
              Navigating Radiology
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="end">
        <Dropdown>
          <NavbarItem>
            <DropdownTrigger>
              <Button
                variant="light"
                className={`text-sm ${
                  pathname.startsWith("/courses")
                    ? "text-primary"
                    : "text-default-500"
                }`}
                endContent={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5">
                    <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
              >
                Courses
              </Button>
            </DropdownTrigger>
          </NavbarItem>
          <DropdownMenu
            aria-label="Course types"
            itemClasses={{
              base: "gap-4",
            }}
          >
            {courseTypes.map((ct) => (
              <DropdownItem
                key={ct.key}
                description={ct.description}
                as={NextLink}
                href={`/courses/${ct.key}`}
                className={pathname.includes(ct.key) ? "text-primary" : ""}
              >
                {ct.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      <NavbarMenu>
        {courseTypes.map((ct) => (
          <NavbarMenuItem key={ct.key}>
            <Link
              as={NextLink}
              href={`/courses/${ct.key}`}
              onPress={() => setIsMenuOpen(false)}
              color={pathname.includes(ct.key) ? "primary" : "foreground"}
              className="w-full"
              size="lg"
            >
              {ct.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
