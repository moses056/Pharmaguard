import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations

/**
 * Search for pharmacies on guard near a location
 */
export async function searchNearbyPharmacies(lat: number, lng: number, radiusKm: number = 10) {
  const { data, error } = await supabase.rpc('rechercher_pharmacies_de_garde', {
    lat,
    lng,
    rayon_km: radiusKm
  })
  
  if (error) throw error
  return data
}

/**
 * Update stock status for a medication in a pharmacy
 */
export async function updateStockStatus(
  pharmacieId: string,
  medicamentId: string,
  statut: 'disponible' | 'critique' | 'rupture'
) {
  const { data, error } = await supabase
    .from('stocks')
    .upsert({
      pharmacie_id: pharmacieId,
      medicament_id: medicamentId,
      statut,
      mis_a_jour_le: new Date().toISOString()
    }, {
      onConflict: 'pharmacie_id,medicament_id'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Search medications by name or DCI
 */
export async function searchMedications(query: string) {
  const { data, error } = await supabase
    .from('medicaments')
    .select('*')
    .ilike('nom_commercial', `%${query}%`)
    .or(`dci.ilike.%${query}%`)
    .limit(20)
  
  if (error) throw error
  return data
}

/**
 * Get stocks for a specific pharmacy
 */
export async function getPharmacyStocks(pharmacieId: string) {
  const { data, error } = await supabase
    .from('stocks')
    .select(`
      *,
      medicaments:medicament_id (
        id,
        nom_commercial,
        dci,
        forme
      )
    `)
    .eq('pharmacie_id', pharmacieId)
  
  if (error) throw error
  return data
}

/**
 * Toggle guard status for a pharmacy
 */
export async function toggleGuardStatus(pharmacieId: string, isActive: boolean) {
  // First, check if there's an active guard today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const { data: existingGardes, error: fetchError } = await supabase
    .from('gardes')
    .select('*')
    .eq('pharmacie_id', pharmacieId)
    .gte('date_debut', today.toISOString())
    .lt('date_debut', tomorrow.toISOString())
  
  if (fetchError) throw fetchError
  
  if (existingGardes && existingGardes.length > 0) {
    // Update existing guard
    const { data, error } = await supabase
      .from('gardes')
      .update({ est_actif: isActive })
      .eq('id', existingGardes[0].id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } else if (isActive) {
    // Create new guard for today
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)
    
    const { data, error } = await supabase
      .from('gardes')
      .insert({
        pharmacie_id: pharmacieId,
        date_debut: today.toISOString(),
        date_fin: endDate.toISOString(),
        est_actif: true
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  return null
}

/**
 * Subscribe to real-time stock updates for a pharmacy
 */
export function subscribeToStockUpdates(
  pharmacieId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`stocks:${pharmacieId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stocks',
        filter: `pharmacie_id=eq.${pharmacieId}`
      },
      callback
    )
    .subscribe()
}
