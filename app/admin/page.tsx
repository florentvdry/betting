"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAllBets, getAllWithdrawRequests, processWithdrawRequest, WithdrawRequest, Bet } from "@/lib/supabase"
import { format } from "date-fns"

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [adminNote, setAdminNote] = useState<string>("")
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const router = useRouter()

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [betsData, withdrawData] = await Promise.all([
          getAllBets(),
          getAllWithdrawRequests()
        ])

        setBets(betsData)
        setWithdrawRequests(withdrawData)
      } catch (error) {
        console.error("Error fetching admin data:", error)
        toast.error("Échec du chargement des données d'administration")
      }
    }

    if (isAuthenticated && !isLoading && user?.id === 2125) {
      fetchData()
    }
  }, [user, isAuthenticated, isLoading])

  // Handle withdraw request processing
  const handleProcessWithdraw = async (requestId: string, approved: boolean) => {
    setIsProcessing(true)
    setCurrentRequestId(requestId)

    try {
      const result = await processWithdrawRequest(requestId, approved, adminNote)

      if (result) {
        toast.success(`Demande de retrait ${approved ? 'approuvée' : 'refusée'} avec succès`)

        // Refresh the withdraw requests
        const updatedRequests = await getAllWithdrawRequests()
        setWithdrawRequests(updatedRequests)

        // Clear the admin note
        setAdminNote("")
      } else {
        toast.error("Échec du traitement de la demande de retrait")
      }
    } catch (error) {
      console.error("Error processing withdraw request:", error)
      toast.error("Une erreur s'est produite lors du traitement de la demande de retrait")
    } finally {
      setIsProcessing(false)
      setCurrentRequestId(null)
    }
  }

  // If not authenticated or not admin, redirect to home
  if (!isLoading && (!isAuthenticated || user?.id !== 2125)) {
    router.push("/")
    return null
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Panneau d'Administration</h1>

      <Tabs defaultValue="bets">
        <TabsList className="mb-4">
          <TabsTrigger value="bets">Tous les Paris</TabsTrigger>
          <TabsTrigger value="withdraws">Demandes de Retrait</TabsTrigger>
        </TabsList>

        <TabsContent value="bets">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Paris</CardTitle>
              <CardDescription>Voir tous les paris placés par les utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">ID Utilisateur</th>
                      <th className="text-left p-2">ID Personnage</th>
                      <th className="text-left p-2">Match</th>
                      <th className="text-left p-2">Montant</th>
                      <th className="text-left p-2">Cotes</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.length > 0 ? (
                      bets.map((bet) => (
                        <tr key={bet.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{format(new Date(bet.created_at), 'yyyy-MM-dd HH:mm')}</td>
                          <td className="p-2">{bet.user_id}</td>
                          <td className="p-2">{bet.character_id}</td>
                          <td className="p-2">
                            {bet.match_data ? (
                              <span>{bet.match_data.teamA} vs {bet.match_data.teamB}</span>
                            ) : (
                              <span>Match ID: {bet.match_id}</span>
                            )}
                          </td>
                          <td className="p-2">${bet.amount.toFixed(2)}</td>
                          <td className="p-2">{bet.odds.toFixed(2)}</td>
                          <td className="p-2">{bet.bet_type}</td>
                          <td className="p-2">{bet.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-muted-foreground">
                          Aucun pari trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraws">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Retrait</CardTitle>
              <CardDescription>Gérer les demandes de retrait des utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">ID Utilisateur</th>
                      <th className="text-left p-2">ID Personnage</th>
                      <th className="text-left p-2">Montant</th>
                      <th className="text-left p-2">Statut</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRequests.length > 0 ? (
                      withdrawRequests.map((request) => (
                        <tr key={request.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{format(new Date(request.created_at), 'yyyy-MM-dd HH:mm')}</td>
                          <td className="p-2">{request.user_id}</td>
                          <td className="p-2">{request.character_id}</td>
                          <td className="p-2">${request.amount.toFixed(2)}</td>
                          <td className="p-2">{request.status}</td>
                          <td className="p-2">
                            {request.status === 'pending' && (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    onClick={() => handleProcessWithdraw(request.id, true)}
                                    disabled={isProcessing && currentRequestId === request.id}
                                  >
                                    {isProcessing && currentRequestId === request.id ? "Traitement en cours..." : "Approuver"}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => handleProcessWithdraw(request.id, false)}
                                    disabled={isProcessing && currentRequestId === request.id}
                                  >
                                    {isProcessing && currentRequestId === request.id ? "Traitement en cours..." : "Refuser"}
                                  </Button>
                                </div>
                                <div className="mt-2">
                                  <Input
                                    placeholder="Note d'administration (requise pour le refus)"
                                    value={currentRequestId === request.id ? adminNote : ""}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    disabled={isProcessing && currentRequestId === request.id}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          Aucune demande de retrait trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
