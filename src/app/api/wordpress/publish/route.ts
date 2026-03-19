import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { uploadMediaFromUrl } from '@/lib/wordpress/media'
import { createWpPost, updateWpPost, findOrCreateCategory, findOrCreateTag } from '@/lib/wordpress/posts'
import { generateArticleHtml } from '@/lib/generator/article-generator'
import type { Post, ApiResponse } from '@/types'

// POST /api/wordpress/publish
// Body: { postId: string, publicar: boolean } — publicar=true publica, false=rascunho
export async function POST(request: NextRequest) {
  const { postId, publicar = false } = await request.json().catch(() => ({}))

  if (!postId) {
    return NextResponse.json<ApiResponse>({ error: 'postId não fornecido.' }, { status: 400 })
  }

  // 1. Marcar como publicando
  await supabaseAdmin.from('posts').update({ status: 'publicando', erro_publicacao: null }).eq('id', postId)

  try {
    // 2. Buscar post completo
    const [postRes, imagensRes, linksRes] = await Promise.all([
      supabaseAdmin.from('posts').select('*').eq('id', postId).single(),
      supabaseAdmin.from('post_imagens').select('*').eq('post_id', postId).order('ordem'),
      supabaseAdmin.from('post_links_internos').select('*').eq('post_id', postId).order('ordem'),
    ])

    if (postRes.error) throw new Error(postRes.error.message)

    const row = postRes.data

    let post: Post = {
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

    if (!post.titulo) throw new Error('Título do post é obrigatório.')

    // 3. Upload de imagens para WordPress (as que ainda não têm wp_media_id)
    const imagensParaUpload = post.imagens.filter(img => !img.wpMediaId)

    for (const img of imagensParaUpload) {
      const wpMedia = await uploadMediaFromUrl(
        img.urlSupabase,
        img.nomeArquivo || `imagem-${img.id}.jpg`,
        img.altText
      )

      // Atualizar no banco
      await supabaseAdmin
        .from('post_imagens')
        .update({ wp_media_id: wpMedia.id, url_wp: wpMedia.source_url })
        .eq('id', img.id)

      // Atualizar no objeto em memória
      img.wpMediaId = wpMedia.id
      img.urlWp = wpMedia.source_url
    }

    // Atualizar lista de imagens no post (com URLs do WP)
    const imagensAtualizadas = await supabaseAdmin
      .from('post_imagens')
      .select('*')
      .eq('post_id', postId)
      .order('ordem')

    post = {
      ...post,
      imagens: (imagensAtualizadas.data || []).map((img: Record<string, unknown>) => ({
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
    }

    // 4. Gerar HTML com URLs do WordPress
    const htmlArtigo = generateArticleHtml(post)

    // 5. Imagem destacada
    const imagemDestaque = post.imagens.find(img => img.tipo === 'destaque')
    const featuredMediaId = imagemDestaque?.wpMediaId || null

    // 6. Categorias e tags
    let categoryIds: number[] = []
    let tagIds: number[] = []

    if (post.categoria) {
      const catId = await findOrCreateCategory(post.categoria).catch(() => null)
      if (catId) categoryIds = [catId]
    }

    if (post.tags && post.tags.length > 0) {
      const tagPromises = post.tags.map(tag => findOrCreateTag(tag).catch(() => null))
      const resolvedTags = await Promise.all(tagPromises)
      tagIds = resolvedTags.filter(Boolean) as number[]
    }

    // 7. Criar ou atualizar post no WordPress
    const wpPayload = {
      title: post.titulo,
      content: htmlArtigo,
      slug: post.slug || undefined,
      status: publicar ? 'publish' as const : 'draft' as const,
      featured_media: featuredMediaId || undefined,
      meta: {
        _yoast_wpseo_title: post.seoTitulo || undefined,
        _yoast_wpseo_metadesc: post.seoDescricao || undefined,
        _yoast_wpseo_focuskw: post.keyword || undefined,
        rank_math_title: post.seoTitulo || undefined,
        rank_math_description: post.seoDescricao || undefined,
        rank_math_focus_keyword: post.keyword || undefined,
      },
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: tagIds.length > 0 ? tagIds : undefined,
    }

    let wpPost
    if (post.wpPostId) {
      wpPost = await updateWpPost(post.wpPostId, wpPayload)
    } else {
      wpPost = await createWpPost(wpPayload)
    }

    // 8. Salvar resultado no banco
    await supabaseAdmin.from('posts').update({
      status: publicar ? 'publicado' : 'rascunho',
      wp_post_id: wpPost.id,
      wp_post_url: wpPost.link,
      wp_featured_media_id: featuredMediaId,
      html_artigo: htmlArtigo,
      publicado_em: publicar ? new Date().toISOString() : null,
      erro_publicacao: null,
    }).eq('id', postId)

    return NextResponse.json({
      data: {
        wpPostId: wpPost.id,
        wpPostUrl: wpPost.link,
        status: publicar ? 'publicado' : 'rascunho',
        htmlArtigo,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido na publicação.'

    // Registrar erro no banco
    await supabaseAdmin.from('posts').update({
      status: 'erro',
      erro_publicacao: message,
    }).eq('id', postId)

    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}
