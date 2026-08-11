import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import type { Database } from '../types/database'

type Pharmacy = Database['public']['Functions']['rechercher_pharmacies_de_garde']['Returns'][number]

interface PharmacyMapProps {
  pharmacies: Pharmacy[]
  userLocation?: { latitude: number; longitude: number }
  onPharmacyPress?: (pharmacy: Pharmacy) => void
  radiusKm?: number
}

const PharmacyMap: React.FC<PharmacyMapProps> = ({
  pharmacies,
  userLocation,
  onPharmacyPress,
  radiusKm = 10
}) => {
  const [mapRegion, setMapRegion] = useState({
    latitude: userLocation?.latitude || 48.8566,
    longitude: userLocation?.longitude || 2.3522,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  })

  useEffect(() => {
    if (userLocation) {
      setMapRegion(prev => ({
        ...prev,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }))
    }
  }, [userLocation])

  if (!pharmacies || pharmacies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Aucune pharmacie trouvée dans cette zone</Text>
      </View>
    )
  }

  // Calculate map bounds to include all pharmacies and user location
  const calculateRegion = () => {
    if (pharmacies.length === 0 && !userLocation) return mapRegion

    let minLat = userLocation?.latitude || 90
    let maxLat = userLocation?.latitude || -90
    let minLng = userLocation?.longitude || 180
    let maxLng = userLocation?.longitude || -180

    pharmacies.forEach(pharmacy => {
      // Note: In a real app, you'd need to extract lat/lng from the geography field
      // This is a simplified version
      const coords = extractCoordinates(pharmacy)
      if (coords) {
        minLat = Math.min(minLat, coords.latitude)
        maxLat = Math.max(maxLat, coords.latitude)
        minLng = Math.min(minLng, coords.longitude)
        maxLng = Math.max(maxLng, coords.longitude)
      }
    })

    const latDelta = (maxLat - minLat) * 1.5 || 0.1
    const lngDelta = (maxLng - minLng) * 1.5 || 0.1

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    }
  }

  const extractCoordinates = (pharmacy: Pharmacy) => {
    // In production, you'd parse the GEOGRAPHY field from Supabase
    // For now, this is a placeholder - coordinates should be stored separately or parsed
    return null
  }

  const getMarkerColor = (estEnGarde: boolean) => {
    return estEnGarde ? '#22c55e' : '#f97316' // Green for on-guard, Orange for off-guard
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      region={calculateRegion()}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={!!userLocation}
    >
      {/* User Location Marker */}
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Votre position"
          pinColor="#3b82f6"
        />
      )}

      {/* Pharmacy Markers */}
      {pharmacies.map((pharmacy, index) => (
        <Marker
          key={pharmacy.id || index}
          coordinate={{
            latitude: 48.8566 + (index * 0.01), // Placeholder - replace with actual coordinates
            longitude: 2.3522 + (index * 0.01), // Placeholder - replace with actual coordinates
          }}
          title={pharmacy.nom}
          description={`${pharmacy.adresse}\n${pharmacy.distance_km?.toFixed(2)} km`}
          pinColor={getMarkerColor(pharmacy.est_en_garde)}
          onPress={() => onPharmacyPress?.(pharmacy)}
        >
          <View style={styles.markerContainer}>
            <View
              style={[
                styles.markerDot,
                { backgroundColor: getMarkerColor(pharmacy.est_en_garde) },
              ]}
            />
            {pharmacy.est_en_garde && <View style={styles.guardBadge} />}
          </View>
        </Marker>
      ))}

      {/* Radius Circle (optional) */}
      {userLocation && (
        <MapView.Circle
          center={userLocation}
          radius={radiusKm * 1000}
          strokeColor="#3b82f650"
          fillColor="#3b82f620"
          strokeWidth={2}
        />
      )}
    </MapView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  guardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
})

export default PharmacyMap
