# 🧪 Testing Guide for ReadingRoadmap

## 📋 Overview

This document outlines the testing strategy and implementation for the ReadingRoadmap application. We use a multi-layered testing approach to ensure code quality, reliability, and maintainability.

## 🎯 Testing Strategy

### **1. Unit Tests** (Jest + React Testing Library)
- **Purpose**: Test individual functions, components, and utilities in isolation
- **Coverage**: Business logic, utility functions, component rendering, user interactions
- **Location**: `__tests__/` directory
- **Command**: `npm test`

### **2. Integration Tests** (Jest + MSW)
- **Purpose**: Test API routes and component-to-API interactions
- **Coverage**: API endpoints, database operations, authentication flows
- **Location**: `__tests__/api/` directory
- **Command**: `npm test`

### **3. E2E Tests** (Playwright)
- **Purpose**: Test complete user workflows across multiple browsers
- **Coverage**: User journeys, cross-browser compatibility, responsive design
- **Location**: `e2e/` directory
- **Command**: `npm run test:e2e`

## 🚀 Getting Started

### Prerequisites
```bash
# Install dependencies (already done)
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all
```

## 📁 Test Structure

```
├── __tests__/
│   ├── components/          # Component unit tests
│   ├── lib/                 # Utility function tests
│   ├── hooks/               # Custom hook tests
│   ├── contexts/            # Context provider tests
│   ├── api/                 # API route tests
│   └── utils/
│       └── test-utils.tsx   # Test utilities and providers
├── e2e/                     # End-to-end tests
│   ├── auth.spec.ts         # Authentication tests
│   ├── books.spec.ts        # Book management tests
│   └── dashboard.spec.ts    # Dashboard tests
├── jest.config.js           # Jest configuration
├── jest.setup.js           # Jest setup and mocks
└── playwright.config.ts     # Playwright configuration
```

## 🧩 Test Categories

### **Authentication Module**
- ✅ User registration with validation
- ✅ User login with error handling
- ✅ Session management
- ✅ Protected route access
- ✅ Logout functionality

### **Book Management Module**
- ✅ Add new books with validation
- ✅ Update book information
- ✅ Track reading progress
- ✅ Book status transitions
- ✅ Reading time estimation

### **Kanban Board Module**
- ✅ Create and manage swimlanes
- ✅ Drag and drop functionality
- ✅ Lane type validation
- ✅ Board persistence

### **Dashboard Module**
- ✅ Reading statistics calculation
- ✅ Progress tracking display
- ✅ Recent books list
- ✅ Quick actions

### **Book Search Module**
- ✅ Search functionality
- ✅ API integration
- ✅ Result display
- ✅ Error handling

## 📝 Writing Tests

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '../utils/test-utils'
import { BookCard } from '../../components/book-card'

describe('BookCard', () => {
  it('renders book information correctly', () => {
    render(<BookCard book={mockBook} />)
    
    expect(screen.getByText('Test Book')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
  })
})
```

### API Test Example
```typescript
import { NextRequest } from 'next/server'
import { GET, POST } from '../../app/api/books/route'

describe('/api/books', () => {
  it('should return books successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/books')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/auth')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  
  await expect(page).toHaveURL('/')
})
```

## 🔧 Test Configuration

### Jest Configuration
- **Environment**: jsdom for DOM simulation
- **Transform**: Next.js Babel preset for TypeScript/JSX
- **Coverage**: Collects coverage from app, components, lib, hooks, contexts
- **Setup**: Custom setup file with mocks and global utilities

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel**: Runs tests in parallel for faster execution
- **Retries**: Automatic retries on CI
- **Screenshots**: Captures screenshots on failure
- **Videos**: Records videos for failed tests

## 🎭 Mocking Strategy

### **API Mocks**
- Use MSW (Mock Service Worker) for API mocking
- Mock Supabase client for authentication
- Mock database operations for isolation

### **Component Mocks**
- Mock Next.js router and navigation
- Mock external dependencies (images, fonts)
- Mock browser APIs (ResizeObserver, matchMedia)

### **Environment Mocks**
- Mock environment variables for testing
- Mock localStorage and sessionStorage
- Mock cookies and authentication state

## 📊 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **E2E Tests**: Critical user paths

## 🚨 Best Practices

### **Test Organization**
- Group related tests using `describe` blocks
- Use descriptive test names that explain the behavior
- Follow the AAA pattern: Arrange, Act, Assert

### **Test Data**
- Use factory functions for creating test data
- Keep mock data in separate files
- Use realistic but minimal test data

### **Assertions**
- Test one thing per test case
- Use specific assertions over generic ones
- Test both happy path and error cases

### **Performance**
- Keep tests fast and focused
- Use `beforeEach` for setup, not `beforeAll`
- Clean up after tests to avoid interference

## 🔍 Debugging Tests

### Jest Debugging
```bash
# Run specific test file
npm test -- BookCard.test.tsx

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Show test coverage
npm run test:coverage
```

### Playwright Debugging
```bash
# Run tests with UI
npm run test:e2e:ui

# Run specific test
npx playwright test auth.spec.ts

# Debug specific test
npx playwright test auth.spec.ts --debug
```

## 📈 Continuous Integration

### GitHub Actions
Tests are automatically run on:
- Pull requests
- Push to main branch
- Scheduled runs

### Pre-commit Hooks
- Lint code before commit
- Run unit tests before commit
- Check TypeScript types

## 🐛 Common Issues

### **Test Environment Issues**
- Ensure all dependencies are installed
- Check that environment variables are set
- Verify that mocks are properly configured

### **Async Test Issues**
- Use `waitFor` for async operations
- Properly mock async functions
- Handle loading states in tests

### **Component Test Issues**
- Wrap components with necessary providers
- Mock external dependencies
- Use proper test utilities

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)

## 🤝 Contributing

When adding new features:
1. Write unit tests for new components
2. Write integration tests for new API routes
3. Write E2E tests for new user flows
4. Update this documentation if needed
5. Ensure all tests pass before submitting PR

---

**Remember**: Good tests are an investment in code quality and developer productivity. Write tests that are maintainable, readable, and provide confidence in your code changes. 