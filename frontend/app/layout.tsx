import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusTape",
  description: "A quiet studio for turning songs into keepsakes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
