import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get client ID from server-side environment variables
    const clientId = process.env.GTA_CLIENT_ID
    
    // Determine the redirect URI based on the environment
    const redirectUri = 'https://ls-betting.vercel.app/callback'
    
    // Create the authorization URL
    const authUrl = new URL("https://ucp.gta.world/oauth/authorize")
    authUrl.searchParams.append("client_id", clientId)
    authUrl.searchParams.append("redirect_uri", redirectUri)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("scope", "")
    
    // Return the authorization URL
    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error("Error generating auth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    )
  }
}