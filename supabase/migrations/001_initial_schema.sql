-- Personal Fit Up — schema inicial (migrado do Base44)
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: tabela genérica com payload JSON (espelha entidades Base44)
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Macro via DO block para criar tabelas
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'alunos',
    'professores',
    'avaliacoes',
    'planos_treino',
    'periodizacoes',
    'especialistas',
    'exercicios_biblioteca',
    'produtos',
    'transacoes',
    'planos_corrida',
    'agenda',
    'biblioteca_treinos',
    'credenciais',
    'feedbacks_treino',
    'parq_respostas',
    'solicitacoes_vinculo',
    'configuracoes_stripe',
    'configuracoes_planos'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL DEFAULT ''{}''::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )', t);
    EXECUTE format('
      DROP TRIGGER IF EXISTS %I_updated_at ON %I', t, t);
    EXECUTE format('
      CREATE TRIGGER %I_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t, t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('
      DROP POLICY IF EXISTS "allow_anon_all" ON %I', t);
    EXECUTE format('
      CREATE POLICY "allow_anon_all" ON %I
      FOR ALL TO anon, authenticated
      USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Índices para filtros frequentes
CREATE INDEX IF NOT EXISTS idx_credenciais_email ON credenciais ((lower(data->>'email')));
CREATE INDEX IF NOT EXISTS idx_alunos_professor ON alunos ((data->>'professorId'));
CREATE INDEX IF NOT EXISTS idx_feedbacks_professor ON feedbacks_treino ((data->>'professorId'));
CREATE INDEX IF NOT EXISTS idx_feedbacks_aluno ON feedbacks_treino ((data->>'alunoId'));
CREATE INDEX IF NOT EXISTS idx_parq_aluno_status ON parq_respostas ((data->>'alunoId'), (data->>'status'));
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_vinculo ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_transacoes_reference ON transacoes ((data->>'referenceId'));

-- Storage para uploads (imagens, GIFs, PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "uploads_public_read" ON storage.objects;
CREATE POLICY "uploads_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "uploads_anon_insert" ON storage.objects;
CREATE POLICY "uploads_anon_insert" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "uploads_anon_update" ON storage.objects;
CREATE POLICY "uploads_anon_update" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "uploads_anon_delete" ON storage.objects;
CREATE POLICY "uploads_anon_delete" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'uploads');

-- Credenciais padrão (somente se tabela vazia)
INSERT INTO credenciais (id, data)
SELECT * FROM (VALUES
  ('admin-1', '{"email":"admin@fitpro.com","password":"admin123","role":"admin","nome":"Administrador FitPro","linkedId":"","ativo":true,"autoRegistrado":false}'::jsonb),
  ('prof-demo', '{"email":"professor@fitpro.com","password":"prof123","role":"professor","nome":"Prof. Demo Silva","linkedId":"prof-demo-linked","ativo":true,"autoRegistrado":false}'::jsonb),
  ('aluno-demo', '{"email":"aluno@fitpro.com","password":"aluno123","role":"aluno","nome":"Aluno Demo","linkedId":"","ativo":true,"autoRegistrado":false}'::jsonb)
) AS v(id, data)
WHERE NOT EXISTS (SELECT 1 FROM credenciais LIMIT 1);
