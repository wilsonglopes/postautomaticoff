// ─── Status ──────────────────────────────────────────────────
export type PostStatus = 'rascunho' | 'publicando' | 'publicado' | 'erro'

export type ImageType = 'peca' | 'molde' | 'destaque'

// ─── Imagem de conteúdo ───────────────────────────────────────
export interface PostImagem {
  id: string
  postId: string
  tipo: ImageType
  ordem: number
  urlSupabase: string
  urlWp: string | null
  wpMediaId: number | null
  altText: string
  legenda: string
  nomeArquivo: string
  criadoEm: string
}

// ─── Link interno ─────────────────────────────────────────────
export interface LinkInterno {
  id: string
  postId: string
  url: string
  anchorText: string
  ordem: number
}

// ─── Post ─────────────────────────────────────────────────────
export interface Post {
  id: string
  tema: string
  titulo: string
  keyword: string
  keywordVariacao: string
  descricao: string
  creditos: string
  execucao: string
  categoria: string
  tags: string[]
  slug: string
  seoTitulo: string
  seoDescricao: string
  linkArtigoRelacionado: string | null
  semArtigoRelacionado: boolean
  observacoesInternas: string | null
  htmlArtigo: string | null
  status: PostStatus
  wpPostId: number | null
  wpPostUrl: string | null
  wpFeaturedMediaId: number | null
  erroPublicacao: string | null
  criadoEm: string
  atualizadoEm: string
  publicadoEm: string | null
  // Relations
  imagens: PostImagem[]
  linksInternos: LinkInterno[]
}

// ─── Form state ───────────────────────────────────────────────
export interface PostFormData {
  tema: string
  titulo: string
  keyword: string
  keywordVariacao: string
  descricao: string
  creditos: string
  execucao: string
  categoria: string
  tags: string
  slug: string
  seoTitulo: string
  seoDescricao: string
  linkArtigoRelacionado: string
  semArtigoRelacionado: boolean
  observacoesInternas: string
}

// ─── Upload ───────────────────────────────────────────────────
export interface UploadResult {
  imagemId: string
  urlPublica: string
  storagePath: string
}

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pendente' | 'enviando' | 'concluido' | 'erro'
  error?: string
}

// ─── SEO ─────────────────────────────────────────────────────
export type SeoCheckStatus = 'ok' | 'aviso' | 'erro'

export interface SeoCheck {
  id: string
  label: string
  status: SeoCheckStatus
  message: string
}

export interface SeoReport {
  score: number
  checks: SeoCheck[]
  keyword: string
}

// ─── WordPress API ────────────────────────────────────────────
export interface WpMediaResponse {
  id: number
  source_url: string
  alt_text: string
  media_details: {
    width: number
    height: number
  }
}

export interface WpPostResponse {
  id: number
  link: string
  slug: string
  status: string
}

export interface WpCategory {
  id: number
  name: string
  slug: string
}

export interface WpTag {
  id: number
  name: string
  slug: string
}

// ─── API responses ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ─── Publish progress ─────────────────────────────────────────
export type PublishStep =
  | 'idle'
  | 'enviando-imagens'
  | 'gerando-html'
  | 'criando-post-wp'
  | 'concluido'
  | 'erro'

export interface PublishProgress {
  step: PublishStep
  message: string
  detail?: string
}

// ─── Categorias predefinidas ──────────────────────────────────
export const CATEGORIAS = [
  'Bonecas de Feltro',
  'Animais de Feltro',
  'Personagens de Feltro',
  'Decoração em Feltro',
  'Móbiles de Feltro',
  'Porta-retratos de Feltro',
  'Chaveiros de Feltro',
  'Temas Infantis',
  'Datas Comemorativas',
  'Natal em Feltro',
  'Páscoa em Feltro',
  'Dia das Mães',
  'Dia dos Pais',
  'Halloween em Feltro',
  'Moldes de Feltro',
  'Artesanato em Feltro',
  'Feltro para Iniciantes',
] as const

export const LINKS_EXTERNOS_PADRAO = [
  {
    url: 'https://loja.feltrofacil.com.br',
    nome: 'Loja Feltro Fácil',
    descricao: 'Loja oficial do Feltro Fácil',
  },
  {
    url: 'https://www.feltrossantafe.net/',
    nome: 'Feltros Santa Fé',
    descricao: 'Fornecedora de feltros de qualidade',
  },
] as const
