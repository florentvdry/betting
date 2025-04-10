"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function WithdrawPage() {
  const [amount, setAmount] = useState<string>("")
  const [balance] = useState<number>(1000) // Dans une vraie application, cela viendrait de votre API

  const handleWithdraw = () => {
    // Dans une implémentation réelle, cela appellerait votre API
    alert(`Retrait de ${amount}€ traité avec succès!`)
    setAmount("")
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
            <div className="text-2xl font-bold">{balance.toFixed(2)}€</div>
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
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setAmount((balance / 2).toString())} className="w-full">
              Moitié
            </Button>
            <Button variant="outline" onClick={() => setAmount(balance.toString())} className="w-full">
              Maximum
            </Button>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={!amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > balance}
            className="w-full"
          >
            Retirer Maintenant
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">Note: Les virements sont instantanés, mais peuvent prendre quelques minutes.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
