import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

type Params = { params: { id: string } }

// GET /api/posts/:id — buscar post com imagens e links
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = params

  const [postRes, imagensRes, linksRes] = await Promise.all([
    supabaseAdmin.from('posts').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('post_imagens')
      .select('*')
      .eq('post_id', id)
      .order('ordem', { ascending: true }),
    supabaseAdmin
      .from('post_links_internos')
      .select('*')
      .eq('post_id', id)
      .order('ordem', { ascending: true }),
  ])

  if (postRes.error) {
    const status = postRes.error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json<ApiResponse>({ error: postRes.error.message }, { status })
  }

  const post = {
    ...mapPost(postRes.data),
    imagens: (imagensRes.data || []).map(mapImagem),
    linksInternos: (linksRes.data || []).map(mapLink),
  }

  return NextResponse.json({ data: post })
}

// PATCH /api/posts/:id — atualizar post
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = params
  const body = await request.json().catch(() => ({}))

  // Separar links internos se vier no body
  const { linksInternos, ...postBody } = body

  // Montar update do post
  const updateData: Record<string, unknown> = {}
  if (postBody.tema !== undefined) updateData.tema = postBody.tema
  if (postBody.titulo !== undefined) updateData.titulo = postBody.titulo
  if (postBody.keyword !== undefined) updateData.keyword = postBody.keyword
  if (postBody.keywordVariacao !== undefined) updateData.keyword_variacao = postBody.keywordVariacao
  if (postBody.descricao !== undefined) updateData.descricao = postBody.descricao
  if (postBody.creditos !== undefined) updateData.creditos = postBody.creditos
  if (postBody.execucao !== undefined) updateData.execucao = postBody.execucao
  if (postBody.categoria !== undefined) updateData.categoria = postBody.categoria
  if (postBody.tags !== undefined) updateData.tags = postBody.tags
  if (postBody.slug !== undefined) updateData.slug = postBody.slug
  if (postBody.seoTitulo !== undefined) updateData.seo_titulo = postBody.seoTitulo
  if (postBody.seoDescricao !== undefined) updateData.seo_descricao = postBody.seoDescricao
  if (postBody.linkArtigoRelacionado !== undefined) updateData.link_artigo_relacionado = postBody.linkArtigoRelacionado
  if (postBody.semArtigoRelacionado !== undefined) updateData.sem_artigo_relacionado = postBody.semArtigoRelacionado
  if (postBody.observacoesInternas !== undefined) updateData.observacoes_internas = postBody.observacoesInternas
  if (postBody.htmlArtigo !== undefined) updateData.html_artigo = postBody.htmlArtigo
  if (postBody.status !== undefined) updateData.status = postBody.status
  if (postBody.wpPostId !== undefined) updateData.wp_post_id = postBody.wpPostId
  if (postBody.wpPostUrl !== undefined) updateData.wp_post_url = postBody.wpPostUrl
  if (postBody.wpFeaturedMediaId !== undefined) updateData.wp_featured_media_id = postBody.wpFeaturedMediaId
  if (postBody.erroPublicacao !== undefined) updateData.erro_publicacao = postBody.erroPublicacao

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promises: Promise<any>[] = []

  if (Object.keys(updateData).length > 0) {
    promises.push(
      supabaseAdmin.from('posts').update(updateData).eq('id', id).then()
    )
  }

  // Atualizar links internos se fornecido
  if (Array.isArray(linksInternos)) {
    promises.push(
      (async () => {
        await supabaseAdmin.from('post_links_internos').delete().eq('post_id', id)
        if (linksInternos.length > 0) {
          await supabaseAdmin.from('post_links_internos').insert(
            linksInternos.map((l: { url: string; anchorText: string }, i: number) => ({
              post_id: id,
              url: l.url,
              anchor_text: l.anchorText,
              ordem: i,
            }))
          )
        }
      })()
    )
  }

  await Promise.all(promises)

  return NextResponse.json({ message: 'Post atualizado.' })
}

// DELETE /api/posts/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = params

  // Buscar imagens para deletar do storage
  const { data: imagens } = await supabaseAdmin
    .from('post_imagens')
    .select('storage_path')
    .eq('post_id', id)

  if (imagens && imagens.length > 0) {
    const paths = imagens.map((img: { storage_path: string }) => img.storage_path)
    await supabaseAdmin.storage.from('post-images').remove(paths).catch(() => {})
  }

  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id)

  if (error) {
    return NextResponse.json<ApiResponse>({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Post excluído.' })
}

// ─── Mappers ──────────────────────────────────────────────────
function mapPost(row: Record<string, unknown>) {
  return {
    id: row.id,
    tema: row.tema,
    titulo: row.titulo,
    keyword: row.keyword,
    keywordVariacao: row.keyword_variacao,
    descricao: row.descricao,
    creditos: row.creditos,
    execucao: row.execucao,
    categoria: row.categoria,
    tags: row.tags,
    slug: row.slug,
    seoTitulo: row.seo_titulo,
    seoDescricao: row.seo_descricao,
    linkArtigoRelacionado: row.link_artigo_relacionado,
    semArtigoRelacionado: row.sem_artigo_relacionado,
    observacoesInternas: row.observacoes_internas,
    htmlArtigo: row.html_artigo,
    status: row.status,
    wpPostId: row.wp_post_id,
    wpPostUrl: row.wp_post_url,
    wpFeaturedMediaId: row.wp_featured_media_id,
    erroPublicacao: row.erro_publicacao,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    publicadoEm: row.publicado_em,
  }
}

function mapImagem(row: Record<string, unknown>) {
  return {
    id: row.id,
    postId: row.post_id,
    tipo: row.tipo,
    ordem: row.ordem,
    urlSupabase: row.url_supabase,
    urlWp: row.url_wp,
    wpMediaId: row.wp_media_id,
    altText: row.alt_text,
    legenda: row.legenda,
    nomeArquivo: row.nome_arquivo,
    criadoEm: row.criado_em,
  }
}

function mapLink(row: Record<string, unknown>) {
  return {
    id: row.id,
    postId: row.post_id,
    url: row.url,
    anchorText: row.anchor_text,
    ordem: row.ordem,
  }
}
