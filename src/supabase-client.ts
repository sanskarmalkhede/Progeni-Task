
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone_number: string | null
          bio: string | null
          avatar_url: string | null
          date_of_birth: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone_number?: string | null
          bio?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone_number?: string | null
          bio?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.')
}

// Create and configure Supabase client with proper TypeScript types
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
)

// Export types for use in other modules
export type SupabaseClientType = typeof supabase