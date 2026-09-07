import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "DigiStore — Premium Digital Products",
    template: "%s | DigiStore",
  },
  description:
    "Download premium digital products instantly after secure payment. Courses, templates, guides, and more.",
  keywords: ["digital products", "download", "templates", "courses", "Nigeria"],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "DigiStore",
    title: "DigiStore — Premium Digital Products",
    description: "Premium digital products delivered instantly to your inbox.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: { fontFamily: "Inter, sans-serif" },
          }}
        />
      </body>
    </html>
  );
}
