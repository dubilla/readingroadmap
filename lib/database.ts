import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'
import * as schema from '../shared/schema'

// Database abstraction layer
export class DatabaseClient {
  private static instance: DatabaseClient
  private drizzleDb: any
  private supabaseClient: any
  private isLocal: boolean

  private constructor() {
    this.isLocal = process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL
    
    if (this.isLocal) {
      // Use local PostgreSQL with Drizzle
      const connectionString = process.env.DATABASE_URL
      if (!connectionString) {
        throw new Error('DATABASE_URL is required for local development')
      }
      
      const client = postgres(connectionString)
      this.drizzleDb = drizzle(client, { schema })
    } else {
      // Use Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key are required for production')
      }
      
      this.supabaseClient = createClient(supabaseUrl, supabaseKey)
    }
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient()
    }
    return DatabaseClient.instance
  }

  public getDb() {
    return this.isLocal ? this.drizzleDb : this.supabaseClient
  }

  public isLocalDb() {
    return this.isLocal
  }

  // Helper methods for common operations
  public async query(table: string, options: any = {}) {
    try {
      if (this.isLocal) {
        // Use Drizzle query
        const result = await this.drizzleDb.select().from(schema[table as keyof typeof schema])
        return { data: result, error: null }
      } else {
        // Use Supabase query
        const result = await this.supabaseClient.from(table).select('*')
        return result
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  public async insert(table: string, data: any) {
    try {
      if (this.isLocal) {
        // Use Drizzle insert
        const result = await this.drizzleDb.insert(schema[table as keyof typeof schema]).values(data).returning()
        return { data: result[0], error: null }
      } else {
        // Use Supabase insert
        const result = await this.supabaseClient.from(table).insert(data).select().single()
        return result
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  public async update(table: string, data: any, where: any) {
    try {
      if (this.isLocal) {
        // Use Drizzle update
        const result = await this.drizzleDb.update(schema[table as keyof typeof schema])
          .set(data)
          .where(where)
          .returning()
        return { data: result[0], error: null }
      } else {
        // Use Supabase update
        const result = await this.supabaseClient.from(table).update(data).match(where).select().single()
        return result
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  public async delete(table: string, where: any) {
    try {
      if (this.isLocal) {
        // Use Drizzle delete
        const result = await this.drizzleDb.delete(schema[table as keyof typeof schema]).where(where).returning()
        return { data: result[0], error: null }
      } else {
        // Use Supabase delete
        const result = await this.supabaseClient.from(table).delete().match(where).select().single()
        return result
      }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Export singleton instance
export const db = DatabaseClient.getInstance() 