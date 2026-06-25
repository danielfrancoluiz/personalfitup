/**
 * Camada de compatibilidade — substitui o cliente Base44 por Supabase.
 * Os imports existentes (`import { base44 } from '@/api/base44Client'`) continuam funcionando.
 */
import { dataClient } from './dataClient';

export const base44 = dataClient;
export default dataClient;
