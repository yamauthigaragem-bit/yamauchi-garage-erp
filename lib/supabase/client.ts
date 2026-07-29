import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * O cliente só é criado depois que as variáveis de ambiente forem configuradas.
 * Assim, a versão demonstrável continua abrindo enquanto o Supabase não é ligado.
 */
export const supabase = url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = Boolean(supabase);
