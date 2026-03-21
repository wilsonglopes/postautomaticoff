import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const FB_API = 'https://graph.facebook.com/v25.0'

// GET — verificar se token está configurado
export async function GET() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'fb_access_token')
    .single()

  return NextResponse.json({ configured: !!data?.value })
}

// POST — salvar token
export async function POST(request: NextRequest) {
  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token vazio.' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ key: 'fb_access_token', value: token })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PUT — testar token atual
export async function PUT() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'fb_access_token')
    .single()

  if (!data?.value) return NextResponse.json({ success: false, error: 'Token não configurado.' })

  try {
    const res = await fetch(`${FB_API}/me?fields=id,name&access_token=${data.value}`)
    const json = await res.json()
    if (json.error) return NextResponse.json({ success: false, error: json.error.message })
    return NextResponse.json({ success: true, name: json.name })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
