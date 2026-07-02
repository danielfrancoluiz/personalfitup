-- Configuração global dos planos de assinatura (valores para todos os professores)
CREATE TABLE IF NOT EXISTS configuracoes_planos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS configuracoes_planos_updated_at ON configuracoes_planos;
CREATE TRIGGER configuracoes_planos_updated_at
  BEFORE UPDATE ON configuracoes_planos
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE configuracoes_planos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_all" ON configuracoes_planos;
CREATE POLICY "allow_anon_all" ON configuracoes_planos
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
