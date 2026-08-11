import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Database } from '../types/database'

type StockStatut = Database['public']['Enums']['stock_statut']

interface StockStatusBadgeProps {
  statut: StockStatut
  size?: 'small' | 'medium' | 'large'
}

const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({ 
  statut, 
  size = 'medium' 
}) => {
  const getConfig = () => {
    switch (statut) {
      case 'disponible':
        return {
          label: 'Disponible',
          backgroundColor: '#dcfce7',
          textColor: '#166534',
          borderColor: '#22c55e',
        }
      case 'critique':
        return {
          label: 'Stock critique',
          backgroundColor: '#fef3c7',
          textColor: '#92400e',
          borderColor: '#f59e0b',
        }
      case 'rupture':
        return {
          label: 'Rupture',
          backgroundColor: '#fee2e2',
          textColor: '#991b1b',
          borderColor: '#ef4444',
        }
      default:
        return {
          label: statut,
          backgroundColor: '#f3f4f6',
          textColor: '#374151',
          borderColor: '#9ca3af',
        }
    }
  }

  const config = getConfig()
  
  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 10,
    },
    medium: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      fontSize: 14,
    },
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          ...sizeStyles[size],
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default StockStatusBadge
