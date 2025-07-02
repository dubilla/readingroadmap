'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from "@tanstack/react-query"
import { ReadingBoard } from "../components/reading-board"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { BookSearch } from "../components/book-search"
import { NavHeader } from "../components/nav-header"
import { Book as BookIcon, BookOpen, ListTodo, PanelRight, Library, TrendingUp, ArrowRight, BookMarked } from "lucide-react"
import type { Book, UserLane } from "../shared/schema"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        setUser(null)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])
  
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    enabled: isAuthenticated === true // Only fetch if authenticated
  })
  
  const { data: userLanes, isLoading: lanesLoading } = useQuery<UserLane[]>({
    queryKey: ["/api/lanes"],
    enabled: isAuthenticated === true // Only fetch if authenticated
  })
  
  const [activeTab, setActiveTab] = useState("dashboard")
  const isLoading = isAuthenticated === null || (isAuthenticated && (booksLoading || lanesLoading))
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show welcome screen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <BookMarked className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Welcome to Reading Roadmap</h1>
              <p className="text-xl text-muted-foreground">
                Organize your reading journey, track your progress, and discover new books
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-6">
                  <BookOpen className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold mb-2">Track Your Reading</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep track of what you're reading and your progress
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Library className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold mb-2">Discover Books</h3>
                  <p className="text-sm text-muted-foreground">
                    Find new books to read from Open Library
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <TrendingUp className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold mb-2">Visualize Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    See your reading journey with beautiful visual boards
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Button 
                size="lg" 
                onClick={() => router.push('/auth')}
                className="px-8"
              >
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Create an account to start organizing your reading journey
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show dashboard for authenticated users
  const toReadCount = books?.filter(book => book.status === "to-read").length || 0
  const inProgressCount = books?.filter(book => book.status === "reading").length || 0
  const completedCount = books?.filter(book => book.status === "completed").length || 0
  const totalBooks = books?.length || 0

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Total Books</h3>
              <Library className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{totalBooks}</p>
            <p className="text-sm text-muted-foreground mt-2">Books in your library</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">To Read</h3>
              <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-bold">{toReadCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Books to read</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-950/30">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">In Progress</h3>
              <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-3xl font-bold">{inProgressCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Currently reading</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 dark:bg-purple-950/30">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Completed</h3>
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-bold">{completedCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Books finished</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Books */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Recently Added</h3>
          <BookSearch />
        </div>
        
        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.slice(-4).reverse().map(book => (
              <Card key={book.id} className="overflow-hidden">
                <div className="aspect-[3/4] relative">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold line-clamp-1">{book.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your reading roadmap by adding your first book
              </p>
              <BookSearch />
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1 max-w-xs"
          onClick={() => setActiveTab("readingBoard")}
        >
          <PanelRight className="h-4 w-4 mr-2" />
          View Reading Board
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1 max-w-xs"
          onClick={() => window.open("https://openlibrary.org", "_blank")}
        >
          <Library className="h-4 w-4 mr-2" />
          Explore Open Library
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">📚 Reading Roadmap</h1>
            <p className="text-muted-foreground">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! Here's your reading journey
            </p>
          </header>

          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${activeTab === "dashboard" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === "readingBoard" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("readingBoard")}
            >
              Reading Board
            </button>
          </div>

          {activeTab === "dashboard" ? (
            renderDashboard()
          ) : (
            <Card>
              <CardContent className="p-6">
                <ReadingBoard books={books || []} userLanes={userLanes || []} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 