import type { Post, SeoCheck, SeoReport, SeoCheckStatus } from '@/types'

function check(
  id: string,
  label: string,
  status: SeoCheckStatus,
  message: string
): SeoCheck {
  return { id, label, status, message }
}

export function analyzeSeo(post: Post): SeoReport {
  const checks: SeoCheck[] = []
  const kw = post.keyword.toLowerCase().trim()

  if (!kw) {
    return {
      score: 0,
      keyword: '',
      checks: [
        check('no-keyword', 'Palavra-chave', 'erro', 'Palavra-chave foco não definida.'),
      ],
    }
  }

  // 1. Keyword no título
  const tituloHasKw = post.titulo.toLowerCase().includes(kw)
  checks.push(
    check(
      'kw-titulo',
      'Palavra-chave no título',
      tituloHasKw ? 'ok' : 'erro',
      tituloHasKw
        ? 'A palavra-chave aparece no título do post.'
        : 'A palavra-chave não está no título. Adicione para melhorar o SEO.'
    )
  )

  // 2. Keyword no meta título SEO
  const seoTituloHasKw = post.seoTitulo.toLowerCase().includes(kw)
  checks.push(
    check(
      'kw-seo-titulo',
      'Palavra-chave no meta título',
      seoTituloHasKw ? 'ok' : 'aviso',
      seoTituloHasKw
        ? 'A palavra-chave está no meta título.'
        : 'Considere incluir a palavra-chave no meta título.'
    )
  )

  // 3. Keyword na meta descrição
  const seoDescHasKw = post.seoDescricao.toLowerCase().includes(kw)
  checks.push(
    check(
      'kw-seo-desc',
      'Palavra-chave na meta descrição',
      seoDescHasKw ? 'ok' : 'aviso',
      seoDescHasKw
        ? 'A palavra-chave está na meta descrição.'
        : 'Inclua a palavra-chave na meta descrição para melhores resultados.'
    )
  )

  // 4. Keyword na descrição/introdução
  const descHasKw = post.descricao.toLowerCase().includes(kw)
  checks.push(
    check(
      'kw-descricao',
      'Palavra-chave na introdução',
      descHasKw ? 'ok' : 'aviso',
      descHasKw
        ? 'A palavra-chave está na descrição do post.'
        : 'Mencione a palavra-chave na descrição/introdução.'
    )
  )

  // 5. Comprimento do meta título (50-60 chars ideal)
  const seoTituloLen = post.seoTitulo.length
  const titleLenStatus: SeoCheckStatus =
    seoTituloLen >= 40 && seoTituloLen <= 60 ? 'ok' : seoTituloLen < 20 ? 'erro' : 'aviso'
  checks.push(
    check(
      'titulo-length',
      `Meta título (${seoTituloLen} chars)`,
      titleLenStatus,
      seoTituloLen === 0
        ? 'Meta título não preenchido.'
        : seoTituloLen < 40
        ? `Meta título muito curto (${seoTituloLen} chars). Ideal: 50–60.`
        : seoTituloLen > 60
        ? `Meta título muito longo (${seoTituloLen} chars). Ideal: máximo 60.`
        : `Meta título com tamanho ideal (${seoTituloLen} chars).`
    )
  )

  // 6. Comprimento da meta descrição (120-160 chars ideal)
  const seoDescLen = post.seoDescricao.length
  const descLenStatus: SeoCheckStatus =
    seoDescLen >= 100 && seoDescLen <= 160 ? 'ok' : seoDescLen < 50 ? 'erro' : 'aviso'
  checks.push(
    check(
      'desc-length',
      `Meta descrição (${seoDescLen} chars)`,
      descLenStatus,
      seoDescLen === 0
        ? 'Meta descrição não preenchida.'
        : seoDescLen < 100
        ? `Meta descrição muito curta (${seoDescLen} chars). Ideal: 120–160.`
        : seoDescLen > 160
        ? `Meta descrição muito longa (${seoDescLen} chars). Pode ser cortada no Google.`
        : `Meta descrição com tamanho ideal (${seoDescLen} chars).`
    )
  )

  // 7. Slug contém keyword
  const slugHasKw = post.slug.includes(kw.replace(/\s+/g, '-'))
  checks.push(
    check(
      'slug-kw',
      'Palavra-chave no slug',
      slugHasKw ? 'ok' : 'aviso',
      slugHasKw
        ? 'O slug contém a palavra-chave.'
        : 'Considere incluir a palavra-chave no slug da URL.'
    )
  )

  // 8. Slug preenchido
  const slugOk = /^[a-z0-9-]+$/.test(post.slug)
  checks.push(
    check(
      'slug-format',
      'Formato do slug',
      post.slug && slugOk ? 'ok' : post.slug ? 'aviso' : 'erro',
      !post.slug
        ? 'Slug não preenchido.'
        : !slugOk
        ? 'O slug contém caracteres inválidos. Use apenas letras minúsculas, números e hífens.'
        : 'Slug com formato correto.'
    )
  )

  // 9. Imagens com alt text
  const contentImages = post.imagens.filter(img => img.tipo !== 'destaque')
  const imgsWithAlt = contentImages.filter(img => img.altText.trim().length > 0)
  const allImgsHaveAlt = contentImages.length > 0 && imgsWithAlt.length === contentImages.length
  checks.push(
    check(
      'img-alt',
      `Alt text nas imagens (${imgsWithAlt.length}/${contentImages.length})`,
      allImgsHaveAlt ? 'ok' : contentImages.length === 0 ? 'aviso' : 'aviso',
      contentImages.length === 0
        ? 'Nenhuma imagem de conteúdo adicionada ainda.'
        : allImgsHaveAlt
        ? 'Todas as imagens têm texto alternativo (alt text).'
        : `${contentImages.length - imgsWithAlt.length} imagem(ns) sem alt text. Preencha para melhorar SEO e acessibilidade.`
    )
  )

  // 10. Links internos
  const hasLinks = post.linksInternos.length > 0
  checks.push(
    check(
      'links-internos',
      `Links internos (${post.linksInternos.length})`,
      hasLinks ? 'ok' : 'aviso',
      hasLinks
        ? `${post.linksInternos.length} link(s) interno(s) adicionado(s).`
        : 'Adicione links internos para melhorar a navegação e o SEO.'
    )
  )

  // 11. Imagem destacada
  const hasFeatured = post.imagens.some(img => img.tipo === 'destaque')
  checks.push(
    check(
      'imagem-destaque',
      'Imagem destacada',
      hasFeatured ? 'ok' : 'erro',
      hasFeatured
        ? 'Imagem destacada definida.'
        : 'Nenhuma imagem destacada. É obrigatória para publicação no WordPress.'
    )
  )

  // ─── Calcular score ───────────────────────────────────────
  const weights: Record<string, number> = {
    'kw-titulo': 3,
    'kw-seo-titulo': 2,
    'kw-seo-desc': 2,
    'kw-descricao': 2,
    'titulo-length': 2,
    'desc-length': 2,
    'slug-kw': 1,
    'slug-format': 2,
    'img-alt': 1,
    'links-internos': 1,
    'imagem-destaque': 3,
  }

  let total = 0
  let maxTotal = 0

  checks.forEach(c => {
    const w = weights[c.id] ?? 1
    maxTotal += w * 2
    if (c.status === 'ok') total += w * 2
    else if (c.status === 'aviso') total += w * 1
  })

  const score = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0

  return { score, checks, keyword: post.keyword }
}
