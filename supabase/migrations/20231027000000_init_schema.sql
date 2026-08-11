-- PharmaGarde - Initial Schema Migration
-- Enable PostGIS extension for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enum for stock status
CREATE TYPE stock_statut AS ENUM ('disponible', 'critique', 'rupture');

-- Table: pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    telephone TEXT,
    emplacement GEOGRAPHY(POINT, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: gardes (pharmacy shifts)
CREATE TABLE IF NOT EXISTS gardes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacie_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    est_actif BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: medicaments
CREATE TABLE IF NOT EXISTS medicaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_commercial TEXT NOT NULL,
    dci TEXT, -- Dénomination Commune Internationale
    forme TEXT,
    code_cis TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: stocks
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacie_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
    medicament_id UUID REFERENCES medicaments(id) ON DELETE CASCADE NOT NULL,
    statut stock_statut DEFAULT 'disponible',
    mis_a_jour_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pharmacie_id, medicament_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pharmacies_emplacement ON pharmacies USING GIST(emplacement);
CREATE INDEX IF NOT EXISTS idx_gardes_pharmacie_id ON gardes(pharmacie_id);
CREATE INDEX IF NOT EXISTS idx_gardes_dates ON gardes(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_gardes_actif ON gardes(est_actif);
CREATE INDEX IF NOT EXISTS idx_stocks_pharmacie_id ON stocks(pharmacie_id);
CREATE INDEX IF NOT EXISTS idx_stocks_medicament_id ON stocks(medicament_id);
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON medicaments(nom_commercial);
CREATE INDEX IF NOT EXISTS idx_medicaments_dci ON medicaments(dci);

-- Function to search nearby pharmacies on guard
CREATE OR REPLACE FUNCTION rechercher_pharmacies_de_garde(
    lat FLOAT,
    lng FLOAT,
    rayon_km FLOAT DEFAULT 10.0
)
RETURNS TABLE (
    id UUID,
    nom TEXT,
    adresse TEXT,
    telephone TEXT,
    distance_km FLOAT,
    est_en_garde BOOLEAN,
    garde_id UUID,
    garde_date_debut TIMESTAMP WITH TIME ZONE,
    garde_date_fin TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_location GEOGRAPHY;
BEGIN
    user_location := ST_MakePoint(lng, lat)::GEOGRAPHY;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.nom,
        p.adresse,
        p.telephone,
        ROUND((ST_Distance(p.emplacement, user_location) / 1000)::NUMERIC, 2) AS distance_km,
        COALESCE(g.est_actif, false) AS est_en_garde,
        g.id AS garde_id,
        g.date_debut AS garde_date_debut,
        g.date_fin AS garde_date_fin
    FROM pharmacies p
    LEFT JOIN gardes g ON p.id = g.pharmacie_id 
        AND g.est_actif = true
        AND NOW() BETWEEN g.date_debut AND g.date_fin
    WHERE ST_DWithin(p.emplacement, user_location, rayon_km * 1000)
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable Row Level Security
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gardes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pharmacies (public read)
CREATE POLICY "Pharmacies are publicly readable"
    ON pharmacies FOR SELECT
    TO public
    USING (true);

-- RLS Policies for gardes (public read)
CREATE POLICY "Gardes are publicly readable"
    ON gardes FOR SELECT
    TO public
    USING (true);

-- RLS Policies for medicaments (public read)
CREATE POLICY "Medicaments are publicly readable"
    ON medicaments FOR SELECT
    TO public
    USING (true);

-- RLS Policies for stocks (public read, authenticated write)
CREATE POLICY "Stocks are publicly readable"
    ON stocks FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can update stocks"
    ON stocks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pharmacies_updated_at
    BEFORE UPDATE ON pharmacies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gardes_updated_at
    BEFORE UPDATE ON gardes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO pharmacies (nom, adresse, telephone, emplacement) VALUES
('Pharmacie Centrale', '15 Avenue des Champs-Élysées, 75008 Paris', '01 42 56 78 90', ST_MakePoint(2.307, 48.869)::GEOGRAPHY),
('Pharmacie de la Gare', '20 Boulevard de Strasbourg, 75010 Paris', '01 48 24 56 78', ST_MakePoint(2.355, 48.871)::GEOGRAPHY),
('Pharmacie du Parc', '5 Rue de la République, 69002 Lyon', '04 78 42 13 56', ST_MakePoint(4.835, 45.758)::GEOGRAPHY),
('Pharmacie Saint-Michel', '12 Place Saint-Michel, 75006 Paris', '01 43 26 78 90', ST_MakePoint(2.344, 48.853)::GEOGRAPHY),
('Pharmacie de la Mairie', '8 Avenue Jean Jaurès, 69004 Lyon', '04 72 10 20 30', ST_MakePoint(4.841, 45.775)::GEOGRAPHY);

INSERT INTO medicaments (nom_commercial, dci, forme, code_cis) VALUES
('Doliprane 1000mg', 'Paracétamol', 'Comprimé', '3400932123456'),
('Spasfon', 'Phloroglucinol', 'Comprimé', '3400932234567'),
('Smecta', 'Diosmectite', 'Poudre', '3400932345678'),
('Voltarène 1%', 'Diclofénac', 'Gel', '3400932456789'),
('Humex Rhume', 'Paracétamol + Pseudoéphédrine', 'Gélule', '3400932567890'),
('Gaviscon', 'Alginate + Bicarbonate', 'Suspension', '3400932678901'),
('Claritine', 'Loratadine', 'Comprimé', '3400932789012');

INSERT INTO gardes (pharmacie_id, date_debut, date_fin, est_actif) VALUES
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie Centrale'), NOW() - INTERVAL '1 hour', NOW() + INTERVAL '23 hours', true),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie de la Gare'), NOW() - INTERVAL '1 hour', NOW() + INTERVAL '23 hours', true),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie Saint-Michel'), NOW() - INTERVAL '1 hour', NOW() + INTERVAL '23 hours', true);

INSERT INTO stocks (pharmacie_id, medicament_id, statut) VALUES
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie Centrale'), (SELECT id FROM medicaments WHERE nom_commercial = 'Doliprane 1000mg'), 'disponible'),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie Centrale'), (SELECT id FROM medicaments WHERE nom_commercial = 'Spasfon'), 'disponible'),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie Centrale'), (SELECT id FROM medicaments WHERE nom_commercial = 'Smecta'), 'critique'),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie de la Gare'), (SELECT id FROM medicaments WHERE nom_commercial = 'Doliprane 1000mg'), 'disponible'),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie de la Gare'), (SELECT id FROM medicaments WHERE nom_commercial = 'Voltarène 1%'), 'rupture'),
((SELECT id FROM pharmacies WHERE nom = 'Pharmacie Saint-Michel'), (SELECT id FROM medicaments WHERE nom_commercial = 'Claritine'), 'disponible');
