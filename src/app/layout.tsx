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
  title: "UMI PAY — بوابة الدفع | تطبيق موبايل حي",
  description:
    "تطبيق موبايل لبوابة دفع أومي باي: محفظة بعملة OMI الثابتة (1 OMI = 0.0005$) والليرة السورية بديلة يدير سعرها أدمن المحفظة — تحويلات، متاجر، شات، حسابات أبناء — متصل بقاعدة بيانات حية (Prisma + SQLite).",
  keywords: ["UMI PAY", "أومي باي", "OMI", "عملة OMI", "ليرة سورية", "بوابة دفع", "محفظة رقمية", "fintech", "Flutter", "RTL"],
  authors: [{ name: "Z.ai" }],
  openGraph: {
    title: "UMI PAY — بوابة الدفع | تطبيق موبايل حي",
    description: "محفظة وبوابة دفع متصلة بقاعدة بيانات حية — عربي RTL أولاً",
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
