"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, CreditCard, History, ChevronDown } from "lucide-react"

export function UserNav() {
  // État utilisateur simulé - dans une vraie application, cela viendrait de votre système d'authentification
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [balance, setBalance] = useState(1000)

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">Connexion</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Inscription</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 flex items-center gap-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback>HY</AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <div className="text-xs text-muted-foreground">Hana Yoshida</div>
              <div className="font-medium text-xs">${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}</div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/deposit" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Dépôt</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/withdraw" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Retrait</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/history" className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              <span>Historique des Paris</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
