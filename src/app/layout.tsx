import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { TopBar } from "@/components/TopBar";
import "./globals.css";

const wizardry = localFont({
  src: "../fonts/Wizardry-9XP0.ttf",
  variable: "--font-wizardry",
});

const ichigayaMincho = localFont({
  src: "../fonts/Ichigayamincho-9MAv0.ttf",
  variable: "--font-ichigaya-mincho",
});

export const metadata: Metadata = {
  title: "Syzygy",
  description:
    "A generative tarot-and-astrology oracle — Major Arcana drawn against today's real planetary transits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${wizardry.variable} ${ichigayaMincho.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider afterSignOutUrl="/">
          <ConvexClientProvider>
            <TopBar />
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
