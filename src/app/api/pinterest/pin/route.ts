import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const PT_API = 'https://api.pinterest.com/v5'

async function getToken(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'pinterest_access_token')
    .single()
  if (!data?.value) throw new Error('Token do Pinterest não configurado. Acesse as configurações.')
  return data.value
}

export async function POST(request: NextRequest) {
  let token: string
  try {
    token = await getToken()
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('image') as File | null
  const title = (formData.get('title') as string) || ''
  const description = (formData.get('description') as string) || ''
  const link = (formData.get('link') as string) || ''
  const boardId = (formData.get('boardId') as string) || ''
  const altText = (formData.get('altText') as string) || title

  if (!file) return NextResponse.json({ error: 'Imagem é obrigatória.' }, { status: 400 })
  if (!boardId) return NextResponse.json({ error: 'Selecione um board.' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 })

  // Converter imagem para base64
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const contentType = file.type || 'image/jpeg'

  const pinPayload: Record<string, any> = {
    board_id: boardId,
    title,
    description,
    alt_text: altText,
    media_source: {
      source_type: 'image_base64',
      content_type: contentType,
      data: base64,
    },
  }

  if (link) pinPayload.link = link

  try {
    const res = await fetch(`${PT_API}/pins`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinPayload),
    })

    const json = await res.json()

    if (json.code) throw new Error(json.message || 'Erro ao criar pin.')

    return NextResponse.json({
      success: true,
      pinId: json.id,
      pinUrl: `https://pinterest.com/pin/${json.id}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
