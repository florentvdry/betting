import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      )
    }
    
    // Extract the access token from the authorization header
    const accessToken = authHeader.substring(7) // Remove "Bearer " prefix
    
    // Make a request to the GTA World API to get user data
    const userResponse = await fetch("https://ucp.gta.world/api/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })
    
    // Get the response data
    const userData = await userResponse.json()
    
    // If the response is not successful, return the error
    if (!userResponse.ok) {
      console.error("User data fetch error:", userData)
      return NextResponse.json(
        { error: userData.error || "Failed to fetch user data" },
        { status: userResponse.status }
      )
    }
    
    // Return the user data
    return NextResponse.json(userData)
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}