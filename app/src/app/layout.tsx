import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Search Agent",
  description: "Local control panel for the Job Search Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}