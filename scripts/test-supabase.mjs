import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data, error } = await supabase.from('credenciais').select('id').limit(3);
if (error) {
  console.error('ERRO:', error.message);
  process.exit(1);
}
console.log('OK — credenciais:', data?.length ?? 0, 'registro(s)');
console.log(data);
