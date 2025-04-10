"use client"

import { useState, useEffect } from "react"
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
import { LogOut, CreditCard, History, ChevronDown, Shield } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserBankroll } from "@/lib/supabase"

export function UserNav() {
  const { user, currentCharacter, isAuthenticated, login, logout, switchCharacter } = useAuth()
  const [balance, setBalance] = useState<number>(0)

  // Fetch the user's balance when the component mounts or when the user/character changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id && currentCharacter?.id) {
        const userBalance = await getUserBankroll(user.id, currentCharacter.id)
        setBalance(userBalance)
      }
    }

    if (isAuthenticated) {
      fetchBalance()
    }
  }, [user, currentCharacter, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={login}>
          Connexion
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
              <AvatarFallback>
                {currentCharacter 
                  ? `${currentCharacter.firstname.charAt(0)}${currentCharacter.lastname.charAt(0)}` 
                  : (user?.username?.substring(0, 2) || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <div className="text-xs text-muted-foreground">
                {currentCharacter 
                  ? `${currentCharacter.firstname} ${currentCharacter.lastname}` 
                  : (user?.username || "Utilisateur")}
              </div>
              <div className="font-medium text-xs">${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance)}</div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user?.character && user.character.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Personnages
              </div>
              {user.character.map((char) => (
                <DropdownMenuItem 
                  key={char.id} 
                  onClick={() => switchCharacter(char.id)}
                  className={currentCharacter?.id === char.id ? "bg-accent" : ""}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="text-xs">
                      {char.firstname.charAt(0)}{char.lastname.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{char.firstname} {char.lastname}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
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
          {user?.id === 2125 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
