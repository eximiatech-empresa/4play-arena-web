import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "4Play Arena",
  description: "Gestão inteligente de horas de tênis",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        // NOTE: theme-orange class is applied by the inline script below (FOUT prevention)
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        "font-sans"
      )}
    >
      {/* Inline script: apply theme-orange BEFORE paint to eliminate flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('4play-brand-theme')==='orange')document.documentElement.classList.add('theme-orange')}catch(e){}`,
        }}
      />
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
