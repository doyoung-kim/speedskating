import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { SiteNav } from "@/components/site-nav";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Speedskate",
  description: "스피드스케이팅 공인기록 검색과 대회 결과",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="h-16 border-b" />}>
            <SiteNav />
          </Suspense>
          <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 py-8 pb-24 md:pb-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
