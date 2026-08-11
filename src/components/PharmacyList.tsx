import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import type { Database } from '../types/database'

type Pharmacy = Database['public']['Functions']['rechercher_pharmacies_de_garde']['Returns'][number]

interface PharmacyListProps {
  pharmacies: Pharmacy[]
  onPharmacyPress?: (pharmacy: Pharmacy) => void
}

const PharmacyList: React.FC<PharmacyListProps> = ({ pharmacies, onPharmacyPress }) => {
  if (!pharmacies || pharmacies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Aucune pharmacie trouvée</Text>
      </View>
    )
  }

  const renderPharmacy = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity
      style={[styles.pharmacyCard, item.est_en_garde && styles.pharmacyCardActive]}
      onPress={() => onPharmacyPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.pharmacyHeader}>
        <Text style={styles.pharmacyName}>{item.nom}</Text>
        {item.est_en_garde && (
          <View style={styles.guardBadge}>
            <Text style={styles.guardBadgeText}>EN GARDE</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.pharmacyAddress}>{item.adresse}</Text>
      
      {item.telephone && (
        <Text style={styles.pharmacyPhone}>{item.telephone}</Text>
      )}
      
      <View style={styles.pharmacyFooter}>
        <Text style={styles.distanceText}>
          {item.distance_km?.toFixed(2)} km
        </Text>
        
        {item.est_en_garde && item.garde_date_fin && (
          <Text style={styles.guardEndTime}>
            Jusqu'à {new Date(item.garde_date_fin).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <FlatList
      data={pharmacies}
      renderItem={renderPharmacy}
      keyExtractor={(item) => item.id || Math.random().toString()}
      contentContainerStyle={styles.listContent}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 32,
  },
  listContent: {
    padding: 16,
  },
  pharmacyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  pharmacyCardActive: {
    borderLeftColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  guardBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  guardBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  pharmacyPhone: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 8,
  },
  pharmacyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  guardEndTime: {
    fontSize: 12,
    color: '#6b7280',
  },
})

export default PharmacyList
