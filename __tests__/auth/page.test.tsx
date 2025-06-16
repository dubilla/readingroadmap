import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import AuthPage from '../../app/auth/page'
import { useAuth } from '../../contexts/auth-context'

// Mock the auth context and router
jest.mock('../../contexts/auth-context')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Error boundary to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error?.message}</div>
    }
    return this.props.children
  }
}

describe('AuthPage', () => {
  const mockAuthContext = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue(mockAuthContext)
  })

  it('renders login form by default', async () => {
    render(
      <ErrorBoundary>
        <AuthPage />
      </ErrorBoundary>
    )
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('switches to register form when clicked', async () => {
    render(<AuthPage />)
    
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('switches back to login form when clicked', async () => {
    render(<AuthPage />)
    
    // Switch to register first
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    // Switch back to login
    const signInLink = screen.getByText('Already have an account? Sign in')
    fireEvent.click(signInLink)
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles login form submission', async () => {
    mockAuthContext.signIn.mockResolvedValue({})

    render(<AuthPage />)
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('handles register form submission', async () => {
    mockAuthContext.signUp.mockResolvedValue({})

    render(<AuthPage />)
    
    // Switch to register form
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('handles login errors', async () => {
    mockAuthContext.signIn.mockResolvedValue({ error: 'Invalid credentials' })

    render(<AuthPage />)
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
    })
  })

  it('handles registration errors', async () => {
    mockAuthContext.signUp.mockResolvedValue({ error: 'Email already exists' })

    render(<AuthPage />)
    
    // Switch to register form
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('validates required fields', async () => {
    render(<AuthPage />)
    
    // Switch to register form
    const signUpLink = screen.getByText('Don\'t have an account? Sign up')
    fireEvent.click(signUpLink)
    
    // Submit empty form
    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })
}) 