'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { analyzeSeo } from '@/lib/seo/analyzer'
import { generateArticleHtml } from '@/lib/generator/article-generator'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import type { Post, SeoReport } from '@/types'
import {
  ArrowLeft, Copy, CheckCircle, AlertCircle, ExternalLink,
  Eye, Link as LinkIcon, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PreviewPage() {
  const { id } = useParams() as { id: string }
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [articleHtml, setArticleHtml] = useState('')
  const [seoReport, setSeoReport] = useState<SeoReport | null>(null)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'preview' | 'html' | 'seo'>('preview')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${id}`)
      if (!res.ok) throw new Error('Post não encontrado')
      const { data } = await res.json()
      setPost(data)

      // Generate article (use stored html or generate fresh)
      const html = data.htmlArtigo || generateArticleHtml(data)
      setArticleHtml(html)

      // SEO report
      setSeoReport(analyzeSeo(data))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar preview.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  function handleCopyHtml() {
    navigator.clipboard.writeText(articleHtml)
    setCopied(true)
    toast.success('HTML copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  function seoColor(score: number) {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  function seoBadge(score: number): 'success' | 'warning' | 'error' {
    if (score >= 70) return 'success'
    if (score >= 40) return 'warning'
    return 'error'
  }

  if (loading) return <PageLoading message="Carregando preview..." />
  if (!post) return <div className="p-8 text-center text-gray-500">Post não encontrado.</div>

  const internalLinks = post.linksInternos || []
  const contentImages = post.imagens.filter(img => img.tipo !== 'destaque')
  const featuredImage = post.imagens.find(img => img.tipo === 'destaque')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/admin/post/${id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Editar
              </Button>
            </Link>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate max-w-md">{post.titulo}</p>
              <p className="text-xs text-gray-400">{post.keyword || 'Sem palavra-chave'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {seoReport && (
              <div className={`text-sm font-bold px-3 py-1 rounded-full border ${seoColor(seoReport.score)}`}>
                SEO: {seoReport.score}%
              </div>
            )}
            {post.wpPostUrl && (
              <a href={post.wpPostUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4" />
                  Ver no WP
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" onClick={handleCopyHtml}>
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar HTML'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto flex gap-1 mt-2">
          {(['preview', 'html', 'seo'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                tab === t ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t === 'preview' && <><Eye className="w-3.5 h-3.5 inline mr-1.5" />Preview</>}
              {t === 'html' && <><Copy className="w-3.5 h-3.5 inline mr-1.5" />HTML</>}
              {t === 'seo' && <><Search className="w-3.5 h-3.5 inline mr-1.5" />SEO</>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ─── TAB: PREVIEW ─────────────────────────────────── */}
        {tab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Article preview */}
            <div className="lg:col-span-2">
              <Card>
                {/* Featured image */}
                {featuredImage && (
                  <div className="mb-6 -mx-6 -mt-6 rounded-t-xl overflow-hidden">
                    <img src={featuredImage.urlWp || featuredImage.urlSupabase} alt={featuredImage.altText} className="w-full max-h-72 object-cover" />
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.titulo}</h1>
                {post.keyword && (
                  <p className="text-xs text-brand-600 mb-6 font-medium">🔑 {post.keyword}</p>
                )}

                {/* Article HTML */}
                <div
                  className="article-preview"
                  dangerouslySetInnerHTML={{ __html: articleHtml }}
                />
              </Card>
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              {/* Meta info */}
              <Card padding="sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Meta SEO</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">URL</p>
                    <p className="text-sm text-gray-700 font-medium">/{post.slug || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Meta título ({post.seoTitulo.length} chars)</p>
                    <p className="text-sm text-gray-700">{post.seoTitulo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Meta descrição ({post.seoDescricao.length} chars)</p>
                    <p className="text-sm text-gray-700">{post.seoDescricao || '—'}</p>
                  </div>
                </div>
              </Card>

              {/* Images */}
              <Card padding="sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Imagens ({contentImages.length})
                </p>
                <div className="space-y-2">
                  {contentImages.map((img, i) => (
                    <div key={img.id} className="flex items-center gap-2">
                      <img src={img.urlWp || img.urlSupabase} alt="" className="w-10 h-10 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={img.tipo === 'peca' ? 'info' : 'warning'} size="sm">
                            {img.tipo === 'peca' ? 'Peça' : 'Molde'}
                          </Badge>
                          <span className="text-xs text-gray-400">#{i + 1}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{img.altText || 'Sem alt text'}</p>
                      </div>
                    </div>
                  ))}
                  {contentImages.length === 0 && <p className="text-xs text-gray-400">Nenhuma imagem de conteúdo.</p>}
                </div>
              </Card>

              {/* Internal links */}
              <Card padding="sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Links Internos ({internalLinks.length})
                </p>
                <div className="space-y-1">
                  {internalLinks.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{link.anchorText}</span>
                    </a>
                  ))}
                  {internalLinks.length === 0 && <p className="text-xs text-gray-400">Nenhum link interno.</p>}
                </div>
              </Card>

              {/* Category & tags */}
              <Card padding="sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Taxonomia</p>
                {post.categoria && <Badge variant="info" className="mb-2">{post.categoria}</Badge>}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(post.tags || []).map(tag => <Badge key={tag} variant="outline" size="sm">{tag}</Badge>)}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ─── TAB: HTML ────────────────────────────────────── */}
        {tab === 'html' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">HTML gerado (compatível com WordPress)</p>
              <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                <Copy className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Copiar tudo'}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto leading-relaxed max-h-[600px] overflow-y-auto">
              {articleHtml}
            </pre>
          </Card>
        )}

        {/* ─── TAB: SEO ─────────────────────────────────────── */}
        {tab === 'seo' && seoReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score */}
            <div>
              <Card className="text-center">
                <div className={`text-5xl font-bold mb-2 ${
                  seoReport.score >= 70 ? 'text-green-600' :
                  seoReport.score >= 40 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {seoReport.score}%
                </div>
                <p className="text-sm text-gray-600 mb-2">Score SEO On-Page</p>
                <Badge variant={seoBadge(seoReport.score)}>
                  {seoReport.score >= 70 ? 'Bom' : seoReport.score >= 40 ? 'Melhorar' : 'Fraco'}
                </Badge>
                <p className="text-xs text-gray-400 mt-4">Palavra-chave: <strong>{seoReport.keyword}</strong></p>
              </Card>
            </div>

            {/* Checklist */}
            <div className="lg:col-span-2">
              <Card>
                <p className="text-sm font-semibold text-gray-700 mb-4">Análise Detalhada</p>
                <div className="space-y-2">
                  {seoReport.checks.map(check => (
                    <div key={check.id} className={`flex items-start gap-3 p-3 rounded-lg ${
                      check.status === 'ok' ? 'bg-green-50' :
                      check.status === 'aviso' ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                      {check.status === 'ok' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                      {check.status === 'aviso' && <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />}
                      {check.status === 'erro' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-xs font-medium text-gray-700">{check.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{check.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
