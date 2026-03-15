"use client";

import {
  Card,
  CardBody,
  Chip,
  Link as HeroLink,
  Button,
  Divider,
} from "@heroui/react";
import NextLink from "next/link";
import Image from "next/image";
import { PlayCircle, FileText, BookOpen, Video } from "lucide-react";

interface Course {
  courseSlug: string;
  courseType: string;
  courseName: string;
  description: string;
  caseCount: number;
  sections: string[];
}

interface CourseTypeData {
  slug: string;
  name: string;
  description: string;
  courses: Course[];
}

const fullNames: Record<string, string> = {
  "on-call-preparation": "On-call Preparation (CT Focused)",
  "mri-based": "MRI Based",
};

const featureDescriptions: Record<string, string> = {
  "on-call-preparation":
    "Preparing for call is one of the most stressful periods during residency. Master the essentials of on-call radiology — the bread-and-butter emergencies you should never miss, and pearls that will take your reports to the next level. This collection of courses features introductory videos and over 200 scrollable cases -- focusing on CT, but including relevant US and MRI.",
  "mri-based":
    "Become an MRI Expert with our comprehensive courses. Our Body MRI Fellowship gives you confidence you've covered the most important topics. Our Brain MRI course includes expert-led cases covering the highest yield topics.",
};

export default function CourseTypeContent({
  courseType,
  ct,
}: {
  courseType: string;
  ct: CourseTypeData;
}) {
  const title = fullNames[courseType] || ct.name;
  const longDesc = featureDescriptions[courseType] || ct.description;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero section */}
      <Card className="mb-10">
        <CardBody className="gap-6 p-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="leading-relaxed text-default-400">{longDesc}</p>
            </div>
            <div>
              <p className="mb-3">This collection includes:</p>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                <li>
                  <strong>Introductory videos</strong> covering key concepts and
                  providing an approach to each type of study
                </li>
                <li>
                  <strong>Scrollable cases</strong> selected to demonstrate{" "}
                  <strong>the most important pathologies</strong>
                </li>
                <li>
                  <strong>
                    Interactive features, including instant AI feedback on your
                    diagnoses, and hints when you need them.
                  </strong>
                </li>
                <li>
                  <strong>Walkthroughs</strong> of imaging findings, high-yield
                  learning material, and clinical pearls
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Divider className="mb-8" />

      {/* Course cards */}
      <div className="space-y-6">
        {ct.courses
          .filter((c) => c.caseCount > 0)
          .map((course) => (
            <Card key={course.courseSlug} className="overflow-hidden">
              <CardBody className="flex-row gap-0 p-0 max-md:flex-col">
                {/* Thumbnail */}
                <div className="relative w-72 flex-shrink-0 max-md:h-48 max-md:w-full">
                  <Image
                    src={`/images/courses/${course.courseSlug}.png`}
                    alt={course.courseName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 288px"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h5 className="mb-2 text-lg font-semibold">
                      <HeroLink
                        as={NextLink}
                        href={`/courses/${courseType}/${course.courseSlug}`}
                        color="foreground"
                        className="hover:text-primary"
                      >
                        {course.courseName}
                      </HeroLink>
                    </h5>
                    {course.description && (
                      <p className="mb-3 text-sm leading-relaxed text-default-400">
                        {course.description}
                      </p>
                    )}
                    {course.sections && course.sections.length > 0 && (() => {
                      const unique = [...new Set(course.sections)]
                        .filter((s) =>
                          !s.toLowerCase().includes("how to work through") &&
                          !s.toLowerCase().includes("normal anatomy")
                        )
                        .map((s) => s.replace(/^Part\s+\d+:\s*/i, ""));
                      return unique.length > 0 ? (
                        <div className="mb-3">
                          <strong className="text-sm">Sections:</strong>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {unique.map((s, i) => (
                              <Chip key={i} size="sm" variant="flat" color="primary">
                                {s}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      as={NextLink}
                      href={`/courses/${courseType}/${course.courseSlug}`}
                      color="primary"
                      variant="ghost"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Features list */}
                <div className="flex w-64 flex-shrink-0 flex-col justify-center border-l border-default-200 p-5 max-md:w-full max-md:border-l-0 max-md:border-t">
                  <ul className="space-y-3 text-sm text-default-400">
                    <li className="flex items-center gap-2.5">
                      <PlayCircle size={16} className="shrink-0 text-primary" />
                      <span>Intro Video</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <FileText size={16} className="shrink-0 text-primary" />
                      <span>{course.caseCount} Cases Available</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BookOpen size={16} className="shrink-0 text-primary" />
                      <span>Walkthroughs of Findings and Learning Materials</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Video size={16} className="shrink-0 text-default-300" />
                      <span className="flex items-center gap-2">
                        Video Driven Mode
                        <Chip size="sm" variant="flat" color="warning" className="h-5 text-[10px]">
                          Coming Soon
                        </Chip>
                      </span>
                    </li>
                  </ul>
                </div>
              </CardBody>
            </Card>
          ))}
      </div>
    </div>
  );
}
