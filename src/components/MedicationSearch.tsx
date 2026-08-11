import React, { useState, useEffect } from 'react'
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { searchMedications, getPharmacyStocks } from '../lib/supabaseClient'
import type { Database } from '../types/database'
import StockStatusBadge from './StockStatusBadge'

type Medicament = Database['public']['Tables']['medicaments']['Row']
type Stock = Database['public']['Tables']['stocks']['Row'] & {
  medicaments: {
    nom_commercial: string
    dci: string | null
    forme: string | null
  }
}

interface MedicationSearchProps {
  pharmacieId?: string
  onMedicationSelect?: (medicament: Medicament) => void
  placeholder?: string
}

const MedicationSearch: React.FC<MedicationSearchProps> = ({
  pharmacieId,
  onMedicationSelect,
  placeholder = 'Rechercher un médicament...'
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Medicament[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true)
        try {
          const data = await searchMedications(query.trim())
          setResults(data || [])
          setShowResults(true)
        } catch (error) {
          console.error('Error searching medications:', error)
          setResults([])
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query])

  useEffect(() => {
    if (pharmacieId) {
      loadStocks()
      const interval = setInterval(loadStocks, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [pharmacieId])

  const loadStocks = async () => {
    if (!pharmacieId) return
    try {
      const data = await getPharmacyStocks(pharmacieId)
      setStocks(data || [])
    } catch (error) {
      console.error('Error loading stocks:', error)
    }
  }

  const getStockStatus = (medicamentId: string) => {
    const stock = stocks.find(s => s.medicament_id === medicamentId)
    return stock?.statut
  }

  const handleSelect = (medicament: Medicament) => {
    onMedicationSelect?.(medicament)
    setQuery('')
    setShowResults(false)
  }

  const renderResult = ({ item }: { item: Medicament }) => {
    const stockStatus = pharmacieId ? getStockStatus(item.id) : undefined
    
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultContent}>
          <Text style={styles.medName}>{item.nom_commercial}</Text>
          {item.dci && (
            <Text style={styles.medDci}>{item.dci}</Text>
          )}
          {item.forme && (
            <Text style={styles.medForme}>{item.forme}</Text>
          )}
        </View>
        {stockStatus && (
          <StockStatusBadge statut={stockStatus} />
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
        )}
      </View>

      {showResults && results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          maxHeight={300}
        />
      )}

      {showResults && query.trim().length >= 2 && results.length === 0 && !loading && (
        <View style={styles.emptyResults}>
          <Text style={styles.emptyText}>Aucun médicament trouvé</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1f2937',
  },
  loader: {
    marginLeft: 8,
  },
  resultsList: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultContent: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  medDci: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  medForme: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyResults: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
})

export default MedicationSearch
