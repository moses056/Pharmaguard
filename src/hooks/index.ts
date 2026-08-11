import { useState, useEffect, useCallback } from 'react'
import * as Location from 'expo-location'
import { searchNearbyPharmacies, getPharmacyStocks, toggleGuardStatus, subscribeToStockUpdates } from '../lib/supabaseClient'

/**
 * Hook to get user's current location
 */
export function useLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          setError('Permission de localisation refusée')
          setLoading(false)
          return
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        })
      } catch (err) {
        setError('Impossible de récupérer la localisation')
        console.error('Location error:', err)
      } finally {
        setLoading(false)
      }
    }

    getLocation()
  }, [])

  return { location, loading, error }
}

/**
 * Hook to search pharmacies near user location
 */
export function usePharmacies(radiusKm: number = 10) {
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { location } = useLocation()

  const searchPharmacies = useCallback(async () => {
    if (!location) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await searchNearbyPharmacies(
        location.latitude,
        location.longitude,
        radiusKm
      )
      setPharmacies(data || [])
    } catch (err) {
      setError('Erreur lors de la recherche des pharmacies')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [location, radiusKm])

  useEffect(() => {
    searchPharmacies()
  }, [searchPharmacies])

  return { pharmacies, loading, error, refresh: searchPharmacies }
}

/**
 * Hook to get and subscribe to pharmacy stocks in real-time
 */
export function usePharmacyStocks(pharmacieId: string | undefined) {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pharmacieId) {
      setStocks([])
      setLoading(false)
      return
    }

    const loadStocks = async () => {
      setLoading(true)
      try {
        const data = await getPharmacyStocks(pharmacieId)
        setStocks(data || [])
      } catch (err) {
        setError('Erreur lors du chargement des stocks')
        console.error('Stocks error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStocks()

    // Subscribe to real-time updates
    const subscription = subscribeToStockUpdates(pharmacieId, (payload) => {
      setStocks(prevStocks => {
        if (payload.eventType === 'INSERT') {
          return [...prevStocks, payload.new]
        }
        if (payload.eventType === 'UPDATE') {
          return prevStocks.map(stock => 
            stock.id === payload.new.id ? payload.new : stock
          )
        }
        if (payload.eventType === 'DELETE') {
          return prevStocks.filter(stock => stock.id !== payload.old.id)
        }
        return prevStocks
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pharmacieId])

  return { stocks, loading, error }
}

/**
 * Hook to search medications
 */
export function useMedicationSearch() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery)
    
    if (searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const { searchMedications } = await import('../lib/supabaseClient')
      const data = await searchMedications(searchQuery.trim())
      setResults(data || [])
    } catch (error) {
      console.error('Medication search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, query, search }
}

/**
 * Hook to manage guard status for a pharmacy
 */
export function useGuardStatus(pharmacieId: string | undefined) {
  const [isOnGuard, setIsOnGuard] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleGuard = useCallback(async () => {
    if (!pharmacieId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { toggleGuardStatus } = await import('../lib/supabaseClient')
      const result = await toggleGuardStatus(pharmacieId, !isOnGuard)
      if (result) {
        setIsOnGuard(result.est_actif)
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut de garde')
      console.error('Toggle guard error:', err)
    } finally {
      setLoading(false)
    }
  }, [pharmacieId, isOnGuard])

  const setGuardStatus = useCallback(async (active: boolean) => {
    if (!pharmacieId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { toggleGuardStatus } = await import('../lib/supabaseClient')
      const result = await toggleGuardStatus(pharmacieId, active)
      if (result) {
        setIsOnGuard(result.est_actif)
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut de garde')
      console.error('Set guard status error:', err)
    } finally {
      setLoading(false)
    }
  }, [pharmacieId])

  return { isOnGuard, loading, error, toggleGuard, setGuardStatus }
}
