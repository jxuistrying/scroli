export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          daily_limit_minutes: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          daily_limit_minutes: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          daily_limit_minutes?: number
          is_active?: boolean
          created_at?: string
        }
      }
      wallet_balances: {
        Row: {
          id: string
          user_id: string
          balance_cents: number
          currency: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance_cents?: number
          currency?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance_cents?: number
          currency?: string
          updated_at?: string
        }
      }
      daily_records: {
        Row: {
          id: string
          user_id: string
          date: string
          duration_minutes: number
          goal_id: string | null
          status: 'success' | 'failure' | 'pending'
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          duration_minutes: number
          goal_id?: string | null
          status?: 'success' | 'failure' | 'pending'
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          duration_minutes?: number
          goal_id?: string | null
          status?: 'success' | 'failure' | 'pending'
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount_cents: number
          type: 'charge' | 'refund' | 'donation'
          charity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_cents: number
          type: 'charge' | 'refund' | 'donation'
          charity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_cents?: number
          type?: 'charge' | 'refund' | 'donation'
          charity_id?: string | null
          created_at?: string
        }
      }
      charities: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          website_url: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
