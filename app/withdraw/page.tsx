"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { getUserBankroll } from "@/lib/supabase"

export default function WithdrawPage() {
  const { user, currentCharacter, isAuthenticated, isLoading } = useAuth()
  const [amount, setAmount] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const router = useRouter()

  // Fetch the user's balance when the component mounts
  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id && currentCharacter?.id) {
        const userBalance = await getUserBankroll(user.id, currentCharacter.id)
        setBalance(userBalance)
      }
    }

    if (isAuthenticated && !isLoading) {
      fetchBalance()
    }
  }, [user, currentCharacter, isAuthenticated, isLoading])

  const handleWithdraw = async () => {
    if (!user?.id || !currentCharacter?.id) {
      toast.error("Vous devez être connecté pour effectuer un retrait")
      return
    }

    const withdrawAmount = Number(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }

    if (withdrawAmount > balance) {
      toast.error("Solde insuffisant")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/banking/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          characterId: currentCharacter.id,
          amount: withdrawAmount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        // Clear the form
        setAmount("")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Withdraw error:", error)
      toast.error("Une erreur s'est produite lors du traitement de votre demande de retrait")
    } finally {
      setIsSubmitting(false)
    }
  }

  // If not authenticated, redirect to login
  if (!isLoading && !isAuthenticated) {
    router.push("/")
    return null
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Retirer des Fonds</h1>

      <Card>
        <CardHeader>
          <CardTitle>Retirer des Fonds vers le Jeu</CardTitle>
          <CardDescription>Transférez vos gains vers votre compte de jeu</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">Solde Disponible</div>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant à Retirer</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={balance}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setAmount((balance / 2).toString())} 
              className="w-full"
              disabled={isSubmitting || balance <= 0}
            >
              Moitié
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAmount(balance.toString())} 
              className="w-full"
              disabled={isSubmitting || balance <= 0}
            >
              Maximum
            </Button>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > balance || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Traitement en cours..." : "Retirer Maintenant"}
          </Button>

          <p className="text-sm text-muted-foreground">
            Note: Les demandes de retrait sont examinées par un administrateur et peuvent prendre jusqu'à 24 heures.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            Vous recevrez une notification lorsque votre demande sera traitée.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
