'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { useToast } from '../../../hooks/use-toast'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get the access token and refresh token from URL params
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setError(errorDescription || 'Authentication failed')
          setIsLoading(false)
          return
        }

        if (accessToken && refreshToken) {
          // Set the session
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            setError(sessionError.message)
            setIsLoading(false)
            return
          }

          if (data.session) {
            toast({
              title: "Success!",
              description: "Your email has been confirmed and you're now signed in.",
            })
            
            // Redirect to the main app
            router.push('/')
            return
          }
        }

        // If no tokens, try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(sessionError.message)
          setIsLoading(false)
          return
        }

        if (session) {
          toast({
            title: "Success!",
            description: "You're now signed in to ReadingRoadmap.",
          })
          router.push('/')
          return
        }

        // No session found
        setError('No valid session found. Please try signing in again.')
        setIsLoading(false)
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred. Please try again.')
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">📚 ReadingRoadmap</CardTitle>
            <CardDescription className="text-center">
              Confirming your email...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Authentication Error</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button 
              onClick={() => router.push('/auth')}
              className="w-full"
            >
              Go to Sign In
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
} 