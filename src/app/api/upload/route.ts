import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import type { ApiResponse } from '@/types'

// POST /api/upload
// FormData: file (File), postId (string), tipo ('peca'|'molde'|'destaque'), ordem (number), altText (string), legenda (string)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const postId = formData.get('postId') as string
    const tipo = (formData.get('tipo') as string) || 'peca'
    const ordem = parseInt((formData.get('ordem') as string) || '0')
    const altText = (formData.get('altText') as string) || ''
    const legenda = (formData.get('legenda') as string) || ''

    if (!file) {
      return NextResponse.json<ApiResponse>({ error: 'Arquivo não encontrado.' }, { status: 400 })
    }

    if (!postId) {
      return NextResponse.json<ApiResponse>({ error: 'postId não fornecido.' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        { error: 'Tipo de arquivo inválido. Use JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse>(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Extensão do arquivo
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uuid = randomUUID()
    const storagePath = `posts/${postId}/${tipo}/${uuid}.${ext}`

    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('post-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      return NextResponse.json<ApiResponse>(
        { error: `Erro no upload: ${storageError.message}` },
        { status: 500 }
      )
    }

    // URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('post-images')
      .getPublicUrl(storagePath)

    const urlPublica = urlData.publicUrl

    // Salvar no banco
    const { data: imagemRow, error: dbError } = await supabaseAdmin
      .from('post_imagens')
      .insert({
        post_id: postId,
        tipo,
        ordem,
        url_supabase: urlPublica,
        storage_path: storagePath,
        alt_text: altText,
        legenda,
        nome_arquivo: file.name,
        tamanho_arquivo: file.size,
      })
      .select()
      .single()

    if (dbError) {
      // Tentar remover o arquivo do storage em caso de falha no DB
      await supabaseAdmin.storage.from('post-images').remove([storagePath]).catch(() => {})
      return NextResponse.json<ApiResponse>({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        imagemId: imagemRow.id,
        urlPublica,
        storagePath,
        tipo,
        ordem,
        altText,
        legenda,
        nomeArquivo: file.name,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido no upload.'
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}

// DELETE /api/upload?imagemId=xxx
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imagemId = searchParams.get('imagemId')

  if (!imagemId) {
    return NextResponse.json<ApiResponse>({ error: 'imagemId não fornecido.' }, { status: 400 })
  }

  // Buscar caminho no storage
  const { data: imagem, error: fetchError } = await supabaseAdmin
    .from('post_imagens')
    .select('storage_path')
    .eq('id', imagemId)
    .single()

  if (fetchError || !imagem) {
    return NextResponse.json<ApiResponse>({ error: 'Imagem não encontrada.' }, { status: 404 })
  }

  // Remover do storage
  await supabaseAdmin.storage
    .from('post-images')
    .remove([imagem.storage_path])
    .catch(() => {})

  // Remover do banco
  await supabaseAdmin.from('post_imagens').delete().eq('id', imagemId)

  return NextResponse.json({ message: 'Imagem removida.' })
}

// PATCH /api/upload — atualizar ordem/altText/legenda de uma imagem
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { imagemId, ordem, altText, legenda } = body

  if (!imagemId) {
    return NextResponse.json<ApiResponse>({ error: 'imagemId não fornecido.' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (ordem !== undefined) update.ordem = ordem
  if (altText !== undefined) update.alt_text = altText
  if (legenda !== undefined) update.legenda = legenda

  const { error } = await supabaseAdmin
    .from('post_imagens')
    .update(update)
    .eq('id', imagemId)

  if (error) {
    return NextResponse.json<ApiResponse>({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Imagem atualizada.' })
}
