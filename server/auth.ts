import { compareSync, hashSync } from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Configure passport with local strategy
export function setupAuth() {
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user);
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = await storage.getUserById(id);
      if (!user) {
        console.log("User not found during deserialization");
        return done(null, false);
      }
      console.log("Deserialized user:", user);
      done(null, user);
    } catch (error) {
      console.error("Error during deserialization:", error);
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
          console.log("Attempting login for email:", email);
          // Find user by email
          const user = await storage.getUserByEmail(email);
          
          // User not found
          if (!user) {
            console.log("User not found for email:", email);
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Check password
          const passwordValid = compareSync(password, user.hashedPassword);
          if (!passwordValid) {
            console.log("Invalid password for user:", email);
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Success - return user without password
          const { hashedPassword, ...safeUser } = user;
          console.log("Login successful for user:", safeUser);
          return done(null, safeUser);
        } catch (error) {
          console.error("Error during authentication:", error);
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