"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  Chip,
  Divider,
  Link as HeroLink,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import NextLink from "next/link";
import Image from "next/image";
import { PlayCircle, FileText, BookOpen, Video, Check, Bookmark, RotateCcw } from "lucide-react";
import { Button, Progress } from "@heroui/react";
import type { CourseData } from "@/lib/types";
import { useProgress } from "@/lib/hooks/use-progress";

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
  const [showDiagnoses, setShowDiagnoses] = useState(false);
  const { progress, clearProgress } = useProgress(courseSlug);
  const completedCount = Object.values(progress).filter((p) => p.completed).length;

  const sortedCases = [...course.cases].sort(
    (a, b) => a.caseNumber - b.caseNumber
  );

  const sections = course.sections || [];
  type SectionGroup = { name: string; cases: typeof course.cases };
  const sectionGroups: SectionGroup[] = [];

  if (sections.length > 0) {
    // Group cases by their sectionIndex (assigned by build-data from section-boundaries.json)
    for (let i = 0; i < sections.length; i++) {
      const sectionCases = sortedCases.filter(
        (c) => c.sectionIndex === i
      );
      if (sectionCases.length > 0) {
        sectionGroups.push({ name: sections[i], cases: sectionCases });
      }
    }
    // Any cases without a matching sectionIndex go into a fallback group
    const assignedIds = new Set(sectionGroups.flatMap((g) => g.cases.map((c) => c.caseId)));
    const unassigned = sortedCases.filter((c) => !assignedIds.has(c.caseId));
    if (unassigned.length > 0 && sectionGroups.length === 0) {
      sectionGroups.push({ name: "Cases", cases: unassigned });
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
                  {[...new Set(sections)]
                    .filter((s) =>
                      !s.toLowerCase().includes("how to work through") &&
                      !s.toLowerCase().includes("normal anatomy")
                    )
                    .map((s) => s.replace(/^Part\s+\d+:\s*/i, ""))
                    .map((s, i) => (
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

      {/* Progress bar */}
      {course.caseCount > 0 && (
        <Card className="mb-6">
          <CardBody className="gap-2 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-default-500">Progress</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {completedCount} / {course.caseCount} completed
                </span>
                {completedCount > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    className="h-6 min-w-0 px-2 text-xs text-default-400"
                    startContent={<RotateCcw size={12} />}
                    onPress={clearProgress}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
            <Progress
              value={(completedCount / course.caseCount) * 100}
              size="sm"
              color="success"
            />
          </CardBody>
        </Card>
      )}

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardBody className="flex-row items-center gap-3 py-3">
            <PlayCircle size={20} className="shrink-0 text-primary" />
            <span className="text-sm text-default-500">Introductory Video</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex-row items-center gap-3 py-3">
            <FileText size={20} className="shrink-0 text-primary" />
            <span className="text-sm text-default-500">{course.caseCount} Cases Available</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex-row items-center gap-3 py-3">
            <BookOpen size={20} className="shrink-0 text-primary" />
            <span className="text-sm text-default-500">Expert Walkthroughs and Learning Material</span>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex-row items-center gap-3 py-3">
            <Video size={20} className="shrink-0 text-default-300" />
            <span className="flex items-center gap-2 text-sm text-default-500">
              Video Driven Mode
              <Chip size="sm" variant="flat" color="warning" className="h-5 text-[10px]">
                Coming Soon
              </Chip>
            </span>
          </CardBody>
        </Card>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cases</h3>
        <Switch
          size="sm"
          isSelected={showDiagnoses}
          onValueChange={setShowDiagnoses}
        >
          <span className="text-sm text-default-400">Display Diagnoses</span>
        </Switch>
      </div>
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
                    {progress[c.caseId]?.completed ? (
                      <Check size={14} className="mr-2 inline text-success" />
                    ) : (
                      <span className="mr-2 inline-block w-3.5" />
                    )}
                    Case {c.caseNumber}
                    {progress[c.caseId]?.bookmarked && (
                      <Bookmark size={12} className="ml-1.5 inline text-warning" />
                    )}
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
                    {showDiagnoses && c.diagnosisTitle && (
                      <p className="mt-0.5 text-xs text-primary/70">
                        {c.diagnosisTitle.replace(/^Case\s+\d+\s*[-–—]\s*/i, "")}
                      </p>
                    )}
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
