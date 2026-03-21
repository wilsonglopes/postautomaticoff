import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const PT_API = 'https://api.pinterest.com/v5'

// GET — verificar se token está configurado
export async function GET() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'pinterest_access_token')
    .single()

  return NextResponse.json({ configured: !!data?.value })
}

// POST — salvar token e board_id padrão
export async function POST(request: NextRequest) {
  const { token, boardId } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token vazio.' }, { status: 400 })

  const upserts = [
    supabaseAdmin.from('settings').upsert({ key: 'pinterest_access_token', value: token }),
  ]
  if (boardId) {
    upserts.push(supabaseAdmin.from('settings').upsert({ key: 'pinterest_board_id', value: boardId }))
  }

  await Promise.all(upserts)
  return NextResponse.json({ success: true })
}

// PUT — testar token (retorna nome do usuário)
export async function PUT() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'pinterest_access_token')
    .single()

  if (!data?.value) return NextResponse.json({ success: false, error: 'Token não configurado.' })

  try {
    const res = await fetch(`${PT_API}/user_account`, {
      headers: { Authorization: `Bearer ${data.value}` },
    })
    const json = await res.json()
    if (json.code) return NextResponse.json({ success: false, error: json.message })
    return NextResponse.json({ success: true, name: json.username })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
