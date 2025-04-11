"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserBankroll } from "@/lib/supabase"

export default function DepositCallbackPage() {
  const { user, currentCharacter, isAuthenticated, isLoading } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("Vérification de votre paiement...")
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const processPayment = async () => {
      if (!user?.id || !currentCharacter?.id) {
        setStatus("error")
        setMessage("Vous devez être connecté pour effectuer un dépôt")
        return
      }

      try {
        // Get the amount from localStorage
        const amount = localStorage.getItem('pendingDepositAmount')
        if (!amount) {
          setStatus("error")
          setMessage("Impossible de récupérer les informations de paiement")
          return
        }

        // Process the payment
        const response = await fetch("/api/banking/deposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            characterId: currentCharacter.id,
            amount: Number(amount),
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Clear the pending deposit amount
          localStorage.removeItem('pendingDepositAmount')

          // Get the new balance
          const userBalance = await getUserBankroll(user.id, currentCharacter.id)
          setNewBalance(userBalance)

          setStatus("success")
          setMessage(data.message)

          // Redirect back to the deposit page after a short delay
          setTimeout(() => {
            router.push("/deposit?success=true")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.message || "Une erreur s'est produite lors du traitement de votre paiement")
        }
      } catch (error) {
        console.error("Payment processing error:", error)
        setStatus("error")
        setMessage("Une erreur s'est produite lors du traitement de votre paiement")
      }
    }

    if (isAuthenticated && !isLoading) {
      processPayment()
    }
  }, [user, currentCharacter, isAuthenticated, isLoading, router])

  const handleReturn = () => {
    router.push("/deposit")
  }

  // If not authenticated, redirect to login
  if (!isLoading && !isAuthenticated) {
    router.push("/")
    return null
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Statut du Dépôt</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {status === "loading" && "Traitement du Paiement"}
            {status === "success" && "Paiement Réussi"}
            {status === "error" && "Erreur de Paiement"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            {status === "loading" && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            <p className="mt-4">{message}</p>

            {status === "success" && newBalance !== null && (
              <p className="mt-2 font-semibold">
                Votre nouveau solde: ${newBalance.toFixed(2)}
              </p>
            )}
          </div>

          {status !== "loading" && (
            <Button onClick={handleReturn} className="w-full mt-4">
              Retourner à la page de dépôt
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
