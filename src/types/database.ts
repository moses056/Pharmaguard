// Database type definitions for PharmaGarde
// Auto-generated types from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type StockStatut = 'disponible' | 'critique' | 'rupture'

export interface Database {
  public: {
    Tables: {
      pharmacies: {
        Row: {
          id: string
          nom: string
          adresse: string
          telephone: string | null
          emplacement: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          adresse: string
          telephone?: string | null
          emplacement: unknown
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          adresse?: string
          telephone?: string | null
          emplacement?: unknown
          created_at?: string
          updated_at?: string
        }
      }
      gardes: {
        Row: {
          id: string
          pharmacie_id: string
          date_debut: string
          date_fin: string
          est_actif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacie_id: string
          date_debut: string
          date_fin: string
          est_actif?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacie_id?: string
          date_debut?: string
          date_fin?: string
          est_actif?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      medicaments: {
        Row: {
          id: string
          nom_commercial: string
          dci: string | null
          forme: string | null
          code_cis: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nom_commercial: string
          dci?: string | null
          forme?: string | null
          code_cis?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nom_commercial?: string
          dci?: string | null
          forme?: string | null
          code_cis?: string | null
          created_at?: string
        }
      }
      stocks: {
        Row: {
          id: string
          pharmacie_id: string
          medicament_id: string
          statut: StockStatut
          mis_a_jour_le: string
          created_at: string
        }
        Insert: {
          id?: string
          pharmacie_id: string
          medicament_id: string
          statut?: StockStatut
          mis_a_jour_le?: string
          created_at?: string
        }
        Update: {
          id?: string
          pharmacie_id?: string
          medicament_id?: string
          statut?: StockStatut
          mis_a_jour_le?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      rechercher_pharmacies_de_garde: {
        Args: {
          lat: number
          lng: number
          rayon_km?: number
        }
        Returns: {
          id: string
          nom: string
          adresse: string
          telephone: string
          distance_km: number
          est_en_garde: boolean
          garde_id: string
          garde_date_debut: string
          garde_date_fin: string
        }[]
      }
    }
    Enums: {
      stock_statut: 'disponible' | 'critique' | 'rupture'
    }
  }
}
