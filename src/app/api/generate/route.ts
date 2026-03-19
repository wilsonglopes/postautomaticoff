import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateArticleHtml, suggestSeoTitle, suggestSeoDescription, suggestSlug } from '@/lib/generator/article-generator'
import type { Post, ApiResponse } from '@/types'

// POST /api/generate — gerar HTML do artigo e atualizar no banco
export async function POST(request: NextRequest) {
  const { postId } = await request.json().catch(() => ({}))

  if (!postId) {
    return NextResponse.json<ApiResponse>({ error: 'postId não fornecido.' }, { status: 400 })
  }

  // Buscar post completo
  const [postRes, imagensRes, linksRes] = await Promise.all([
    supabaseAdmin.from('posts').select('*').eq('id', postId).single(),
    supabaseAdmin.from('post_imagens').select('*').eq('post_id', postId).order('ordem'),
    supabaseAdmin.from('post_links_internos').select('*').eq('post_id', postId).order('ordem'),
  ])

  if (postRes.error) {
    return NextResponse.json<ApiResponse>({ error: postRes.error.message }, { status: 500 })
  }

  const row = postRes.data

  const post: Post = {
    id: row.id,
    tema: row.tema || '',
    titulo: row.titulo || '',
    keyword: row.keyword || '',
    keywordVariacao: row.keyword_variacao || '',
    descricao: row.descricao || '',
    creditos: row.creditos || '',
    execucao: row.execucao || '',
    categoria: row.categoria || '',
    tags: row.tags || [],
    slug: row.slug || '',
    seoTitulo: row.seo_titulo || '',
    seoDescricao: row.seo_descricao || '',
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
    imagens: (imagensRes.data || []).map((img: Record<string, unknown>) => ({
      id: img.id as string,
      postId: img.post_id as string,
      tipo: img.tipo as 'peca' | 'molde' | 'destaque',
      ordem: img.ordem as number,
      urlSupabase: img.url_supabase as string,
      urlWp: img.url_wp as string | null,
      wpMediaId: img.wp_media_id as number | null,
      altText: (img.alt_text as string) || '',
      legenda: (img.legenda as string) || '',
      nomeArquivo: (img.nome_arquivo as string) || '',
      criadoEm: img.criado_em as string,
    })),
    linksInternos: (linksRes.data || []).map((l: Record<string, unknown>) => ({
      id: l.id as string,
      postId: l.post_id as string,
      url: l.url as string,
      anchorText: l.anchor_text as string,
      ordem: l.ordem as number,
    })),
  }

  if (!post.titulo || !post.keyword) {
    return NextResponse.json<ApiResponse>(
      { error: 'Título e palavra-chave são obrigatórios para gerar o artigo.' },
      { status: 400 }
    )
  }

  // Gerar HTML
  const htmlArtigo = generateArticleHtml(post)

  // Auto-sugestões se campos estiverem vazios
  const suggestions: Record<string, string> = {}
  if (!post.slug) suggestions.slug = suggestSlug(post.titulo, post.keyword)
  if (!post.seoTitulo) suggestions.seoTitulo = suggestSeoTitle(post.titulo, post.keyword)
  if (!post.seoDescricao) suggestions.seoDescricao = suggestSeoDescription(post.descricao, post.keyword, post.titulo)

  // Salvar no banco
  const updateData: Record<string, unknown> = { html_artigo: htmlArtigo }
  if (suggestions.slug) updateData.slug = suggestions.slug
  if (suggestions.seoTitulo) updateData.seo_titulo = suggestions.seoTitulo
  if (suggestions.seoDescricao) updateData.seo_descricao = suggestions.seoDescricao

  await supabaseAdmin.from('posts').update(updateData).eq('id', postId)

  return NextResponse.json({
    data: {
      htmlArtigo,
      suggestions,
    },
  })
}
