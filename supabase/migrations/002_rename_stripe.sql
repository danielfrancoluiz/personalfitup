-- Renomeia tabela de configuração PagBank → Stripe (dados preservados)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'configuracoes_pagbank'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'configuracoes_stripe'
  ) THEN
    ALTER TABLE configuracoes_pagbank RENAME TO configuracoes_stripe;
  END IF;
END $$;

-- Garante tabela para novos ambientes
CREATE TABLE IF NOT EXISTS configuracoes_stripe (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE configuracoes_stripe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_anon_all" ON configuracoes_stripe;
CREATE POLICY "allow_anon_all" ON configuracoes_stripe
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
