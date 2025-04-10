"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = () => {
    setIsLoading(true)
    setError(null)

    try {
      login()
    } catch (err) {
      console.error("Error during login redirect:", err)
      setError("Une erreur s'est produite lors de la redirection vers la page d'authentification.")
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte GTA World pour accéder à votre profil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Cliquez sur le bouton ci-dessous pour vous connecter avec votre compte GTA World.
              Vous serez redirigé vers la page d'authentification de GTA World.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleLogin} 
            disabled={isLoading}
          >
            {isLoading ? "Redirection..." : "Se connecter avec GTA World"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
