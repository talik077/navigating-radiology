"use client";

import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Link as HeroLink,
  Button,
} from "@heroui/react";
import NextLink from "next/link";
import Image from "next/image";

const heroImages: Record<string, string> = {
  "on-call-preparation": "/images/on-call-hero.png",
  "mri-based": "/images/mri-hero.png",
};

interface CourseType {
  slug: string;
  name: string;
  description: string;
  courses: {
    courseSlug: string;
    courseType: string;
    courseName: string;
    description: string;
    caseCount: number;
  }[];
}

export default function HomeContent({ courseTypes }: { courseTypes: CourseType[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome tips */}
      <Card className="mb-10">
        <CardBody className="px-8 py-6">
          <p className="mb-2">
            <strong>To Get Started:</strong> Explore our curated case-based
            courses and learning content below, or via the{" "}
            <strong>Courses</strong> dropdown (top-right).
          </p>
          <p>
            <strong>Happy Learning!</strong>
          </p>
        </CardBody>
      </Card>

      {/* Courses heading */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Courses</h1>
        <p className="text-default-400">
          Featuring scrollable cases with expert walkthroughs, AI feedback, and
          videos that simplify key concepts
        </p>
      </div>

      {/* Two course type cards */}
      <div className="grid gap-8 lg:grid-cols-2">
        {courseTypes.map((ct) => (
          <div key={ct.slug} className="flex flex-col gap-0">
            {/* Hero image */}
            <div className="relative h-56 overflow-hidden rounded-t-xl">
              {heroImages[ct.slug] && (
                <Image
                  src={heroImages[ct.slug]}
                  alt={ct.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              )}
            </div>

            {/* Card body */}
            <Card className="rounded-t-none">
              <CardBody className="gap-4 px-6 py-5">
                <h3 className="text-xl font-bold">{ct.name}</h3>
                <p className="text-sm leading-relaxed text-default-400">
                  {ct.description}
                </p>
                <div>
                  <Button
                    as={NextLink}
                    href={`/courses/${ct.slug}`}
                    color="primary"
                    variant="ghost"
                    size="sm"
                  >
                    Get Started
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Quick Access table */}
            <Table
              aria-label={`${ct.name} quick access`}
              removeWrapper
              classNames={{
                base: "rounded-t-none rounded-b-xl border border-t-0 border-default-200 overflow-hidden",
                th: "bg-content2 text-default-500 text-xs font-medium",
                td: "py-2.5",
                tr: "border-b border-default-100 last:border-0 hover:bg-content2/50 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>Quick Access</TableColumn>
                <TableColumn className="w-24 text-right">Cases</TableColumn>
              </TableHeader>
              <TableBody>
                {ct.courses
                  .filter((c) => c.caseCount > 0)
                  .map((course) => (
                    <TableRow key={course.courseSlug}>
                      <TableCell>
                        <HeroLink
                          as={NextLink}
                          href={`/courses/${ct.slug}/${course.courseSlug}`}
                          color="foreground"
                          size="sm"
                          className="hover:text-primary"
                        >
                          {course.courseName}
                        </HeroLink>
                      </TableCell>
                      <TableCell className="text-right text-default-400 text-sm">
                        {course.caseCount} Cases
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}
