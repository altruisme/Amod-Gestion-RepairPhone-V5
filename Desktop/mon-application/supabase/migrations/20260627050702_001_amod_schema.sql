/*
# A.MO.D Gestion - Initial Schema

1. New Tables
- `fiches`: Repair tickets/cards
  - `id` (uuid, primary key)
  - `code` (text, unique, ticket number like AM-XXXXXX)
  - `nom` (text, client name)
  - `tel` (text, phone number)
  - `gmail` (text, email)
  - `model` (text, device model)
  - `fault` (text, problem description)
  - `lock` (text, security code/pattern)
  - `total` (numeric, total price)
  - `paye` (numeric, amount paid)
  - `depot` (timestamp, deposit date)
  - `retrait` (timestamp, pickup date)
  - `garantie` (text, warranty period)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- `finances`: Financial operations (entries and exits)
  - `id` (uuid, primary key)
  - `type` (text, "Entree" or "Sortie")
  - `subtype` (text, operation subtype)
  - `montant` (numeric, amount)
  - `nom` (text, person name)
  - `motif` (text, reason)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- `config`: Application configuration
  - `id` (uuid, primary key)
  - `header` (text, receipt header text)
  - `footer` (text, receipt footer text)
  - `logo` (text, base64 logo data)
  - `updated_at` (timestamp)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated full CRUD because this is a single-tenant app with no authentication.

3. Important Notes
1. This is a single-tenant application with no user authentication.
2. RLS policies allow full access to anon and authenticated roles.
3. The config table has only one row (singleton).
*/

CREATE TABLE IF NOT EXISTS fiches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  nom text NOT NULL,
  tel text DEFAULT '',
  gmail text DEFAULT '',
  model text NOT NULL,
  fault text DEFAULT '',
  lock text DEFAULT 'AUCUN',
  total numeric NOT NULL DEFAULT 0,
  paye numeric NOT NULL DEFAULT 0,
  depot timestamptz DEFAULT now(),
  retrait timestamptz,
  garantie text DEFAULT 'AUCUNE GARANTIE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  subtype text DEFAULT '',
  montant numeric NOT NULL DEFAULT 0,
  nom text DEFAULT '',
  motif text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  header text NOT NULL DEFAULT '✨ ETS AMIS DU MONDE DIVIN (A.MO.D) ✨
Maintenance Téléphonique & Vente
📍 Siège : Togokomé Carrefour
📞 Service Client : +228 93 88 94 78',
  footer text NOT NULL DEFAULT 'Diagnostic : Tout diagnostic sans réparation est facturé à 1000F CFA.
Sécurité : Retirez SIM et CARTE MÉMOIRE avant dépôt.
Garde : 1000F par semaine après 7 jours de réparation.
Retrait : Présentation obligatoire du reçu pour tout retrait.
Merci pour votre confiance chez A.MO.D !',
  logo text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fiches ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Fiches policies (anon + authenticated for single-tenant)
DROP POLICY IF EXISTS "anon_select_fiches" ON fiches;
CREATE POLICY "anon_select_fiches" ON fiches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fiches" ON fiches;
CREATE POLICY "anon_insert_fiches" ON fiches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fiches" ON fiches;
CREATE POLICY "anon_update_fiches" ON fiches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fiches" ON fiches;
CREATE POLICY "anon_delete_fiches" ON fiches FOR DELETE
  TO anon, authenticated USING (true);

-- Finances policies (anon + authenticated for single-tenant)
DROP POLICY IF EXISTS "anon_select_finances" ON finances;
CREATE POLICY "anon_select_finances" ON finances FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_finances" ON finances;
CREATE POLICY "anon_insert_finances" ON finances FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_finances" ON finances;
CREATE POLICY "anon_update_finances" ON finances FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_finances" ON finances;
CREATE POLICY "anon_delete_finances" ON finances FOR DELETE
  TO anon, authenticated USING (true);

-- Config policies (anon + authenticated for single-tenant)
DROP POLICY IF EXISTS "anon_select_config" ON config;
CREATE POLICY "anon_select_config" ON config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_config" ON config;
CREATE POLICY "anon_insert_config" ON config FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_config" ON config;
CREATE POLICY "anon_update_config" ON config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert default config row
INSERT INTO config (id, header, footer, logo)
VALUES ('00000000-0000-0000-0000-000000000001', 
  '✨ ETS AMIS DU MONDE DIVIN (A.MO.D) ✨
Maintenance Téléphonique & Vente
📍 Siège : Togokomé Carrefour
📞 Service Client : +228 93 88 94 78',
  'Diagnostic : Tout diagnostic sans réparation est facturé à 1000F CFA.
Sécurité : Retirez SIM et CARTE MÉMOIRE avant dépôt.
Garde : 1000F par semaine après 7 jours de réparation.
Retrait : Présentation obligatoire du reçu pour tout retrait.
Merci pour votre confiance chez A.MO.D !',
  '')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fiches_code ON fiches(code);
CREATE INDEX IF NOT EXISTS idx_fiches_nom ON fiches(nom);
CREATE INDEX IF NOT EXISTS idx_finances_created_at ON finances(created_at);
