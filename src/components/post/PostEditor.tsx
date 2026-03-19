'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Loading'
import { slugify } from '@/lib/utils/slugify'
import {
  suggestKeyword,
  suggestSeoTitle,
  suggestSeoDescription,
  suggestAltText,
  suggestTags,
} from '@/lib/generator/article-generator'
import { analyzeSeo } from '@/lib/seo/analyzer'
import {
  CATEGORIAS,
  LINKS_EXTERNOS_PADRAO,
  type Post,
  type PublishStep,
} from '@/types'
import {
  PlusCircle, Trash2, ArrowUp, ArrowDown, Wand2,
  ImagePlus, Save, Eye, Send, CheckCircle, AlertCircle, Info,
  X, Link, ExternalLink, FileText,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

interface LocalImage {
  localId: string
  dbId?: string
  file?: File
  preview?: string
  tipo: 'peca' | 'molde'
  altText: string
  legenda: string
  uploading: boolean
  error?: string
}

interface LocalLink {
  localId: string
  url: string
  anchorText: string
}

let localIdCounter = 0
function newLocalId() { return `local-${++localIdCounter}` }

interface PostEditorProps {
  postId?: string
}

// ─── Component ────────────────────────────────────────────────

export function PostEditor({ postId: initialPostId }: PostEditorProps) {
  const router = useRouter()
  const [postId, setPostId] = useState<string | null>(initialPostId || null)
  const [loadingExisting, setLoadingExisting] = useState(!!initialPostId)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form fields
  const [tema, setTema] = useState('')
  const [titulo, setTitulo] = useState('')
  const [keyword, setKeyword] = useState('')
  const [keywordVariacao, setKeywordVariacao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [creditos, setCreditos] = useState('')
  const [execucao, setExecucao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [slug, setSlug] = useState('')
  const [seoTitulo, setSeoTitulo] = useState('')
  const [seoDescricao, setSeoDescricao] = useState('')
  const [linkRelacionado, setLinkRelacionado] = useState('')
  const [semRelacionado, setSemRelacionado] = useState(false)
  const [observacoes, setObservacoes] = useState('')

  // Featured image
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(null)
  const [featuredDbId, setFeaturedDbId] = useState<string | null>(null)
  const [featuredUploading, setFeaturedUploading] = useState(false)

  // Content images
  const [contentImages, setContentImages] = useState<LocalImage[]>([])

  // Links
  const [links, setLinks] = useState<LocalLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkAnchor, setNewLinkAnchor] = useState('')

  // AI generation
  const [generatingAI, setGeneratingAI] = useState(false)

  // Publish
  const [publishStep, setPublishStep] = useState<PublishStep>('idle')
  const [publishMessage, setPublishMessage] = useState('')
  const [generatingHtml, setGeneratingHtml] = useState(false)

  // ─── Load existing post ─────────────────────────────────────
  const loadPost = useCallback(async (id: string) => {
    setLoadingExisting(true)
    try {
      const res = await fetch(`/api/posts/${id}`)
      if (!res.ok) throw new Error('Post não encontrado.')
      const { data } = await res.json()

      setTema(data.tema || '')
      setTitulo(data.titulo || '')
      setKeyword(data.keyword || '')
      setKeywordVariacao(data.keywordVariacao || '')
      setDescricao(data.descricao || '')
      setCreditos(data.creditos || '')
      setExecucao(data.execucao || '')
      setCategoria(data.categoria || '')
      setTagsInput((data.tags || []).join(', '))
      setSlug(data.slug || '')
      setSeoTitulo(data.seoTitulo || '')
      setSeoDescricao(data.seoDescricao || '')
      setLinkRelacionado(data.linkArtigoRelacionado || '')
      setSemRelacionado(data.semArtigoRelacionado || false)
      setObservacoes(data.observacoesInternas || '')

      // Images
      const dbImages = (data.imagens || []) as Post['imagens']
      const featuredImg = dbImages.find(img => img.tipo === 'destaque')
      if (featuredImg) {
        setFeaturedPreview(featuredImg.urlSupabase)
        setFeaturedDbId(featuredImg.id)
      }

      const contentImgs = dbImages.filter(img => img.tipo !== 'destaque')
      setContentImages(contentImgs.map(img => ({
        localId: newLocalId(),
        dbId: img.id,
        preview: img.urlWp || img.urlSupabase,
        tipo: img.tipo as 'peca' | 'molde',
        altText: img.altText,
        legenda: img.legenda,
        uploading: false,
      })))

      // Links
      setLinks((data.linksInternos || []).map((l: Post['linksInternos'][0]) => ({
        localId: newLocalId(),
        url: l.url,
        anchorText: l.anchorText,
      })))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar post.')
    } finally {
      setLoadingExisting(false)
    }
  }, [])

  useEffect(() => {
    if (initialPostId) loadPost(initialPostId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostId])

  // ─── SEO analysis ───────────────────────────────────────────
  const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

  function buildPostForSeo(): Post {
    return {
      id: postId || '', tema, titulo, keyword, keywordVariacao, descricao,
      creditos, execucao, categoria, tags, slug, seoTitulo, seoDescricao,
      linkArtigoRelacionado: linkRelacionado || null,
      semArtigoRelacionado: semRelacionado,
      observacoesInternas: observacoes || null,
      htmlArtigo: null, status: 'rascunho',
      wpPostId: null, wpPostUrl: null, wpFeaturedMediaId: null,
      erroPublicacao: null, criadoEm: '', atualizadoEm: '', publicadoEm: null,
      imagens: [
        ...(featuredDbId ? [{
          id: featuredDbId, postId: postId || '', tipo: 'destaque' as const,
          ordem: 0, urlSupabase: featuredPreview || '', urlWp: null,
          wpMediaId: null, altText: titulo, legenda: '', nomeArquivo: '', criadoEm: '',
        }] : []),
        ...contentImages.filter(img => img.dbId).map((img, i) => ({
          id: img.dbId!, postId: postId || '', tipo: img.tipo, ordem: i,
          urlSupabase: img.preview || '', urlWp: null, wpMediaId: null,
          altText: img.altText, legenda: img.legenda, nomeArquivo: '',
          criadoEm: '',
        })),
      ],
      linksInternos: links.map((l, i) => ({
        id: l.localId, postId: postId || '', url: l.url,
        anchorText: l.anchorText, ordem: i,
      })),
    }
  }

  const seoReport = keyword ? analyzeSeo(buildPostForSeo()) : null

  // ─── Auto-save ───────────────────────────────────────────────
  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      if (!postId) return
      await saveFormData(postId, false)
    }, 3000)
  }

  useEffect(() => {
    if (postId && !loadingExisting) scheduleAutoSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, tema, keyword, keywordVariacao, descricao, creditos, execucao,
    categoria, tagsInput, slug, seoTitulo, seoDescricao, linkRelacionado,
    semRelacionado, observacoes, links, postId])

  async function ensurePostId(): Promise<string> {
    if (postId) return postId
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: titulo || 'Novo Post' }),
    })
    const json = await res.json()
    if (!res.ok || !json.data?.id) {
      throw new Error(json.error || 'Erro ao criar post. Verifique as variáveis de ambiente no Netlify.')
    }
    setPostId(json.data.id)
    return json.data.id
  }

  async function saveFormData(id: string, showToast = true) {
    setSaving(true)
    try {
      await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema, titulo, keyword, keywordVariacao, descricao,
          creditos, execucao, categoria,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
          slug, seoTitulo, seoDescricao,
          linkArtigoRelacionado: linkRelacionado || null,
          semArtigoRelacionado: semRelacionado,
          observacoesInternas: observacoes || null,
          linksInternos: links.map((l, i) => ({ url: l.url, anchorText: l.anchorText, ordem: i })),
        }),
      })
      setLastSaved(new Date())
      if (showToast) toast.success('Post salvo!')
    } catch {
      if (showToast) toast.error('Erro ao salvar post.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    const id = await ensurePostId()
    await saveFormData(id, true)
  }

  // ─── Featured image ──────────────────────────────────────────
  async function handleFeaturedChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const id = await ensurePostId()
    setFeaturedPreview(URL.createObjectURL(file))
    setFeaturedUploading(true)

    try {
      if (featuredDbId) {
        await fetch(`/api/upload?imagemId=${featuredDbId}`, { method: 'DELETE' })
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('postId', id)
      fd.append('tipo', 'destaque')
      fd.append('ordem', '0')
      fd.append('altText', titulo || tema || '')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setFeaturedDbId(data.imagemId)
      toast.success('Imagem destacada enviada!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no upload.')
      setFeaturedPreview(null)
    } finally {
      setFeaturedUploading(false)
    }
    e.target.value = ''
  }

  async function handleRemoveFeatured() {
    if (featuredDbId) {
      await fetch(`/api/upload?imagemId=${featuredDbId}`, { method: 'DELETE' })
      setFeaturedDbId(null)
    }
    setFeaturedPreview(null)
  }

  // ─── Content images ──────────────────────────────────────────
  async function handleContentImageAdd(tipo: 'peca' | 'molde', e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const id = await ensurePostId()

    for (const file of files) {
      const localId = newLocalId()
      const preview = URL.createObjectURL(file)
      const ordem = contentImages.length
      const suggested = suggestAltText(tema || titulo, tipo, contentImages.filter(i => i.tipo === tipo).length)

      setContentImages(prev => [...prev, { localId, file, preview, tipo, altText: suggested, legenda: '', uploading: true }])

      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('postId', id)
        fd.append('tipo', tipo)
        fd.append('ordem', String(ordem))
        fd.append('altText', suggested)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const { data, error } = await res.json()
        if (error) throw new Error(error)
        setContentImages(prev => prev.map(img =>
          img.localId === localId ? { ...img, dbId: data.imagemId, uploading: false } : img
        ))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro no upload.'
        setContentImages(prev => prev.map(img =>
          img.localId === localId ? { ...img, uploading: false, error: msg } : img
        ))
        toast.error(msg)
      }
    }
    e.target.value = ''
  }

  async function handleRemoveContentImage(localId: string) {
    const img = contentImages.find(i => i.localId === localId)
    if (img?.dbId) await fetch(`/api/upload?imagemId=${img.dbId}`, { method: 'DELETE' })
    if (img?.preview && img.file) URL.revokeObjectURL(img.preview)
    setContentImages(prev => prev.filter(i => i.localId !== localId))
  }

  async function handleUpdateImageMeta(localId: string, field: 'altText' | 'legenda', value: string) {
    setContentImages(prev => prev.map(img => img.localId === localId ? { ...img, [field]: value } : img))
    const img = contentImages.find(i => i.localId === localId)
    if (img?.dbId) {
      await fetch('/api/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagemId: img.dbId, [field === 'altText' ? 'altText' : 'legenda']: value }),
      })
    }
  }

  function moveImage(localId: string, dir: 'up' | 'down') {
    setContentImages(prev => {
      const idx = prev.findIndex(i => i.localId === localId)
      if (idx === -1) return prev
      const arr = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      if (swap < 0 || swap >= arr.length) return prev
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      arr.forEach((img, i) => {
        if (img.dbId) {
          fetch('/api/upload', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagemId: img.dbId, ordem: i }),
          })
        }
      })
      return arr
    })
  }

  // ─── Links ───────────────────────────────────────────────────
  function addLink() {
    if (!newLinkUrl.trim() || !newLinkAnchor.trim()) {
      toast.error('Preencha a URL e o texto do link.')
      return
    }
    setLinks(prev => [...prev, { localId: newLocalId(), url: newLinkUrl.trim(), anchorText: newLinkAnchor.trim() }])
    setNewLinkUrl('')
    setNewLinkAnchor('')
  }

  // ─── AI generation ───────────────────────────────────────────
  async function handleGenerateAI() {
    if (!tema.trim()) {
      toast.error('Preencha o campo "Tema do Título" para gerar com IA.')
      return
    }
    setGeneratingAI(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema, categoria }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      if (data.titulo) setTitulo(data.titulo)
      if (data.keyword) setKeyword(data.keyword)
      if (data.keywordVariacao) setKeywordVariacao(data.keywordVariacao)
      if (data.descricao) setDescricao(data.descricao)
      if (data.tags?.length) setTagsInput(data.tags.join(', '))
      if (data.seoTitulo) setSeoTitulo(data.seoTitulo)
      if (data.seoDescricao) setSeoDescricao(data.seoDescricao)
      toast.success('Conteúdo gerado com IA!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar com IA.')
    } finally {
      setGeneratingAI(false)
    }
  }

  // ─── Auto-suggestions ────────────────────────────────────────
  function handleAutoSlug() {
    setSlug(slugify(keyword || titulo))
  }

  function handleAutoKeyword() {
    if (tema) setKeyword(suggestKeyword(tema))
  }

  function handleAutoSeoTitle() {
    setSeoTitulo(suggestSeoTitle(titulo, keyword))
  }

  function handleAutoSeoDesc() {
    setSeoDescricao(suggestSeoDescription(descricao, keyword, titulo))
  }

  function handleAutoTags() {
    setTagsInput(suggestTags(tema || titulo, categoria).join(', '))
  }

  // ─── Generate article ────────────────────────────────────────
  async function handleGenerate() {
    if (!titulo || !keyword) {
      toast.error('Preencha o título e a palavra-chave.')
      return
    }
    const id = await ensurePostId()
    await saveFormData(id, false)
    setGeneratingHtml(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      if (data.suggestions?.slug) setSlug(data.suggestions.slug)
      if (data.suggestions?.seoTitulo) setSeoTitulo(data.suggestions.seoTitulo)
      if (data.suggestions?.seoDescricao) setSeoDescricao(data.suggestions.seoDescricao)
      toast.success('Artigo gerado! Veja o preview.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar artigo.')
    } finally {
      setGeneratingHtml(false)
    }
  }

  // ─── Publish ─────────────────────────────────────────────────
  async function handlePublish(publicar: boolean) {
    if (!titulo) { toast.error('Preencha o título.'); return }
    if (!keyword) { toast.error('Preencha a palavra-chave.'); return }
    const id = await ensurePostId()
    await saveFormData(id, false)

    setPublishStep('enviando-imagens')
    setPublishMessage(publicar ? 'Publicando no WordPress...' : 'Enviando rascunho...')

    try {
      const res = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, publicar }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setPublishStep('concluido')
      toast.success(publicar ? 'Post publicado no WordPress!' : 'Rascunho salvo no WordPress!')
      if (data.wpPostUrl) setTimeout(() => window.open(data.wpPostUrl, '_blank'), 800)
      router.push('/admin/historico')
    } catch (err) {
      setPublishStep('erro')
      toast.error(err instanceof Error ? err.message : 'Erro na publicação.')
    }
  }

  async function handlePreview() {
    if (!postId) { toast.error('Salve o post primeiro.'); return }
    window.open(`/admin/post/${postId}/preview`, '_blank')
  }

  const isPublishing = publishStep !== 'idle' && publishStep !== 'concluido' && publishStep !== 'erro'

  function seoColor(score: number) {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Carregando post...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {initialPostId ? 'Editar Post' : 'Novo Post'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {saving ? '● Salvando...' : lastSaved ? `✓ Salvo ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Não salvo ainda'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Salvar
          </Button>
          {postId && (
            <Button variant="secondary" size="sm" onClick={handlePreview}>
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 1: Post Data */}
      <Card className="mb-6">
        <CardHeader title="Dados do Post" icon={<Info className="w-4 h-4" />} />
        <div className="space-y-4">
          {/* AI Generate Banner */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
            <Wand2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-purple-800">Gerar com IA</p>
              <p className="text-xs text-purple-600">Preencha o Tema e clique para gerar título, keywords, descrição, tags e SEO automaticamente.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAI}
              loading={generatingAI}
              disabled={generatingAI || !tema.trim()}
              className="border-purple-300 text-purple-700 hover:bg-purple-100 flex-shrink-0"
            >
              <Wand2 className="w-4 h-4" />
              {generatingAI ? 'Gerando...' : 'Gerar com IA'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Tema do Título" placeholder="ex: Boneca Bailarina" value={tema} onChange={e => setTema(e.target.value)} hint="Tema geral da peça" />
            <div>
              <Input label="Palavra-chave Foco" placeholder="ex: boneca bailarina de feltro" value={keyword} onChange={e => setKeyword(e.target.value)} />
              {tema && !keyword && (
                <button type="button" onClick={handleAutoKeyword} className="mt-1 text-xs text-brand-600 hover:underline flex items-center gap-1">
                  <Wand2 className="w-3 h-3" /> Sugerir
                </button>
              )}
            </div>
          </div>
          <Input label="Título Principal do Post" placeholder="ex: Boneca Bailarina de Feltro – Molde Grátis e Passo a Passo" value={titulo} onChange={e => setTitulo(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Variação da Palavra-chave" placeholder="ex: bailarina de feltro" value={keywordVariacao} onChange={e => setKeywordVariacao(e.target.value)} />
            <Select label="Categoria" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Selecionar..." options={CATEGORIAS.map(c => ({ value: c, label: c }))} />
          </div>
          <Textarea label="Descrição Base" placeholder="Descreva a peça, seu contexto e o que a torna especial..." value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} counter maxChars={500} hint="Usada na introdução do artigo" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Créditos" placeholder="ex: Créditos: @artesanato_manu" value={creditos} onChange={e => setCreditos(e.target.value)} />
            <Input label="Execução (opcional)" placeholder="ex: @artesanato_manu" value={execucao} onChange={e => setExecucao(e.target.value)} />
          </div>
          <div>
            <Input label="Tags (separadas por vírgula)" placeholder="ex: boneca de feltro, feltro, artesanato" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            {(tema || categoria) && (
              <button type="button" onClick={handleAutoTags} className="mt-1 text-xs text-brand-600 hover:underline flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Sugerir tags
              </button>
            )}
            {tagsInput && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 2: Featured Image */}
      <Card className="mb-6">
        <CardHeader title="Imagem Destacada" description="Foto principal que aparece no topo do post" icon={<ImagePlus className="w-4 h-4" />} />
        {!featuredPreview ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-brand-400 hover:bg-brand-50 transition-colors">
              {featuredUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Spinner />
                  <p className="text-sm text-gray-500">Enviando...</p>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Clique para selecionar a imagem de capa</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP — máx. 10MB</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFeaturedChange} disabled={featuredUploading} />
          </label>
        ) : (
          <div className="relative">
            <img src={featuredPreview} alt="Imagem destacada" className="w-full max-h-64 object-cover rounded-xl" />
            <Button variant="danger" size="sm" className="absolute top-2 right-2" onClick={handleRemoveFeatured}>
              <X className="w-4 h-4" /> Remover
            </Button>
          </div>
        )}
      </Card>

      {/* SECTION 3: Content Images */}
      <Card className="mb-6">
        <CardHeader
          title="Imagens do Conteúdo"
          description={`${contentImages.length} imagem(ns) — na ordem exata em que aparecerão no post`}
          icon={<ImagePlus className="w-4 h-4" />}
        />
        {contentImages.length > 0 && (
          <div className="space-y-3 mb-4">
            {contentImages.map((img, i) => (
              <div key={img.localId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col gap-1 pt-2">
                  <button type="button" onClick={() => moveImage(img.localId, 'up')} disabled={i === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => moveImage(img.localId, 'down')} disabled={i === contentImages.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="relative w-20 h-20 flex-shrink-0">
                  {img.preview && <img src={img.preview} alt="" className="w-20 h-20 object-cover rounded-lg" />}
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <Spinner size="sm" className="text-white" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-500/40 rounded-lg flex items-center justify-center" title={img.error}>
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <Badge variant={img.tipo === 'peca' ? 'info' : 'warning'} size="sm">
                      {img.tipo === 'peca' ? 'Peça' : 'Molde'}
                    </Badge>
                    <span className="text-xs text-gray-400">#{i + 1}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Alt text"
                    value={img.altText}
                    onChange={e => handleUpdateImageMeta(img.localId, 'altText', e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                  <input
                    type="text"
                    placeholder="Legenda (opcional)"
                    value={img.legenda}
                    onChange={e => handleUpdateImageMeta(img.localId, 'legenda', e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  />
                </div>
                <button type="button" onClick={() => handleRemoveContentImage(img.localId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-brand-300 hover:border-brand-500 hover:bg-brand-50 transition-colors text-sm text-brand-600 font-medium">
              <ImagePlus className="w-4 h-4" /> + Foto da Peça
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleContentImageAdd('peca', e)} />
          </label>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50 transition-colors text-sm text-amber-600 font-medium">
              <ImagePlus className="w-4 h-4" /> + Foto do Molde
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleContentImageAdd('molde', e)} />
          </label>
        </div>
      </Card>

      {/* SECTION 4: Links */}
      <Card className="mb-6">
        <CardHeader title="Links Internos" description="Links para outros posts do blog feltrofacil.com.br" icon={<Link className="w-4 h-4" />} />
        <div className="space-y-2 mb-4">
          {links.map(link => (
            <div key={link.localId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{link.anchorText}</p>
                <p className="text-xs text-brand-600 truncate">{link.url}</p>
              </div>
              <button type="button" onClick={() => setLinks(prev => prev.filter(l => l.localId !== link.localId))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input type="url" placeholder="URL do post interno" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="sm:col-span-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <input type="text" placeholder="Texto do link" value={newLinkAnchor} onChange={e => setNewLinkAnchor(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLink()} className="sm:col-span-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <Button variant="outline" onClick={addLink}>
            <PlusCircle className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        {/* Fixed external links */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Links externos automáticos:
          </p>
          <div className="flex flex-wrap gap-2">
            {LINKS_EXTERNOS_PADRAO.map(l => (
              <span key={l.url} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{l.nome}</span>
            ))}
          </div>
        </div>

        {/* Related article */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="checkbox" checked={semRelacionado} onChange={e => setSemRelacionado(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Este post não possui artigo relacionado</span>
          </label>
          {!semRelacionado && (
            <Input placeholder="URL do artigo relacionado (opcional)" value={linkRelacionado} onChange={e => setLinkRelacionado(e.target.value)} type="url" />
          )}
        </div>
      </Card>

      {/* SECTION 5: SEO */}
      <Card className="mb-6">
        <CardHeader
          title="SEO"
          description="Otimização para mecanismos de busca"
          icon={<FileText className="w-4 h-4" />}
          action={seoReport ? (
            <div className={`text-2xl font-bold ${seoColor(seoReport.score)}`}>{seoReport.score}%</div>
          ) : undefined}
        />
        <div className="space-y-4">
          <div>
            <Input label="Slug (URL amigável)" placeholder="ex: boneca-bailarina-de-feltro" value={slug} onChange={e => setSlug(e.target.value)} hint="feltrofacil.com.br/[slug]" />
            <button type="button" onClick={handleAutoSlug} className="mt-1 text-xs text-brand-600 hover:underline flex items-center gap-1">
              <Wand2 className="w-3 h-3" /> Gerar da keyword
            </button>
          </div>
          <div>
            <Textarea label="Meta Título SEO" placeholder="ex: Boneca Bailarina de Feltro – Molde Grátis | Feltro Fácil" value={seoTitulo} onChange={e => setSeoTitulo(e.target.value)} rows={2} counter maxChars={60} hint="Ideal: 50–60 caracteres" />
            {titulo && keyword && !seoTitulo && (
              <button type="button" onClick={handleAutoSeoTitle} className="mt-1 text-xs text-brand-600 hover:underline flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Sugerir
              </button>
            )}
          </div>
          <div>
            <Textarea label="Meta Descrição" placeholder="ex: Aprenda a fazer uma boneca bailarina de feltro com molde grátis e passo a passo completo..." value={seoDescricao} onChange={e => setSeoDescricao(e.target.value)} rows={3} counter maxChars={160} hint="Ideal: 120–160 caracteres" />
            {keyword && !seoDescricao && (
              <button type="button" onClick={handleAutoSeoDesc} className="mt-1 text-xs text-brand-600 hover:underline flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Sugerir
              </button>
            )}
          </div>
          <Textarea label="Observações Internas (não publicadas)" placeholder="Anotações sobre este post..." value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
        </div>

        {/* SEO Checklist */}
        {seoReport && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Análise SEO</p>
            <div className="space-y-1.5">
              {seoReport.checks.map(check => (
                <div key={check.id} className="flex items-start gap-2">
                  {check.status === 'ok' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                  {check.status === 'aviso' && <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />}
                  {check.status === 'erro' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  <p className="text-xs text-gray-600">{check.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* FIXED ACTION BAR */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleGenerate} loading={generatingHtml} disabled={isPublishing}>
              <Wand2 className="w-4 h-4" />
              Gerar Artigo
            </Button>
            {postId && (
              <Button variant="outline" onClick={handlePreview} disabled={isPublishing}>
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPublishing && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Spinner size="sm" />
                <span>{publishMessage}</span>
              </div>
            )}
            <Button variant="outline" onClick={() => handlePublish(false)} loading={isPublishing} disabled={isPublishing}>
              <Save className="w-4 h-4" />
              Salvar no WP
            </Button>
            <Button onClick={() => handlePublish(true)} loading={isPublishing} disabled={isPublishing}>
              <Send className="w-4 h-4" />
              Publicar no WordPress
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
