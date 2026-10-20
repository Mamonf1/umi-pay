import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaRegister } from "@/components/umi/real/pwa";

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
    "تطبيق موبايل لبوابة دفع أومي باي: محفظة بالليرة السورية مع مكافئ الدولار ونقاط أومي كنظام مكافآت — تحويلات، متاجر، قروض، بطاقة تميز — متصل بقاعدة بيانات حية (Prisma + SQLite).",
  keywords: ["UMI PAY", "أومي باي", "نقاط أومي", "دولار", "ليرة سورية", "بوابة دفع", "محفظة رقمية", "fintech", "Flutter", "RTL"],
  authors: [{ name: "Z.ai" }],
  manifest: "/manifest.webmanifest",
  applicationName: "أومي باي",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "أومي باي",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "UMI PAY — بوابة الدفع | تطبيق موبايل حي",
    description: "محفظة وبوابة دفع متصلة بقاعدة بيانات حية — عربي RTL أولاً",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05030c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
        <PwaRegister />
      </body>
    </html>
  );
}
