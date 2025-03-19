// src/app/layout.tsx
import type { Metadata } from "next"
import { Red_Hat_Display } from "next/font/google"
import "./globals.css"
import { AppProvider } from "@/components/shared/AppProvider"

const redHat = Red_Hat_Display({ 
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-red-hat"
})

export const metadata: Metadata = {
  title: "American Wholesalers Catalog | Premium Wholesale Supplies",
  description: "Supplying Upstate NY's businesses with premium wholesale products",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={redHat.variable}>
      <body className={redHat.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}