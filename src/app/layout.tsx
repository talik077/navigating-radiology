import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCourseIndex } from "@/lib/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Navigating Radiology",
  description: "Master radiology with expert-led, case-based courses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Header courseTypes={getCourseIndex().courseTypes.map((ct) => ({
            slug: ct.slug,
            name: ct.name,
            courses: ct.courses.map((c) => ({
              courseSlug: c.courseSlug,
              courseName: c.courseName,
              caseCount: c.caseCount,
            })),
          }))} />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
