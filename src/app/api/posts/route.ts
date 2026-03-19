import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

// GET /api/posts — listar todos os posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json<ApiResponse>({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/posts — criar novo post (rascunho vazio)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      tema: body.tema || '',
      titulo: body.titulo || 'Novo Post',
      keyword: body.keyword || '',
      keyword_variacao: body.keywordVariacao || '',
      descricao: body.descricao || '',
      creditos: body.creditos || '',
      execucao: body.execucao || '',
      categoria: body.categoria || '',
      tags: body.tags || [],
      slug: body.slug || '',
      seo_titulo: body.seoTitulo || '',
      seo_descricao: body.seoDescricao || '',
      link_artigo_relacionado: body.linkArtigoRelacionado || null,
      sem_artigo_relacionado: body.semArtigoRelacionado || false,
      observacoes_internas: body.observacoesInternas || null,
      status: 'rascunho',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json<ApiResponse>({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
