import { NextResponse } from 'next/server'

// GET /api/debug — diagnóstico de variáveis e conexão Supabase
export async function GET() {
  const checks: Record<string, string> = {}

  // Verificar variáveis de ambiente
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO'
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO'
  checks.WP_BASE_URL = process.env.WP_BASE_URL ? 'OK' : 'FALTANDO'
  checks.WP_USERNAME = process.env.WP_USERNAME ? 'OK' : 'FALTANDO'
  checks.WP_APP_PASSWORD = process.env.WP_APP_PASSWORD ? 'OK' : 'FALTANDO'
  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? 'OK' : 'FALTANDO'

  // Testar conexão Supabase
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { error } = await supabase.from('posts').select('id').limit(1)
    checks.supabase_connection = error ? `ERRO: ${error.message}` : 'OK'
  } catch (err) {
    checks.supabase_connection = `EXCEÇÃO: ${err instanceof Error ? err.message : String(err)}`
  }

  return NextResponse.json(checks)
}
