import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { usePharmacyStocks, useGuardStatus } from '../hooks'
import { updateStockStatus } from '../lib/supabaseClient'
import StockStatusBadge from './StockStatusBadge'
import MedicationSearch from './MedicationSearch'
import type { Database } from '../types/database'

type Stock = Database['public']['Tables']['stocks']['Row'] & {
  medicaments: {
    id: string
    nom_commercial: string
    dci: string | null
    forme: string | null
  }
}

interface PharmacistDashboardProps {
  pharmacieId: string
  pharmacieNom: string
}

const PharmacistDashboard: React.FC<PharmacistDashboardProps> = ({
  pharmacieId,
  pharmacieNom,
}) => {
  const { stocks, loading: stocksLoading, error: stocksError } = usePharmacyStocks(pharmacieId)
  const { isOnGuard, loading: guardLoading, setGuardStatus } = useGuardStatus(pharmacieId)
  const [refreshing, setRefreshing] = useState(false)

  const handleToggleGuard = async (value: boolean) => {
    try {
      await setGuardStatus(value)
      Alert.alert(
        'Statut mis à jour',
        value ? 'Votre pharmacie est maintenant en garde' : 'Garde désactivée'
      )
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut de garde')
    }
  }

  const handleUpdateStock = async (medicamentId: string, statut: 'disponible' | 'critique' | 'rupture') => {
    try {
      await updateStockStatus(pharmacieId, medicamentId, statut)
      // Success feedback could be added here
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le stock')
    }
  }

  const handleAddMedication = (medicament: any) => {
    // Add new medication with default status "disponible"
    handleUpdateStock(medicament.id, 'disponible')
  }

  const renderStockItem = ({ item }: { item: Stock }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockInfo}>
        <Text style={styles.medName}>{item.medicaments.nom_commercial}</Text>
        {item.medicaments.dci && (
          <Text style={styles.medDci}>{item.medicaments.dci}</Text>
        )}
        <Text style={styles.lastUpdate}>
          Mis à jour: {new Date(item.mis_a_jour_le).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      
      <View style={styles.stockActions}>
        <StockStatusBadge statut={item.statut} size="small" />
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.statut === 'disponible' && styles.actionButtonActive,
              styles.btnDisponible,
            ]}
            onPress={() => handleUpdateStock(item.medicaments.id, 'disponible')}
          >
            <Text style={styles.actionButtonText}>Dispo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.statut === 'critique' && styles.actionButtonActive,
              styles.btnCritique,
            ]}
            onPress={() => handleUpdateStock(item.medicaments.id, 'critique')}
          >
            <Text style={styles.actionButtonText}>Critique</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.statut === 'rupture' && styles.actionButtonActive,
              styles.btnRupture,
            ]}
            onPress={() => handleUpdateStock(item.medicaments.id, 'rupture')}
          >
            <Text style={styles.actionButtonText}>Rupture</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const stats = {
    total: stocks.length,
    disponible: stocks.filter(s => s.statut === 'disponible').length,
    critique: stocks.filter(s => s.statut === 'critique').length,
    rupture: stocks.filter(s => s.statut === 'rupture').length,
  }

  if (stocksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  if (stocksError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{stocksError}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pharmacyName}>{pharmacieNom}</Text>
        
        <View style={styles.guardToggle}>
          <Text style={styles.toggleLabel}>En garde aujourd'hui</Text>
          <Switch
            value={isOnGuard}
            onValueChange={handleToggleGuard}
            disabled={guardLoading}
            trackColor={{ false: '#9ca3af', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxDispo]}>
          <Text style={[styles.statValue, styles.textDispo]}>{stats.disponible}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxCritique]}>
          <Text style={[styles.statValue, styles.textCritique]}>{stats.critique}</Text>
          <Text style={styles.statLabel}>Critiques</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxRupture]}>
          <Text style={[styles.statValue, styles.textRupture]}>{stats.rupture}</Text>
          <Text style={styles.statLabel}>Ruptures</Text>
        </View>
      </View>

      {/* Quick Add Medication */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajouter un médicament</Text>
        <MedicationSearch
          pharmacieId={pharmacieId}
          onMedicationSelect={handleAddMedication}
          placeholder="Rechercher par nom ou DCI..."
        />
      </View>

      {/* Stock List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gérer les stocks ({stocks.length})</Text>
        
        {stocks.length === 0 ? (
          <View style={styles.emptyStock}>
            <Text style={styles.emptyText}>Aucun médicament en stock</Text>
            <Text style={styles.emptySubtext}>Utilisez la recherche ci-dessus pour ajouter des médicaments</Text>
          </View>
        ) : (
          <FlatList
            data={stocks}
            renderItem={renderStockItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.stockList}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pharmacyName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  guardToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statBox: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    minWidth: 70,
  },
  statBoxDispo: {
    backgroundColor: '#dcfce7',
  },
  statBoxCritique: {
    backgroundColor: '#fef3c7',
  },
  statBoxRupture: {
    backgroundColor: '#fee2e2',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  textDispo: {
    color: '#166534',
  },
  textCritique: {
    color: '#92400e',
  },
  textRupture: {
    color: '#991b1b',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  stockList: {
    paddingBottom: 16,
  },
  stockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stockInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  medDci: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  stockActions: {
    alignItems: 'flex-end',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  actionButtonActive: {
    borderColor: 'transparent',
  },
  btnDisponible: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  btnCritique: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  btnRupture: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStock: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
})

export default PharmacistDashboard
