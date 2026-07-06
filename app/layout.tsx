import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "剋擇擇日",
  description: "依《剋擇講義》擇吉：嫁娶、安牀、出行",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "剋擇擇日",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
