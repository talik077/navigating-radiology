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
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Divider,
} from "@heroui/react";
import NextLink from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Navigation, ChevronDown, LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";

interface CourseTypeNav {
  slug: string;
  name: string;
  courses: { courseSlug: string; courseName: string; caseCount: number }[];
}

export default function Header({
  courseTypes,
  userEmail,
}: {
  courseTypes: CourseTypeNav[];
  userEmail?: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="full"
      isBlurred
      isBordered
      classNames={{
        wrapper: "px-4",
      }}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <NextLink href="/" className="flex items-center gap-2">
            <Navigation size={20} className="text-primary" />
            <span className="text-lg font-bold text-foreground">
              Navigating Radiology
            </span>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="end">
        <NavbarItem>
          <Popover
            isOpen={isMegaOpen}
            onOpenChange={setIsMegaOpen}
            placement="bottom-end"
            offset={12}
            classNames={{
              content: "p-0 bg-content1 border border-default-200",
            }}
          >
            <PopoverTrigger>
              <Button
                variant="light"
                className={`text-sm ${
                  pathname.startsWith("/courses")
                    ? "text-primary"
                    : "text-default-500"
                }`}
                endContent={<ChevronDown size={14} className={`transition-transform ${isMegaOpen ? "rotate-180" : ""}`} />}
              >
                Courses
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex w-[560px] gap-0">
                {courseTypes.map((ct, idx) => (
                  <div key={ct.slug} className={`flex-1 ${idx > 0 ? "border-l border-default-200" : ""}`}>
                    {/* Column header */}
                    <div className="px-4 py-3">
                      <Link
                        as={NextLink}
                        href={`/courses/${ct.slug}`}
                        color="foreground"
                        className="text-sm font-semibold hover:text-primary"
                        onPress={() => setIsMegaOpen(false)}
                      >
                        {ct.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-default-400">
                        {ct.courses.reduce((s, c) => s + c.caseCount, 0)} cases
                      </p>
                    </div>
                    <Divider />
                    {/* Course list */}
                    <div className="py-1.5">
                      {ct.courses
                        .filter((c) => c.caseCount > 0)
                        .map((c) => (
                          <Link
                            key={c.courseSlug}
                            as={NextLink}
                            href={`/courses/${ct.slug}/${c.courseSlug}`}
                            color="foreground"
                            className={`flex items-center justify-between px-4 py-1.5 text-sm transition-colors hover:bg-default-100 ${
                              pathname.includes(c.courseSlug) ? "text-primary" : ""
                            }`}
                            onPress={() => setIsMegaOpen(false)}
                          >
                            <span>{c.courseName}</span>
                            <span className="ml-3 text-xs text-default-400">{c.caseCount}</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </NavbarItem>
        {userEmail && (
          <NavbarItem>
            <form action={logout}>
              <Button
                type="submit"
                variant="light"
                size="sm"
                className="text-default-500 gap-1.5"
                startContent={<LogOut size={14} />}
              >
                <span className="hidden md:inline max-w-[120px] truncate">{userEmail}</span>
              </Button>
            </form>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {courseTypes.map((ct) => (
          <NavbarMenuItem key={ct.slug}>
            <Link
              as={NextLink}
              href={`/courses/${ct.slug}`}
              onPress={() => setIsMenuOpen(false)}
              color={pathname.includes(ct.slug) ? "primary" : "foreground"}
              className="w-full text-lg font-semibold"
              size="lg"
            >
              {ct.name}
            </Link>
            <div className="ml-4 mt-1 space-y-1">
              {ct.courses
                .filter((c) => c.caseCount > 0)
                .map((c) => (
                  <Link
                    key={c.courseSlug}
                    as={NextLink}
                    href={`/courses/${ct.slug}/${c.courseSlug}`}
                    onPress={() => setIsMenuOpen(false)}
                    color={pathname.includes(c.courseSlug) ? "primary" : "foreground"}
                    className="block text-sm"
                  >
                    {c.courseName}
                  </Link>
                ))}
            </div>
          </NavbarMenuItem>
        ))}
        {userEmail && (
          <NavbarMenuItem>
            <Divider className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500 truncate">{userEmail}</span>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="light"
                  size="sm"
                  startContent={<LogOut size={14} />}
                  onPress={() => setIsMenuOpen(false)}
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
