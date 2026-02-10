import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WeWatch - Sync Your Experience",
  description: "Watch movies together from different places, perfectly synced. Chat, voice messages, and room sharing.",
  keywords: "watch together, movie sync, collaborative streaming, wewatch, movie party",
};

import { RoomProvider } from "@/context/RoomContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RoomProvider>
          {children}
        </RoomProvider>
      </body>
    </html>
  );
}
