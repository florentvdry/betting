"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

// Client component that uses useSearchParams
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("Traitement de l'authentification...")
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      setMessage(`Erreur d'authentification: ${error}`)
      return
    }

    if (!code) {
      setStatus("error")
      setMessage("Code d'autorisation manquant. Impossible de procéder à l'authentification.")
      return
    }

    // Exchange the authorization code for an access token
    exchangeCodeForToken(code)
  }, [searchParams, router])

  const exchangeCodeForToken = async (code: string) => {
    try {
      // Determine the redirect URI
      const redirectUri = 'https://ls-betting.vercel.app/callback'

      // Make a request to our API route that will handle the token exchange
      // Client credentials are now handled server-side
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code: code,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de l'échange du code: ${response.status}`)
      }

      const data = await response.json()

      // Store the access token in localStorage or a secure cookie
      localStorage.setItem("accessToken", data.access_token)

      // Fetch user data with the access token
      await fetchUserData(data.access_token)

      setStatus("success")
      setMessage("Authentification réussie! Redirection...")

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Error exchanging code for token:", error)
      setStatus("error")
      setMessage(`Erreur lors de l'authentification: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    }
  }

  const fetchUserData = async (accessToken: string) => {
    try {
      const response = await fetch("/api/auth/user", {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des données utilisateur: ${response.status}`)
      }

      const userData = await response.json()
      setUserData(userData)

      // Store user data in localStorage
      localStorage.setItem("userData", JSON.stringify(userData))

      // Dispatch a custom event to notify the AuthProvider that the user has logged in
      window.dispatchEvent(new Event('auth-state-changed'))

      // The AuthProvider will pick up the token and user data on next render/navigation
    } catch (error) {
      console.error("Error fetching user data:", error)
      throw error
    }
  }

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Authentification</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component that wraps the content in a Suspense boundary
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Authentification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
