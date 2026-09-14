import "./globals.css";
import ThemeScript from "@/components/common/ThemeScript.jsx";
import ThemeApplier from "@/components/common/ThemeApplier.jsx";

export const metadata = {
  title: "MokiBox — Short Video",
  description: "MokiBox — short videos, your way.",
  icons: {
    icon: "/icon.jpg",
    shortcut: "/icon.jpg",
    apple: "/icon.jpg",
  },
  openGraph: {
    title: "MokiBox",
    description: "MokiBox — short videos, your way.",
    images: ["/opengraph-image.jpg"],
  },
};

export const viewport = {
  themeColor: "#F8E8C8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-moki-bg text-moki-text antialiased min-h-screen">
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
