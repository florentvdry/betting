"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  league: string
  teamA: string
  teamB: string
  time: string
  odds: {
    home: number
    draw: number
    away: number
  }
  featured?: boolean
  compact?: boolean
  id?: number
}

export function MatchCard({ league, teamA, teamB, time, odds, featured = false, compact = false, id }: MatchCardProps) {
  const [selectedOdd, setSelectedOdd] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState<string>("")
  const [showBetSlip, setShowBetSlip] = useState<boolean>(false)
  const [currentOdds, setCurrentOdds] = useState(odds)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleOddClick = (type: string) => {
    setSelectedOdd(type)
    setShowBetSlip(true)
  }

  const handlePlaceBet = () => {
    // Dans une implémentation réelle, cela appellerait votre API
    alert(
      `Pari placé: ${selectedOdd === "home" ? teamA : selectedOdd === "away" ? teamB : "Nul"} pour ${teamA} vs ${teamB}, montant: ${betAmount}€`,
    )
    setSelectedOdd(null)
    setBetAmount("")
    setShowBetSlip(false)
  }

  const refreshOdds = async () => {
    if (!id || isRefreshing) return

    setIsRefreshing(true)

    try {
      const response = await fetch(`/api/odds?matchId=${id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.odds) {
          setCurrentOdds(data.odds)
        }
      }
    } catch (error) {
      console.error("Échec du rafraîchissement des cotes:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Suppression de l'actualisation automatique des cotes

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        featured && "border-primary/50 shadow-md",
        compact ? "p-2" : "p-4",
      )}
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{league}</span>
            {featured && (
              <Badge variant="outline" className="bg-primary/10">
                <Star className="h-3 w-3 mr-1" /> À la une
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {time}
            </div>
            {id && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshOdds} disabled={isRefreshing}>
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                <span className="sr-only">Rafraîchir les cotes</span>
              </Button>
            )}
          </div>
        </div>

        <div className={cn("grid", compact ? "grid-cols-2" : "grid-cols-1 gap-2")}>
          <div className={cn(compact ? "pr-2" : "mb-3")}>
            <h3 className={cn("font-semibold", compact ? "text-sm" : "text-lg")}>
              {teamA} vs {teamB}
            </h3>
          </div>

          <div className="flex gap-2">
            <Button
              variant={selectedOdd === "home" ? "default" : "outline"}
              size="sm"
              className="flex-1 font-mono"
              onClick={() => handleOddClick("home")}
            >
              {currentOdds.home.toFixed(2)}
            </Button>
            <Button
              variant={selectedOdd === "draw" ? "default" : "outline"}
              size="sm"
              className="flex-1 font-mono"
              onClick={() => handleOddClick("draw")}
            >
              {currentOdds.draw.toFixed(2)}
            </Button>
            <Button
              variant={selectedOdd === "away" ? "default" : "outline"}
              size="sm"
              className="flex-1 font-mono"
              onClick={() => handleOddClick("away")}
            >
              {currentOdds.away.toFixed(2)}
            </Button>
          </div>
        </div>

        {showBetSlip && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-sm mb-2">
              <span className="font-medium">Votre pari: </span>
              {selectedOdd === "home" ? teamA : selectedOdd === "away" ? teamB : "Nul"} @{" "}
              {selectedOdd === "home"
                ? currentOdds.home.toFixed(2)
                : selectedOdd === "draw"
                  ? currentOdds.draw.toFixed(2)
                  : currentOdds.away.toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Montant"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handlePlaceBet} disabled={!betAmount}>
                Parier
              </Button>
            </div>
            {betAmount && (
              <div className="text-xs mt-2 text-right">
                Gain potentiel:{" "}
                {(
                  Number.parseFloat(betAmount) *
                  (selectedOdd === "home"
                    ? currentOdds.home
                    : selectedOdd === "draw"
                      ? currentOdds.draw
                      : currentOdds.away)
                ).toFixed(2)}
                €
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
