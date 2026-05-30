import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SocketProvider } from "@/components/providers/SocketProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movee — Ride when you need it",
  description: "Modern ride-sharing for riders and drivers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
