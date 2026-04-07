import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MUMAA - AI Parenting Companion | Video Consultations with Expert Nannies",
  description:
    "Connect with expert nannies via video call for newborn care, sleep training, lactation support, and more. Instant or scheduled consultations available 24/7.",
  keywords: [
    "MUMAA",
    "parenting",
    "nanny",
    "video consultation",
    "newborn care",
    "sleep training",
    "lactation",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} antialiased`}
        style={{ fontFamily: "var(--font-quicksand), sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
