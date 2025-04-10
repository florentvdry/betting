"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DepositPage() {
  const [amount, setAmount] = useState<string>("")

  const handleDeposit = () => {
    // Dans une implémentation réelle, cela appellerait votre API
    alert(`Dépôt de ${amount}€ traité avec succès!`)
    setAmount("")
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">Déposer des Fonds</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter des Fonds à Votre Compte</CardTitle>
          <CardDescription>Choisissez votre méthode de dépôt préférée et le montant</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="game" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="game">Monnaie du Jeu</TabsTrigger>
              <TabsTrigger value="other">Autres Méthodes</TabsTrigger>
            </TabsList>

            <TabsContent value="game" className="mt-4 space-y-4">
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

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((value) => (
                  <Button key={value} variant="outline" onClick={() => setAmount(value.toString())} className="w-full">
                    {value}€
                  </Button>
                ))}
              </div>

              <div className="pt-4">
                <Button onClick={handleDeposit} disabled={!amount || Number.parseFloat(amount) <= 0} className="w-full">
                  Déposer Maintenant
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="other" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                Les autres méthodes de paiement ne sont pas disponibles sur le serveur roleplay.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            Note: Cela utilisera votre monnaie en jeu du serveur roleplay.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
