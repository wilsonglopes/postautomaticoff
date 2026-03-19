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

function buildImageTag(img: PostImagem): string {
  const src = img.urlWp || img.urlSupabase
  const alt = escapeHtml(img.altText || '')
  const caption = img.legenda ? escapeHtml(img.legenda) : ''
  const captionHtml = caption
    ? `\n  <figcaption class="wp-element-caption">${caption}</figcaption>`
    : ''
  return `<figure class="wp-block-image size-large aligncenter">
  <img src="${src}" alt="${alt}" loading="lazy" decoding="async" />${captionHtml}
</figure>`
}

function buildInternalLinkBlock(links: LinkInterno[]): string {
  if (!links.length) return ''
  const items = links
    .map(l => `<li>👉 <a href="${escapeHtml(l.url)}" title="${escapeHtml(l.anchorText)}">${escapeHtml(l.anchorText)}</a></li>`)
    .join('\n')
  return `<div class="wp-block-group veja-tambem">
<p><strong>Veja também:</strong></p>
<ul>
${items}
</ul>
</div>`
}

function buildExternalLinksText(keyword: string): string {
  return `<p>Para garantir a qualidade das suas criações, é fundamental usar materiais de primeira linha. Você encontra feltros em ótimas cores e espessuras na <a href="https://loja.feltrofacil.com.br" target="_blank" rel="noopener noreferrer">Loja Feltro Fácil</a>, que tem tudo o que você precisa para começar ou aperfeiçoar suas peças de ${escapeHtml(keyword)}. Outra excelente opção é a <a href="https://www.feltrossantafe.net/" target="_blank" rel="noopener noreferrer">Feltros Santa Fé</a>, referência nacional em feltros de alta qualidade com diversas cores e espessuras disponíveis.</p>`
}

// ─── Subtítulos criativos por tema ────────────────────────────

function getCreativeSubtitle(titulo: string, keyword: string, tema: string): string {
  const templates = [
    `${titulo}: Passo a Passo Completo com Molde`,
    `Como Fazer ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Guia Completo`,
    `${titulo} — Molde Grátis e Dicas Especiais`,
    `Aprenda a Fazer ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} do Zero`,
    `${titulo}: Criatividade e Charme em Feltro`,
  ]
  // Escolher baseado no tamanho do tema para ser determinístico
  const idx = (tema.length + titulo.length) % templates.length
  return templates[idx]
}

function getIntroText(descricao: string, keyword: string, keywordVariacao: string): string {
  const kw = escapeHtml(keyword)
  const kvs = escapeHtml(keywordVariacao)
  const desc = descricao.trim()

  if (desc && desc.length > 50) {
    return `<p>Se você está em busca de inspiração para criar um <strong>${kw}</strong> lindo e cheio de detalhes, você chegou ao lugar certo! ${escapeHtml(desc)}</p>
<p>O feltro é um dos materiais mais versáteis e acessíveis para o artesanato. Com os moldes e o passo a passo certos, qualquer pessoa consegue criar peças incríveis — desde iniciantes até quem já tem experiência. Seja para presentear, vender ou decorar a casa, o ${kvs || kw} é sempre uma escolha certeira!</p>`
  }

  return `<p>Se você está procurando por <strong>${kw}</strong>, você chegou ao lugar certo! Neste post, preparamos um passo a passo completo com molde para você criar uma peça linda e cheia de charme.</p>
<p>O feltro é um material maravilhoso para o artesanato: fácil de cortar, disponível em centenas de cores e muito versátil. Com um pouco de criatividade e os moldes certos, qualquer pessoa consegue fazer peças incríveis em casa. Veja como criar o seu ${kvs || kw} agora mesmo!</p>`
}

function getPecaSection(titulo: string, keyword: string, descricao: string): string {
  const kw = escapeHtml(keyword)
  return `<h2>Sobre a Peça: ${escapeHtml(titulo)}</h2>
<p>Esta é uma das criações mais encantadoras que você vai encontrar no Feltro Fácil. O <strong>${kw}</strong> é uma peça que une delicadeza e criatividade, perfeita para presentear em datas especiais ou para incrementar a decoração do ambiente.</p>${descricao && descricao.trim().length > 30 ? `\n<p>${escapeHtml(descricao.trim())}</p>` : ''}`
}

function getMoldeSection(keyword: string): string {
  const kw = escapeHtml(keyword)
  return `<h2>Molde para ${kw.charAt(0).toUpperCase() + kw.slice(1)}</h2>
<p>Confira abaixo os moldes para criar o seu <strong>${kw}</strong>. Para usar os moldes, imprima na escala 1:1 (sem redimensionar), transfira para o feltro com um lápis e corte com cuidado usando uma tesoura específica para tecido. Cada parte está numerada para facilitar a montagem.</p>`
}

function getMaterialsSection(execucao: string): string {
  const execText = execucao && execucao.trim()
    ? `<p><strong>Execução:</strong> ${escapeHtml(execucao.trim())}</p>`
    : ''
  return `<h2>Materiais Necessários</h2>
<p>Para fazer esta peça, você vai precisar dos materiais básicos de artesanato em feltro: folhas de feltro nas cores indicadas nos moldes, cola quente, tesoura, agulha e linha. Materiais adicionais podem variar de acordo com o projeto.</p>
${execText}
<p>Dica: sempre use feltro de boa qualidade para garantir que sua peça fique durável e com uma aparência mais profissional.</p>`
}

function getClosingSection(keyword: string, linksInternos: LinkInterno[], relatedUrl: string | null): string {
  const kw = escapeHtml(keyword)
  let closingLinks = ''

  if (linksInternos.length > 0) {
    const linksList = linksInternos
      .slice(0, 3)
      .map(l => `<li><a href="${escapeHtml(l.url)}">${escapeHtml(l.anchorText)}</a></li>`)
      .join('\n')
    closingLinks = `<p>Você também vai adorar estas criações do blog:</p>
<ul>
${linksList}
</ul>`
  }

  if (relatedUrl) {
    closingLinks += `\n<p>Gostou desta ideia? Não deixe de conferir também este post relacionado: <a href="${escapeHtml(relatedUrl)}">ver post relacionado</a>.</p>`
  }

  return `<h2>Gostou do ${kw.charAt(0).toUpperCase() + kw.slice(1)}?</h2>
<p>Esperamos que você tenha adorado este tutorial! O artesanato em feltro é uma atividade que une criatividade, relaxamento e a satisfação de criar algo com as próprias mãos. Se você fez a sua versão desta peça, adoraríamos ver o resultado — compartilhe nas redes sociais e marque o Feltro Fácil!</p>
${closingLinks}
<p>Continue navegando pelo blog para encontrar mais tutoriais, moldes e inspirações para o seu artesanato em feltro. Novos conteúdos são publicados regularmente para te ajudar a criar peças cada vez mais lindas. 🧵✂️</p>`
}

function getCreditsBlock(creditos: string, execucao: string): string {
  if (!creditos && !execucao) return ''
  const parts: string[] = []
  if (creditos) parts.push(`<strong>Créditos:</strong> ${escapeHtml(creditos)}`)
  if (execucao) parts.push(`<strong>Execução:</strong> ${escapeHtml(execucao)}`)
  return `<hr class="wp-block-separator" />
<p class="creditos-post">${parts.join(' | ')}</p>`
}

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

  const pieceImages = imagens
    .filter(img => img.tipo === 'peca')
    .sort((a, b) => a.ordem - b.ordem)

  const moldImages = imagens
    .filter(img => img.tipo === 'molde')
    .sort((a, b) => a.ordem - b.ordem)

  const relatedUrl = semArtigoRelacionado ? null : (linkArtigoRelacionado || null)

  const blocks: string[] = []

  // 1. Subtítulo criativo (H2 abre o post - o H1 é o título do WP)
  const subtitle = getCreativeSubtitle(titulo, keyword, tema)
  blocks.push(`<h2>${escapeHtml(subtitle)}</h2>`)

  // 2. Introdução
  blocks.push(getIntroText(descricao, keyword, keywordVariacao))

  // 3. Links internos "Veja também"
  if (linksInternos.length > 0) {
    blocks.push(buildInternalLinkBlock(linksInternos.slice(0, 2)))
  }

  // 4. Seção da peça
  blocks.push(getPecaSection(titulo, keyword, descricao))

  // 5. Imagens da peça
  if (pieceImages.length > 0) {
    blocks.push(`<div class="wp-block-gallery feltro-gallery-pecas">`)
    pieceImages.forEach(img => {
      blocks.push(buildImageTag(img))
    })
    blocks.push(`</div>`)
  }

  // 6. Seção dos moldes
  if (moldImages.length > 0) {
    blocks.push(getMoldeSection(keyword))
    moldImages.forEach(img => {
      blocks.push(buildImageTag(img))
    })
  }

  // 7. Materiais
  blocks.push(getMaterialsSection(execucao))

  // 8. Links externos (loja + Santa Fé)
  blocks.push(buildExternalLinksText(keyword))

  // 9. Fechamento e links internos finais
  const closingLinks = linksInternos.length > 2 ? linksInternos.slice(2) : []
  blocks.push(getClosingSection(keyword, closingLinks, relatedUrl))

  // 10. Créditos
  const creditsBlock = getCreditsBlock(creditos, execucao)
  if (creditsBlock) blocks.push(creditsBlock)

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
