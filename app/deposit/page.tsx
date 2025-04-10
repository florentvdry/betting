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
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false)
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

  // Function to generate the payment URL based on the amount
  useEffect(() => {
    if (amount && user?.id && currentCharacter?.id) {
      const depositAmount = Number(amount)
      if (!isNaN(depositAmount) && depositAmount > 0) {
        // Construct the payment URL directly
        const gatewayUrl = process.env.NEXT_PUBLIC_FLEECA_GATEWAY_URL || 'http://banking.gta.world/gateway/';
        const authKey = process.env.NEXT_PUBLIC_FLEECA_AUTH_KEY || 'DvmI9O0yKHH5oHpZov9k2E9qLmRGi4TvH9LbAztW3u0aI22FoHxyT4S4GVU7Jrna';
        const url = `${gatewayUrl}${authKey}/0/${depositAmount}`;
        setPaymentUrl(url);
      } else {
        setPaymentUrl(null);
      }
    } else {
      setPaymentUrl(null);
    }
  }, [amount, user, currentCharacter]);

  // Function to handle the deposit button click
  const handleDepositClick = () => {
    if (!paymentUrl) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    // Open the payment URL in a new window
    window.open(paymentUrl, '_blank');

    // Show the token input field
    setShowTokenInput(true);
    toast.info("Après avoir effectué le paiement, entrez le token reçu ci-dessous");
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
      // First, validate the token directly
      const tokenUrl = process.env.NEXT_PUBLIC_FLEECA_TOKEN_URL || 'http://banking.gta.world/gateway_token/';

      // Make a direct POST request to the token URL
      const tokenResponse = await fetch(`${tokenUrl}${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Get the raw response
      const rawResponse = await tokenResponse.text();
      setRawContent(rawResponse);

      // Try to parse the response as JSON
      let tokenData;
      try {
        tokenData = JSON.parse(rawResponse);
      } catch (e) {
        toast.error("Erreur lors de la validation du token: réponse invalide");
        console.error("Invalid token response:", rawResponse);
        setIsSubmitting(false);
        return;
      }

      // Check if the payment was successful
      if (tokenData.message === 'successful_payment') {
        // Now update the user's balance through our API
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
        });

        const data = await response.json();

        if (data.success) {
          toast.success(data.message);
          // Refresh the balance
          const newBalance = await getUserBankroll(user.id, currentCharacter.id);
          setBalance(newBalance);
          // Clear the form
          setAmount("");
          setToken("");
          setPaymentUrl(null);
          setShowTokenInput(false);
        } else {
          toast.error(data.message);
        }
      } else {
        toast.error(`Erreur de paiement: ${tokenData.message || 'Échec de la validation du token'}`);
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Une erreur s'est produite lors du traitement de votre dépôt");
    } finally {
      setIsSubmitting(false);
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

              {showTokenInput && (
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
                {!showTokenInput ? (
                  <Button 
                    onClick={handleDepositClick} 
                    disabled={!amount || Number.parseFloat(amount) <= 0 || isSubmitting} 
                    className="w-full"
                  >
                    {isSubmitting ? "Traitement en cours..." : "Déposer Maintenant"}
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
