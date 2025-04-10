"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function DepositPage() {
  const [amount, setAmount] = useState<string>("")

  const handleDeposit = () => {
    alert(`Dépôt de ${amount}€ traité avec succès!`)
    setAmount("")
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Déposer des Fonds</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter des Fonds à Votre Compte</CardTitle>
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
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3">
                {[5000, 10000, 15000, 20000].map((value) => (
                  <Button key={value} variant="outline" onClick={() => setAmount(value.toString())} className="w-full">
                    ${new Intl.NumberFormat('fr-FR').format(value)}
                  </Button>
                ))}
              </div>

              <div className="pt-4">
                <Button onClick={handleDeposit} disabled={!amount || Number.parseFloat(amount) <= 0} className="w-full">
                  Déposer Maintenant
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
