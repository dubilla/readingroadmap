import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { AuthProvider, useAuth } from '../../contexts/auth-context'
import { apiRequest } from '../../lib/queryClient'

// Mock the API request function
jest.mock('../../lib/queryClient', () => ({
  apiRequest: jest.fn()
}))

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

// Test component to access auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  it('provides initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('handles successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    mockApiRequest.mockResolvedValue({ 
      ok: true, 
      json: () => Promise.resolve({ user: mockUser }) 
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })
  })

  it('handles login errors', async () => {
    mockApiRequest.mockResolvedValue({ 
      ok: false, 
      json: () => Promise.resolve({ error: 'Invalid credentials' }) 
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
      })
    })

    // Should remain unauthenticated
    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })

  it('handles logout', async () => {
    // First login
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    mockApiRequest.mockResolvedValue({ 
      ok: true, 
      json: () => Promise.resolve({ user: mockUser }) 
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    // Then logout
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })
  })

  it('loads user from localStorage on mount', () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' }
    localStorage.setItem('user', JSON.stringify(mockUser))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
  })

  it('handles network errors during login', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
      })
    })

    // Should remain unauthenticated
    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
  })
}) 