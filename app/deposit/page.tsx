"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { getUserBankroll } from "@/lib/supabase"

export default function DepositPage() {
  const { user, currentCharacter, isAuthenticated, isLoading } = useAuth()
  const [amount, setAmount] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [balance, setBalance] = useState<number | null>(null)
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

  // Check for successful payment return
  useEffect(() => {
    // Check if we're returning from a successful payment
    const successParam = new URLSearchParams(window.location.search).get('success')
    if (successParam === 'true') {
      // Show success message
      toast.success("Votre dépôt a été traité avec succès!")

      // Remove the success parameter from the URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)

      // Refresh the balance
      if (user?.id && currentCharacter?.id) {
        getUserBankroll(user.id, currentCharacter.id).then(newBalance => {
          setBalance(newBalance)
        })
      }
    }
  }, [])

  const handleDeposit = async () => {
    if (!user?.id || !currentCharacter?.id) {
      toast.error("Vous devez être connecté pour effectuer un dépôt")
      return
    }

    const depositAmount = Number(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }

    setIsSubmitting(true)

    try {
      // Get the payment URL from the API
      const response = await fetch("/api/banking/deposit/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          characterId: currentCharacter.id,
          amount: depositAmount,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store the current amount for the success message
        localStorage.setItem('pendingDepositAmount', depositAmount.toString())

        // Redirect to the Fleeca payment URL
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.message)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Deposit error:", error)
      toast.error("Une erreur s'est produite lors du traitement de votre dépôt")
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
      <h1 className="text-3xl font-bold mb-6 text-center">Déposer des Fonds</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter des Fonds à Votre Compte</CardTitle>
          {balance !== null && (
            <p className="text-sm text-muted-foreground mt-2">
              Solde actuel: ${balance.toFixed(2)}
            </p>
          )}
        </CardHeader>

        <CardContent>
              <div className="space-y-2">
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3">
                {[5000, 10000, 15000, 20000].map((value) => (
                  <Button 
                    key={value} 
                    variant="outline" 
                    onClick={() => setAmount(value.toString())} 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    ${new Intl.NumberFormat('fr-FR').format(value)}
                  </Button>
                ))}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleDeposit} 
                  disabled={!amount || Number.parseFloat(amount) <= 0 || isSubmitting} 
                  className="w-full"
                >
                  {isSubmitting ? "Traitement en cours..." : "Déposer Maintenant"}
                </Button>
              </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            Note: Le dépot est instantané, mais peut prendre quelques minutes à s'afficher sur votre relevé Fleeca.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
