# PharmaGarde - MVP

Application mobile/web de localisation des pharmacies de garde en temps réel.

## 🎯 Fonctionnalités

### Pour les Utilisateurs
- **Localisation en temps réel** des pharmacies de garde autour de leur position
- **Recherche de médicaments** avec vérification de disponibilité par pharmacie
- **Affichage sur carte interactive** avec distances et statuts d'ouverture

### Pour les Pharmaciens
- **Dashboard simple** pour gérer le statut de garde (ON/OFF)
- **Mise à jour rapide des stocks** en 1 clic (Disponible / Critique / Rupture)
- **Vue d'ensemble** des statistiques de stock

## 📁 Structure du Projet

```
/workspace
├── supabase/migrations/
│   └── 20231027000000_init_schema.sql    # Schéma de base de données complet
├── src/
│   ├── components/
│   │   ├── PharmacyMap.tsx               # Carte interactive
│   │   ├── PharmacyList.tsx              # Liste des pharmacies
│   │   ├── MedicationSearch.tsx          # Recherche de médicaments
│   │   ├── StockStatusBadge.tsx          # Badge de statut de stock
│   │   └── PharmacistDashboard.tsx       # Dashboard pharmacien
│   ├── hooks/
│   │   └── index.ts                      # Hooks React personnalisés
│   ├── lib/
│   │   └── supabaseClient.ts             # Client Supabase typé
│   └── types/
│       └── database.ts                   # Types TypeScript auto-générés
├── .env.example                          # Variables d'environnement
└── README.md
```

## 🚀 Installation

### 1. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Exécutez le script SQL dans l'éditeur SQL de Supabase :
   ```bash
   supabase/migrations/20231027000000_init_schema.sql
   ```
3. Récupérez vos identifiants dans Settings > API

### 2. Installation des dépendances

```bash
npm install
# ou
yarn install
```

### 3. Configuration des variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` avec vos identifiants Supabase :
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Installation des dépendances supplémentaires

```bash
# Pour React Native / Expo
npm install @supabase/supabase-js react-native-maps expo-location
# ou
yarn add @supabase/supabase-js react-native-maps expo-location
```

## 🔧 Technologies Utilisées

- **Frontend**: React Native avec Expo (TypeScript)
- **Backend & Base de données**: Supabase (PostgreSQL + Auth + Realtime + PostGIS)
- **Géolocalisation**: PostGIS pour les requêtes spatiales
- **UI Components**: React Native standard, compatible avec NativeWind

## 📊 Modèle de Données

### Tables principales

1. **pharmacies** - Informations des pharmacies avec géolocalisation
2. **gardes** - Horaires de garde des pharmacies
3. **medicaments** - Catalogue des médicaments
4. **stocks** - Disponibilité des médicaments par pharmacie

### Fonction RPC

`rechercher_pharmacies_de_garde(lat, lng, rayon_km)` - Retourne les pharmacies triées par proximité avec statut de garde

## 🔒 Sécurité (RLS)

- **Lecture publique** pour les pharmacies, gardes, médicaments et stocks
- **Écriture restreinte** aux utilisateurs authentifiés pour les stocks uniquement

## 🎨 Composants Disponibles

- `PharmacyMap` - Carte interactive avec marqueurs colorés
- `PharmacyList` - Liste des pharmacies triées par distance
- `MedicationSearch` - Barre de recherche avec autocomplétion
- `StockStatusBadge` - Badge de statut (disponible/critique/rupture)
- `PharmacistDashboard` - Interface de gestion pour pharmaciens

## 🪝 Hooks Personnalisés

- `useLocation()` - Géolocalisation utilisateur
- `usePharmacies(radiusKm)` - Recherche de pharmacies proches
- `usePharmacyStocks(pharmacieId)` - Stocks en temps réel
- `useMedicationSearch()` - Recherche de médicaments
- `useGuardStatus(pharmacieId)` - Gestion du statut de garde

## 📱 Prochaines Étapes

1. Créer les écrans complets (HomeScreen, PharmacyDetailScreen, etc.)
2. Ajouter la navigation (React Navigation ou Expo Router)
3. Implémenter l'authentification des pharmaciens
4. Ajouter les notifications push pour les changements de statut
5. Déployer sur iOS et Android via EAS Build

## 📄 Licence

MIT
