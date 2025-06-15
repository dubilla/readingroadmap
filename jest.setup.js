import '@testing-library/jest-dom'
import React from 'react'

// Simple Request polyfill for Next.js API route tests
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.body = options.body
    this.headers = new Map(Object.entries(options.headers || {}))
  }

  async json() {
    if (this.body) {
      return JSON.parse(this.body)
    }
    return {}
  }
}

// Simple Response polyfill for Next.js API route tests
global.Response = class Response {
  constructor(body = '', options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || ''
    this.headers = new Map(Object.entries(options.headers || {}))
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }

  text() {
    return Promise.resolve(this.body)
  }

  static json(body, options = {}) {
    return new Response(JSON.stringify(body), {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {}),
      },
    })
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', props)
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
})) 