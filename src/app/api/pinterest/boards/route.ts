import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const PT_API = 'https://api.pinterest.com/v5'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'pinterest_access_token')
    .single()

  if (!data?.value) return NextResponse.json({ error: 'Token não configurado.' }, { status: 400 })

  try {
    const res = await fetch(`${PT_API}/boards?page_size=50`, {
      headers: { Authorization: `Bearer ${data.value}` },
    })
    const json = await res.json()
    if (json.code) return NextResponse.json({ error: json.message }, { status: 400 })

    const boards = (json.items || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
    }))

    // Retorna também o board_id salvo como padrão
    const { data: savedBoard } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'pinterest_board_id')
      .single()

    return NextResponse.json({ boards, defaultBoardId: savedBoard?.value || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
