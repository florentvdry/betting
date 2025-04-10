import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MyBetsPage() {
  // Dans une implémentation réelle, ces données viendraient de votre API
  const activeBets = [
    {
      id: 1,
      match: "Arsenal vs Manchester United",
      selection: "Arsenal",
      odds: 2.1,
      stake: 50,
      potentialWin: 105,
      date: "2023-04-10",
      status: "active",
    },
    {
      id: 2,
      match: "Barcelona vs Real Madrid",
      selection: "Nul",
      odds: 3.5,
      stake: 20,
      potentialWin: 70,
      date: "2023-04-11",
      status: "active",
    },
  ]

  const settledBets = [
    {
      id: 3,
      match: "Liverpool vs Manchester City",
      selection: "Liverpool",
      odds: 2.4,
      stake: 30,
      result: 72,
      date: "2023-04-08",
      status: "won",
    },
    {
      id: 4,
      match: "Chelsea vs Tottenham",
      selection: "Chelsea",
      odds: 2.2,
      stake: 25,
      result: 0,
      date: "2023-04-07",
      status: "lost",
    },
    {
      id: 5,
      match: "Bayern Munich vs Borussia Dortmund",
      selection: "Bayern Munich",
      odds: 1.65,
      stake: 40,
      result: 66,
      date: "2023-04-05",
      status: "won",
    },
  ]

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Mes Paris</h1>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Paris Actifs</TabsTrigger>
          <TabsTrigger value="settled">Paris Réglés</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeBets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Vous n'avez aucun pari actif.</div>
          ) : (
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{bet.match}</div>
                      <Badge variant="outline" className="bg-primary/10">
                        Actif
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{new Date(bet.date).toLocaleDateString()}</div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Sélection</div>
                        <div>
                          {bet.selection} @ {bet.odds.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Mise</div>
                        <div>{bet.stake.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Gain Potentiel</div>
                        <div>{bet.potentialWin.toFixed(2)}€</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settled" className="mt-4">
          {settledBets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Vous n'avez aucun pari réglé.</div>
          ) : (
            <div className="space-y-4">
              {settledBets.map((bet) => (
                <Card key={bet.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{bet.match}</div>
                      <Badge
                        variant="outline"
                        className={
                          bet.status === "won" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        }
                      >
                        {bet.status === "won" ? "Gagné" : "Perdu"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{new Date(bet.date).toLocaleDateString()}</div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Sélection</div>
                        <div>
                          {bet.selection} @ {bet.odds.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Mise</div>
                        <div>{bet.stake.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Résultat</div>
                        <div className={bet.status === "won" ? "text-green-500" : "text-red-500"}>
                          {bet.result.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
