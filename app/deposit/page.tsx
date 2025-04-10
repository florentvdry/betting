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
  const [token, setToken] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [rawContent, setRawContent] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
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

  // Function to get the payment URL
  const getPaymentUrl = async () => {
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
      const response = await fetch("/api/banking/deposit", {
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

      // Store the raw content from the API response
      if (data.rawContent) {
        setRawContent(data.rawContent)
      }

      // Store the payment URL
      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl)
        toast.info("Veuillez cliquer sur le lien de paiement, puis entrer le token reçu")
      } else {
        toast.error(data.message || "Erreur lors de la génération du lien de paiement")
      }
    } catch (error) {
      console.error("Payment URL error:", error)
      toast.error("Une erreur s'est produite lors de la génération du lien de paiement")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to complete the payment with a token
  const handleDeposit = async () => {
    if (!user?.id || !currentCharacter?.id) {
      toast.error("Vous devez être connecté pour effectuer un dépôt")
      return
    }

    if (!token) {
      toast.error("Veuillez entrer un token")
      return
    }

    const depositAmount = Number(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/banking/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          characterId: currentCharacter.id,
          amount: depositAmount,
          token: token,
        }),
      })

      const data = await response.json()

      // Store the raw content from the API response
      if (data.rawContent) {
        setRawContent(data.rawContent)
      }

      if (data.success) {
        toast.success(data.message)
        // Refresh the balance
        const newBalance = await getUserBankroll(user.id, currentCharacter.id)
        setBalance(newBalance)
        // Clear the form
        setAmount("")
        setToken("")
        setPaymentUrl(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Deposit error:", error)
      toast.error("Une erreur s'est produite lors du traitement de votre dépôt")
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
                  disabled={isSubmitting || paymentUrl !== null}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3">
                {[5000, 10000, 15000, 20000].map((value) => (
                  <Button 
                    key={value} 
                    variant="outline" 
                    onClick={() => setAmount(value.toString())} 
                    className="w-full"
                    disabled={isSubmitting || paymentUrl !== null}
                  >
                    ${new Intl.NumberFormat('fr-FR').format(value)}
                  </Button>
                ))}
              </div>

              {paymentUrl && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Lien de Paiement</h3>
                  <div className="flex items-center space-x-2">
                    <a 
                      href={paymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline break-all"
                    >
                      {paymentUrl}
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentUrl);
                        toast.success("Lien copié dans le presse-papier");
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cliquez sur le lien pour effectuer le paiement, puis entrez le token reçu ci-dessous.
                  </p>
                </div>
              )}

              {paymentUrl && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="token">Token de Paiement</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Entrez le token reçu après le paiement"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="pt-4">
                {!paymentUrl ? (
                  <Button 
                    onClick={getPaymentUrl} 
                    disabled={!amount || Number.parseFloat(amount) <= 0 || isSubmitting} 
                    className="w-full"
                  >
                    {isSubmitting ? "Génération du lien..." : "Générer le Lien de Paiement"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDeposit} 
                    disabled={!token || isSubmitting} 
                    className="w-full"
                  >
                    {isSubmitting ? "Traitement en cours..." : "Valider le Paiement"}
                  </Button>
                )}
              </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start space-y-4 w-full">
          <p className="text-sm text-muted-foreground">
            Note: Le dépot est instantané, mais peut prendre quelques minutes à s'afficher sur votre relevé Fleeca.
          </p>

          {rawContent && (
            <div className="w-full border rounded-md p-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Réponse de l'API Fleeca</h3>
              <div className="bg-muted p-3 rounded-md overflow-x-auto">
                <pre className="text-xs whitespace-pre-wrap break-all">{rawContent}</pre>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
