import type { Post, PostImagem, LinkInterno } from '@/types'
import { slugify } from '@/lib/utils/slugify'

// ─── Helpers ──────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ─── Blocos Gutenberg ─────────────────────────────────────────

function wpHeading(text: string, level = 2): string {
  return `<!-- wp:heading {"level":${level}} -->
<h${level} class="wp-block-heading">${text}</h${level}>
<!-- /wp:heading -->`
}

function wpParagraph(html: string): string {
  return `<!-- wp:paragraph -->
<p>${html}</p>
<!-- /wp:paragraph -->`
}

function wpImage(img: PostImagem): string {
  const src = img.urlWp || img.urlSupabase
  const alt = escapeHtml(img.altText || '')
  const caption = img.legenda ? escapeHtml(img.legenda) : ''
  const captionHtml = caption
    ? `\n<figcaption class="wp-element-caption">${caption}</figcaption>`
    : ''
  return `<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"/>${captionHtml}</figure>
<!-- /wp:image -->`
}

function wpList(items: string[]): string {
  const liHtml = items.map(i => `<li>${i}</li>`).join('\n')
  return `<!-- wp:list -->
<ul class="wp-block-list">
${liHtml}
</ul>
<!-- /wp:list -->`
}

function wpSeparator(): string {
  return `<!-- wp:separator -->
<hr class="wp-block-separator has-alpha-channel-opacity"/>
<!-- /wp:separator -->`
}

// ─── Subtítulos criativos ─────────────────────────────────────

function getCreativeSubtitle(titulo: string, keyword: string, tema: string): string {
  const templates = [
    `${titulo}: Passo a Passo Completo com Molde`,
    `Como Fazer ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Guia Completo`,
    `${titulo} — Molde Grátis e Dicas Especiais`,
    `Aprenda a Fazer ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} do Zero`,
    `${titulo}: Criatividade e Charme em Feltro`,
  ]
  const idx = (tema.length + titulo.length) % templates.length
  return templates[idx]
}

const MOLD_TIPS = [
  'Dica: numere as peças do molde com um lápis antes de recortar para facilitar a montagem e evitar confusões.',
  'Atenção: ao transferir os moldes para o feltro, use um lápis de cor clara para não marcar o tecido permanentemente.',
  'Dica de corte: use uma tesoura específica para tecido e corte sempre seguindo o contorno externo do molde.',
  'Lembre-se de imprimir na escala 1:1 (sem redimensionar) para garantir que as peças fiquem no tamanho correto.',
  'Dica de montagem: encaixe as peças secas antes de colar definitivamente para verificar o resultado final.',
]

const EXTRA_PIECE_TEXTS = [
  'Veja nos detalhes como esta peça é confeccionada com muito cuidado e carinho. Cada elemento é pensado para deixar o resultado final ainda mais especial e cheio de personalidade.',
  'O acabamento caprichado é o que faz toda a diferença em peças artesanais de feltro. Preste atenção nos detalhes e use cola quente com moderação para não manchar o feltro.',
  'Mais um ângulo da peça finalizada. Inspire-se nestes detalhes para criar a sua versão com o toque especial que só o seu artesanato tem!',
]

// ─── Gerador principal ────────────────────────────────────────

export function generateArticleHtml(post: Post): string {
  const {
    titulo,
    tema,
    keyword,
    keywordVariacao,
    descricao,
    creditos,
    execucao,
    imagens,
    linksInternos,
    linkArtigoRelacionado,
    semArtigoRelacionado,
  } = post

  const kw = escapeHtml(keyword)
  const kvs = escapeHtml(keywordVariacao || keyword)
  const desc = descricao.trim()

  const pieceImages = imagens.filter(img => img.tipo === 'peca').sort((a, b) => a.ordem - b.ordem)
  const moldImages  = imagens.filter(img => img.tipo === 'molde').sort((a, b) => a.ordem - b.ordem)
  const relatedUrl  = semArtigoRelacionado ? null : (linkArtigoRelacionado || null)

  const blocks: string[] = []

  // ── 1. Subtítulo criativo ──────────────────────────────────
  blocks.push(wpHeading(escapeHtml(getCreativeSubtitle(titulo, keyword, tema))))

  // ── 2. Introdução ──────────────────────────────────────────
  if (desc && desc.length > 50) {
    blocks.push(wpParagraph(`Se você está em busca de inspiração para criar um <strong>${kw}</strong> lindo e cheio de detalhes, você chegou ao lugar certo! ${escapeHtml(desc)}`))
  } else {
    blocks.push(wpParagraph(`Se você está procurando por <strong>${kw}</strong>, você chegou ao lugar certo! Neste post, preparamos um passo a passo completo com molde para você criar uma peça linda e cheia de charme.`))
  }
  blocks.push(wpParagraph(`O feltro é um dos materiais mais versáteis e acessíveis para o artesanato. Com os moldes e o passo a passo certos, qualquer pessoa consegue criar peças incríveis — desde iniciantes até quem já tem experiência. Seja para presentear, vender ou decorar a casa, o ${kvs} é sempre uma escolha certeira!`))

  // ── 3. Veja também (links internos) ───────────────────────
  if (linksInternos.length > 0) {
    blocks.push(wpParagraph('<strong>Veja também:</strong>'))
    blocks.push(wpList(
      linksInternos.slice(0, 2).map(l =>
        `👉 <a href="${escapeHtml(l.url)}" title="${escapeHtml(l.anchorText)}">${escapeHtml(l.anchorText)}</a>`
      )
    ))
  }

  // ── 4. Sobre a Peça ───────────────────────────────────────
  blocks.push(wpHeading(`Sobre a Peça: ${escapeHtml(titulo)}`))

  // ── 5. Primeira imagem da peça LOGO após o H2 ─────────────
  if (pieceImages.length > 0) {
    blocks.push(wpImage(pieceImages[0]))
  }

  // ── 6. Descrição da peça ──────────────────────────────────
  blocks.push(wpParagraph(`Esta é uma das criações mais encantadoras que você vai encontrar no Feltro Fácil. O <strong>${kw}</strong> é uma peça que une delicadeza e criatividade, perfeita para presentear em datas especiais ou para incrementar a decoração do ambiente.`))
  if (desc && desc.length > 30) {
    blocks.push(wpParagraph(escapeHtml(desc)))
  }

  // ── 7. Demais imagens da peça intercaladas com texto ──────
  for (let i = 1; i < pieceImages.length; i++) {
    blocks.push(wpParagraph(escapeHtml(EXTRA_PIECE_TEXTS[(i - 1) % EXTRA_PIECE_TEXTS.length])))
    blocks.push(wpImage(pieceImages[i]))
  }

  // ── 8. Seção dos moldes ───────────────────────────────────
  if (moldImages.length > 0) {
    blocks.push(wpHeading(`Molde para ${kw.charAt(0).toUpperCase() + kw.slice(1)}`))
    blocks.push(wpParagraph(`Confira abaixo os moldes para criar o seu <strong>${kw}</strong>. Imprima na escala 1:1 (sem redimensionar), transfira para o feltro com um lápis e corte com cuidado usando tesoura específica para tecido. Cada parte está identificada para facilitar a montagem.`))

    moldImages.forEach((img, i) => {
      blocks.push(wpImage(img))
      if (i < moldImages.length - 1) {
        // Dica entre moldes — nunca dois moldes seguidos
        blocks.push(wpParagraph(escapeHtml(MOLD_TIPS[i % MOLD_TIPS.length])))
      }
    })

    blocks.push(wpParagraph('Todos os moldes acima estão na proporção correta. Após recortar todas as peças, organize-as sobre uma superfície plana antes de iniciar a colagem para planejar a montagem.'))
  }

  // ── 9. Materiais ──────────────────────────────────────────
  blocks.push(wpHeading('Materiais Necessários'))
  blocks.push(wpParagraph('Para fazer esta peça, você vai precisar dos materiais básicos de artesanato em feltro: folhas de feltro nas cores indicadas nos moldes, cola quente, tesoura, agulha e linha. Materiais adicionais podem variar de acordo com o projeto.'))
  if (execucao && execucao.trim()) {
    blocks.push(wpParagraph(`<strong>Execução:</strong> ${escapeHtml(execucao.trim())}`))
  }
  blocks.push(wpParagraph('Dica: sempre use feltro de boa qualidade para garantir que sua peça fique durável e com uma aparência mais profissional.'))

  // ── 10. Links externos ────────────────────────────────────
  blocks.push(wpParagraph(`Para garantir a qualidade das suas criações, é fundamental usar materiais de primeira linha. Você encontra feltros em ótimas cores e espessuras na <a href="https://loja.feltrofacil.com.br" target="_blank" rel="noopener noreferrer">Loja Feltro Fácil</a>, que tem tudo o que você precisa para começar ou aperfeiçoar suas peças de ${kw}. Outra excelente opção é a <a href="https://www.feltrossantafe.net/" target="_blank" rel="noopener noreferrer">Feltros Santa Fé</a>, referência nacional em feltros de alta qualidade com diversas cores e espessuras disponíveis.`))

  // ── 11. Fechamento ────────────────────────────────────────
  const kwCap = kw.charAt(0).toUpperCase() + kw.slice(1)
  blocks.push(wpHeading(`Gostou do ${kwCap}?`))
  blocks.push(wpParagraph(`Esperamos que você tenha adorado este tutorial! O artesanato em feltro é uma atividade que une criatividade, relaxamento e a satisfação de criar algo com as próprias mãos. Se você fez a sua versão desta peça, adoraríamos ver o resultado — compartilhe nas redes sociais e marque o Feltro Fácil!`))

  const closingLinks = linksInternos.length > 2 ? linksInternos.slice(2) : linksInternos
  if (closingLinks.length > 0) {
    blocks.push(wpParagraph('Você também vai adorar estas criações do blog:'))
    blocks.push(wpList(closingLinks.slice(0, 3).map(l => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.anchorText)}</a>`)))
  }

  if (relatedUrl) {
    blocks.push(wpParagraph(`Gostou desta ideia? Não deixe de conferir também este post relacionado: <a href="${escapeHtml(relatedUrl)}">ver post relacionado</a>.`))
  }

  blocks.push(wpParagraph('Continue navegando pelo blog para encontrar mais tutoriais, moldes e inspirações para o seu artesanato em feltro. Novos conteúdos são publicados regularmente para te ajudar a criar peças cada vez mais lindas. 🧵✂️'))

  // ── 12. Créditos ──────────────────────────────────────────
  if (creditos || execucao) {
    blocks.push(wpSeparator())
    const parts: string[] = []
    if (creditos) parts.push(`<strong>Créditos:</strong> ${escapeHtml(creditos)}`)
    if (execucao) parts.push(`<strong>Execução:</strong> ${escapeHtml(execucao)}`)
    blocks.push(wpParagraph(parts.join(' | ')))
  }

  return blocks.join('\n\n')
}

// ─── Auto-sugestões ───────────────────────────────────────────

export function suggestSlug(titulo: string, keyword: string): string {
  const base = keyword || titulo
  return slugify(base)
}

export function suggestSeoTitle(titulo: string, keyword: string): string {
  if (titulo.toLowerCase().includes(keyword.toLowerCase())) {
    return titulo.length <= 60 ? titulo : titulo.substring(0, 57) + '...'
  }
  const candidate = `${titulo} – ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`
  return candidate.length <= 60 ? candidate : titulo.substring(0, 57) + '...'
}

export function suggestSeoDescription(
  descricao: string,
  keyword: string,
  titulo: string
): string {
  if (descricao && descricao.trim().length >= 100) {
    const trimmed = descricao.trim()
    const withKw = trimmed.toLowerCase().includes(keyword.toLowerCase())
      ? trimmed
      : `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} – ${trimmed}`
    return withKw.length <= 160 ? withKw : withKw.substring(0, 157) + '...'
  }
  const candidate = `Aprenda a fazer ${keyword} com molde completo e passo a passo. ${titulo} é uma peça linda para decoração ou presente. Confira no Feltro Fácil!`
  return candidate.length <= 160 ? candidate : candidate.substring(0, 157) + '...'
}

export function suggestAltText(tema: string, tipo: 'peca' | 'molde', index: number): string {
  if (tipo === 'molde') {
    return `molde ${tema.toLowerCase()} número ${index + 1}`
  }
  return `${tema.toLowerCase()} de feltro ${index > 0 ? `- foto ${index + 1}` : ''}`.trim()
}

export function suggestKeyword(tema: string): string {
  return `${tema.toLowerCase()} de feltro`
}

export function suggestTags(tema: string, categoria: string): string[] {
  const base = [
    'feltro',
    'artesanato em feltro',
    'molde de feltro',
    tema.toLowerCase(),
    `${tema.toLowerCase()} de feltro`,
  ]
  if (categoria) base.push(categoria.toLowerCase())
  return [...new Set(base)].slice(0, 8)
}
