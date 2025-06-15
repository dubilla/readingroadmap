'use client'

import React, { useState } from 'react'
import { useQuery } from "@tanstack/react-query"
import { ReadingBoard } from "../components/reading-board"
import { Card, CardContent } from "../components/ui/card"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { BookSearch } from "../components/book-search"
import { NavHeader } from "../components/nav-header"
import { Book as BookIcon, BookOpen, ListTodo, PanelRight, Library, TrendingUp } from "lucide-react"
import type { Book, Lane } from "../shared/schema"
import { useAuth } from "../contexts/auth-context"

export default function HomePage() {
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"]
  })
  
  const { data: lanes, isLoading: lanesLoading } = useQuery<Lane[]>({
    queryKey: ["/api/lanes"]
  })
  
  const [activeTab, setActiveTab] = useState("dashboard")
  const isLoading = booksLoading || lanesLoading
  
  const backlogLane = lanes?.find(lane => lane.type === "backlog")
  const inProgressLane = lanes?.find(lane => lane.type === "in-progress")
  const completedLane = lanes?.find(lane => lane.type === "completed" && !lane.swimlaneId)
  
  const backlogCount = books?.filter(book => book.laneId === backlogLane?.id).length || 0
  const inProgressCount = books?.filter(book => book.laneId === inProgressLane?.id).length || 0
  const completedCount = books?.filter(book => book.laneId === completedLane?.id).length || 0
  const totalBooks = books?.length || 0
  
  if (isLoading) {
    return <Skeleton className="w-full h-screen" />
  }

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
              <h3 className="text-lg font-medium">Backlog</h3>
              <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-bold">{backlogCount}</p>
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
          {backlogLane && <BookSearch laneId={backlogLane.id} />}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books?.slice(-4).reverse().map(book => (
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
            <h1 className="text-4xl font-bold tracking-tight">Reading Roadmap</h1>
            <p className="text-muted-foreground">
              Organize and track your reading journey
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
              <ReadingBoard books={books || []} />
            </CardContent>
          </Card>
        )}
        </div>
      </main>
    </div>
  )
} 