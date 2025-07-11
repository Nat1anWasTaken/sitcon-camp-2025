import { GlobalAuthWrapper } from "@/components/global-auth-wrapper";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { MobileNavProvider } from "@/lib/contexts/mobile-nav-context";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SITCON Camp 2025 - 聯絡人管理系統",
  description: "智能聯絡人管理系統，整合 AI 助手功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex flex-col min-h-screen">
          <Providers>
            <GlobalAuthWrapper>
              <MobileNavProvider>
                <Navbar />
                <main className="flex-1">{children}</main>
              </MobileNavProvider>
            </GlobalAuthWrapper>
          </Providers>
        </div>
      </body>
    </html>
  );
}
