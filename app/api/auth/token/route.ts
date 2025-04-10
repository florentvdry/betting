import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { grant_type, redirect_uri, code } = body

    // Get client credentials from server-side environment variables
    const client_id = process.env.GTA_CLIENT_ID
    const client_secret = process.env.GTA_CLIENT_SECRET

    // Validate required parameters
    if (!grant_type || !redirect_uri || !code) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Make a request to the GTA World OAuth token endpoint
    const tokenResponse = await fetch("https://ucp.gta.world/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type,
        client_id,
        client_secret,
        redirect_uri,
        code,
      }),
    })

    // Get the response data
    const data = await tokenResponse.json()

    // If the response is not successful, return the error
    if (!tokenResponse.ok) {
      console.error("Token exchange error:", data)
      return NextResponse.json(
        { error: data.error || "Failed to exchange token" },
        { status: tokenResponse.status }
      )
    }

    // Return the access token and other data
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in token exchange:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
