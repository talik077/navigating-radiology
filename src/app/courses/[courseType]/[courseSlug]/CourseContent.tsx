"use client";

import {
  Card,
  CardBody,
  Chip,
  Divider,
  Link as HeroLink,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import NextLink from "next/link";
import Image from "next/image";
import type { CourseData } from "@/lib/types";

function DifficultyChip({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  const colorMap: Record<string, "success" | "warning" | "danger"> = {
    "Bread & Butter": "success",
    Moderate: "warning",
    Challenging: "danger",
  };
  return (
    <Chip size="sm" variant="flat" color={colorMap[difficulty] || "default"}>
      {difficulty}
    </Chip>
  );
}

export default function CourseContent({
  course,
  courseType,
  courseSlug,
}: {
  course: CourseData;
  courseType: string;
  courseSlug: string;
}) {
  const sortedCases = [...course.cases].sort(
    (a, b) => a.caseNumber - b.caseNumber
  );

  const sections = course.sections || [];
  type SectionGroup = { name: string; cases: typeof course.cases };
  const sectionGroups: SectionGroup[] = [];

  if (sections.length > 0) {
    const casesPerSection = Math.ceil(sortedCases.length / sections.length);
    let caseIdx = 0;
    for (let i = 0; i < sections.length; i++) {
      const isLast = i === sections.length - 1;
      const count = isLast ? sortedCases.length - caseIdx : casesPerSection;
      sectionGroups.push({
        name: sections[i],
        cases: sortedCases.slice(caseIdx, caseIdx + count),
      });
      caseIdx += count;
    }
  } else {
    sectionGroups.push({ name: "Cases", cases: sortedCases });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center gap-4">
        <HeroLink
          as={NextLink}
          href={`/courses/${courseType}`}
          size="sm"
          className="rounded-lg bg-content1 px-3 py-1.5 text-default-500 hover:bg-content2"
        >
          ← Back
        </HeroLink>
        <h1 className="text-2xl font-bold">{course.courseName}</h1>
      </div>

      {/* Hero section */}
      <Card className="mb-8 overflow-hidden">
        <div className="flex flex-col gap-0 md:flex-row">
          <div className="relative h-48 w-full overflow-hidden md:h-auto md:w-72">
            <Image
              src={`/images/courses/${courseSlug}.png`}
              alt={course.courseName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 288px"
            />
          </div>
          <CardBody className="flex-1">
            <h2 className="mb-3 text-xl font-bold">{course.courseName}</h2>
            <p className="mb-4 text-sm leading-relaxed text-default-500">
              {course.description}
            </p>
            {sections.length > 0 && (
              <div>
                <strong className="text-sm">Sections:</strong>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...new Set(sections)].filter((s) => !s.toLowerCase().includes("how to work through")).map((s, i) => (
                    <Chip key={i} size="sm" variant="flat" color="primary">
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </div>
      </Card>

      {/* Introduction Videos */}
      {course.introVideos && course.introVideos.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Introduction</h3>
          <div className={`grid gap-4 ${course.introVideos.length > 1 ? "md:grid-cols-2" : ""}`}>
            {course.introVideos.map((vid, i) => (
              <Card key={i} className="overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${vid.youtubeId}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={vid.title}
                  loading="lazy"
                />
                <CardBody className="py-3">
                  <p className="text-sm font-medium">{vid.title}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: "🎬", text: "Introductory Video" },
          { icon: "📄", text: `${course.caseCount} Cases` },
          { icon: "📖", text: "Expert Walkthroughs" },
          { icon: "▶️", text: "Video Driven Mode" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardBody className="flex-row items-center gap-3 py-3">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-sm text-default-500">{stat.text}</span>
            </CardBody>
          </Card>
        ))}
      </div>

      <h3 className="mb-2 text-lg font-semibold">Cases</h3>
      <Divider className="mb-6" />

      {/* Case table grouped by sections */}
      {sectionGroups.map((group, gi) => (
        <div key={gi} className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-primary" />
            <h4 className="text-sm font-semibold text-default-500">{group.name}</h4>
          </div>
          <Table
            aria-label={group.name}
            removeWrapper
            classNames={{
              base: "rounded-lg border border-default-200 overflow-hidden",
              th: "bg-content2 text-default-500 text-xs font-medium",
              td: "py-3",
              tr: "border-b border-default-100 last:border-0 hover:bg-content2/50 transition-colors",
            }}
          >
            <TableHeader>
              <TableColumn className="w-28">CASE #</TableColumn>
              <TableColumn>CLINICAL HISTORY</TableColumn>
              <TableColumn className="w-36 text-right">DIFFICULTY</TableColumn>
            </TableHeader>
            <TableBody>
              {group.cases.map((c) => (
                <TableRow key={c.caseId}>
                  <TableCell className="whitespace-nowrap text-default-400">
                    <span className="mr-2 text-success">●</span>
                    Case {c.caseNumber}
                  </TableCell>
                  <TableCell>
                    <HeroLink
                      as={NextLink}
                      href={`/courses/${courseType}/${courseSlug}/${c.caseId}`}
                      color="foreground"
                      size="sm"
                      className="hover:text-primary"
                    >
                      {c.clinicalHistory || c.diagnosisTitle || `Case ${c.caseNumber}`}
                    </HeroLink>
                  </TableCell>
                  <TableCell className="text-right">
                    <DifficultyChip difficulty={c.difficulty} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
