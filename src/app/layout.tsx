import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--cairo",
  subsets: ["arabic", "latin"],
});

const tajawal = Tajawal({
  variable: "--tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "UMI PAY — نظام تصميم أومني باي | ويب وموبايل",
  description:
    "نظام تصميم متكامل لتطبيق أومني باي: شاشات موبايل تفاعلية ولوحة تحكم ويب — هوية ذهبية على خلفية داكنة، عربي أولاً، جاهزة للتنفيذ بـ Flutter.",
  keywords: ["UMI PAY", "أومني باي", "تصميم UI", "Flutter", "محفظة رقمية", "fintech"],
  authors: [{ name: "Z.ai" }],
  openGraph: {
    title: "UMI PAY — نظام تصميم أومني باي",
    description: "شاشات الموبايل والويب — هوية ذهبية داكنة، RTL أولاً",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} antialiased bg-[#0A0416] text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
