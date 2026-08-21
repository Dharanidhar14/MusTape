import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "MusTape",
  description: "A quiet studio for turning songs into keepsakes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider clientId={clientId}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
