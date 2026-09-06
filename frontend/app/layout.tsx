import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Digital Marketplace — Premium Digital Products",
    template: "%s | Digital Marketplace",
  },
  description:
    "Download premium digital products instantly after secure payment. Courses, templates, guides, and more.",
  keywords: ["digital products", "download", "templates", "courses", "Nigeria"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://digitalmarketplace.com",
    siteName: "Digital Marketplace",
    title: "Digital Marketplace — Premium Digital Products",
    description: "Premium digital products delivered instantly to your inbox.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Marketplace",
    description: "Premium digital products delivered instantly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
