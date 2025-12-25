'use client'

import React, { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'
import { useToast } from '../../hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

// Auth schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
})

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

// Inner component that uses useSearchParams
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookDataParam = searchParams.get('book')

  // Parse book data from URL if present
  const bookData = bookDataParam ? JSON.parse(decodeURIComponent(bookDataParam)) : null

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange",
    reValidateMode: "onChange"
  })

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Login failed",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Welcome back!",
        })
        router.push('/')
      }
    } catch {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Registration failed",
          variant: "destructive",
        })
      } else {
        if (result.requiresConfirmation) {
          // Email confirmation required
          toast({
            title: "Check your email!",
            description: "We've sent you a confirmation email. Please check your inbox and click the confirmation link to complete your registration.",
          })
          // Don't redirect - let user check their email
        } else {
          // Immediate sign in (development mode)
          toast({
            title: "Success",
            description: "Account created successfully!",
          })
          router.push('/')
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "An error occurred during registration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {isLogin ? "Sign In" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin 
            ? "Enter your credentials to access your reading roadmap"
            : "Create an account to start organizing your reading journey"
          }
        </CardDescription>
        {bookData && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              📚 <strong>{bookData.title}</strong> by {bookData.author} will be added to your reading roadmap after you create an account.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLogin ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    // TODO: Implement password reset
                    toast({
                      title: "Coming Soon",
                      description: "Password reset functionality will be available soon.",
                    })
                  }}
                  className="text-sm text-gray-600"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                {...registerForm.register('email')}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                {...registerForm.register('password')}
                className="w-full p-2 border rounded"
              />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">{registerForm.formState.errors.password.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        )}
        
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main page component with Suspense boundary
export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <AuthForm />
      </Suspense>
    </div>
  )
} 