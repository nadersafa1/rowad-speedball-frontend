import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/navigation/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpeedballHub - Rowad Club",
  description:
    "A comprehensive web application for managing speedball sport data for Rowad club",
  keywords: "speedball, rowad, sport, analytics, performance",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
};

export default RootLayout;
