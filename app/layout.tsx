import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Los Santos Betting",
  description: "Site de paris sportifs pour serveur RolePlay",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold">LSBetting</span>
              </Link>
              <nav className="ml-auto flex items-center gap-4">
                <Link href="/matches" className="text-sm font-medium">
                  Sports
                </Link>
                <Link href="/live" className="text-sm font-medium">
                  Direct
                </Link>
                <Link href="/my-bets" className="text-sm font-medium">
                  Mes Paris
                </Link>
                <UserNav />
              </nav>
            </div>
          </header>
          <main className="flex-1 container mx-auto">{children}</main>
          <footer className="border-t py-6">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Tous droits réservés.
              </p>
              <div className="flex gap-4">
                <Link href="https://fr.gta.world/" target={'_blank'} className="text-sm text-muted-foreground hover:underline">
                  Site fictif destiné au serveur de jeu GTAWorld
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}


import './globals.css'