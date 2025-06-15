import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page before each test
    await page.goto('/auth');
  });

  test('should display login form by default', async ({ page }) => {
    // Check that login form is visible
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should switch to register form', async ({ page }) => {
    // Click on register link
    await page.getByRole('button', { name: /create account/i }).click();

    // Check that register form is visible
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check for validation error
    await expect(page.getByText(/invalid email address/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check for validation errors
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check for error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('should validate password length on register', async ({ page }) => {
    // Switch to register form
    await page.getByRole('button', { name: /create account/i }).click();

    // Enter short password
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('short');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check for validation error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Enter valid credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check that button shows loading state
    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeVisible();
  });

  test('should redirect to home page after successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
          },
        }),
      });
    });

    // Enter valid credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check that we're redirected to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Reading Roadmap' })).toBeVisible();
  });

  test('should show success toast after successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
          },
        }),
      });
    });

    // Enter valid credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check for success toast
    await expect(page.getByText('Logged in successfully')).toBeVisible();
  });
}); 