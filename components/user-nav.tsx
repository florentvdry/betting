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
import { LogOut, CreditCard, History, ChevronDown, Shield, Bell, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getUserBankroll, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "@/lib/supabase"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function UserNav() {
  const { user, currentCharacter, isAuthenticated, login, logout, switchCharacter } = useAuth()
  const [balance, setBalance] = useState<number>(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false)

  // Fetch the user's balance and notifications when the component mounts or when the user/character changes
  useEffect(() => {
    const fetchData = async () => {
      if (user?.id && currentCharacter?.id) {
        // Fetch balance
        const userBalance = await getUserBankroll(user.id, currentCharacter.id)
        setBalance(userBalance)

        // Fetch notifications
        setIsLoadingNotifications(true)
        try {
          const userNotifications = await getUserNotifications(user.id, currentCharacter.id)
          setNotifications(userNotifications)
        } catch (error) {
          console.error('Error fetching notifications:', error)
        } finally {
          setIsLoadingNotifications(false)
        }
      }
    }

    if (isAuthenticated) {
      fetchData()
    }
  }, [user, currentCharacter, isAuthenticated])

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId)
    // Update the local state
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    ))
  }

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id || !currentCharacter?.id) return

    await markAllNotificationsAsRead(user.id, currentCharacter.id)
    // Update the local state
    setNotifications(notifications.map(notification => ({ ...notification, read: true })))
  }

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length

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
      {/* Notifications Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs flex items-center gap-1"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-3 w-3" />
                <span>Tout marquer comme lu</span>
              </Button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 ${!notification.read ? 'bg-muted/20' : ''}`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">
                      {notification.type === 'withdraw_rejected' && 'Retrait refusé'}
                      {notification.type === 'bet_won' && 'Pari gagné'}
                      {notification.type === 'bet_lost' && 'Pari perdu'}
                      {notification.type === 'deposit_success' && 'Dépôt réussi'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-muted-foreground">
                Aucune notification
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Dropdown */}
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
