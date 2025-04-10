"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

// Define the user type based on the API response
interface User {
  id: number
  username: string
  confirmed: number
  role: {
    id: number
    user_id: number
    role_id: string
    server: number
  }
  character: Array<{
    id: number
    memberid: number
    firstname: string
    lastname: string
  }>
}

// Define the character type for easier access
export interface Character {
  id: number
  memberid: number
  firstname: string
  lastname: string
}

interface AuthContextType {
  user: User | null
  currentCharacter: Character | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  switchCharacter: (characterId: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if the user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        // Check if we have an access token in localStorage
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
          setIsAuthenticated(false)
          setUser(null)
          return
        }

        // Try to get user data from localStorage first
        const storedUserData = localStorage.getItem("userData")
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData)
          if (parsedUserData.user) {
            setUser(parsedUserData.user)
            setIsAuthenticated(true)

            // Set the current character
            if (parsedUserData.user.character && parsedUserData.user.character.length > 0) {
              // Try to load the saved character ID from localStorage
              const savedCharacterId = localStorage.getItem("currentCharacterId");

              if (savedCharacterId) {
                const characterId = parseInt(savedCharacterId, 10);
                const savedCharacter = parsedUserData.user.character.find(char => char.id === characterId);

                if (savedCharacter) {
                  setCurrentCharacter(savedCharacter);
                } else {
                  // If the saved character is not found, use the first character
                  setCurrentCharacter(parsedUserData.user.character[0]);
                  localStorage.setItem("currentCharacterId", parsedUserData.user.character[0].id.toString());
                }
              } else {
                // If no saved character, use the first character by default
                setCurrentCharacter(parsedUserData.user.character[0]);
                localStorage.setItem("currentCharacterId", parsedUserData.user.character[0].id.toString());
              }
            }

            return
          }
        }

        // If no stored user data, fetch from API
        const response = await fetch("/api/auth/user", {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
            localStorage.setItem("userData", JSON.stringify(data))

            // Set the current character
            if (data.user.character && data.user.character.length > 0) {
              // Try to load the saved character ID from localStorage
              const savedCharacterId = localStorage.getItem("currentCharacterId");

              if (savedCharacterId) {
                const characterId = parseInt(savedCharacterId, 10);
                const savedCharacter = data.user.character.find(char => char.id === characterId);

                if (savedCharacter) {
                  setCurrentCharacter(savedCharacter);
                } else {
                  // If the saved character is not found, use the first character
                  setCurrentCharacter(data.user.character[0]);
                  localStorage.setItem("currentCharacterId", data.user.character[0].id.toString());
                }
              } else {
                // If no saved character, use the first character by default
                setCurrentCharacter(data.user.character[0]);
                localStorage.setItem("currentCharacterId", data.user.character[0].id.toString());
              }
            }
          } else {
            // Invalid user data
            setIsAuthenticated(false)
            setUser(null)
            setCurrentCharacter(null)
            localStorage.removeItem("accessToken")
            localStorage.removeItem("userData")
            localStorage.removeItem("currentCharacterId")
          }
        } else {
          // Token might be expired or invalid
          setIsAuthenticated(false)
          setUser(null)
          setCurrentCharacter(null)
          localStorage.removeItem("accessToken")
          localStorage.removeItem("userData")
          localStorage.removeItem("currentCharacterId")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
        setUser(null)
        setCurrentCharacter(null)
        localStorage.removeItem("currentCharacterId")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login function - redirects to the OAuth authorization endpoint
  const login = async () => {
    try {
      // Get the authorization URL from the server-side API
      const response = await fetch("/api/auth/login")
      const data = await response.json()

      if (response.ok && data.authUrl) {
        // Redirect to the authorization URL
        window.location.href = data.authUrl
      } else {
        console.error("Failed to get authorization URL:", data.error)
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  // Logout function - clears the auth state and localStorage
  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("userData")
    localStorage.removeItem("currentCharacterId")
    setIsAuthenticated(false)
    setUser(null)
    setCurrentCharacter(null)
  }

  // Function to switch between characters
  const switchCharacter = (characterId: number) => {
    if (!user || !user.character || user.character.length === 0) return;

    const character = user.character.find(char => char.id === characterId);
    if (character) {
      setCurrentCharacter(character);
      // Save the current character ID to localStorage
      localStorage.setItem("currentCharacterId", characterId.toString());
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      currentCharacter, 
      isLoading, 
      isAuthenticated, 
      login, 
      logout,
      switchCharacter
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
