import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../contexts/auth-context'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data for tests
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
}

export const mockBook = {
  id: 1,
  title: 'Test Book',
  author: 'Test Author',
  pages: 300,
  coverUrl: 'https://example.com/cover.jpg',
  status: 'to-read' as const,
  userId: 1,
  laneId: null,
  readingProgress: 0,
  goodreadsId: null,
  estimatedMinutes: 300,
  addedAt: new Date().toISOString(),
}

export const mockLane = {
  id: 1,
  name: 'Backlog',
  description: 'Books to read',
  order: 0,
  type: 'backlog' as const,
  swimlaneId: null,
}

export const mockSwimlane = {
  id: 1,
  name: 'My Reading List',
  description: 'Personal reading list',
  order: 0,
  userId: 1,
} 