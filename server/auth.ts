import { compareSync, hashSync } from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Configure passport with local strategy
export function setupAuth() {
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user || false);
    } catch (error) {
      done(error, false);
    }
  });

  // Local strategy for email/password auth
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await storage.getUserByEmail(email);
          
          // User not found
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Check password
          const passwordValid = compareSync(password, user.hashedPassword);
          if (!passwordValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Success - return user without password
          const { hashedPassword, ...safeUser } = user;
          return done(null, safeUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Hash password utility for registration
export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

// Auth middleware to ensure user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Get current user from session as utility function
export function getCurrentUser(req: any): User | null {
  return req.isAuthenticated() ? req.user : null;
}