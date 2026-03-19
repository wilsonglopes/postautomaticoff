'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format-date'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/Loading'
import type { PostStatus } from '@/types'
import {
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PostRow {
  id: string
  titulo: string
  keyword: string
  categoria: string
  status: PostStatus
  wp_post_url: string | null
  wp_post_id: number | null
  criado_em: string
  publicado_em: string | null
}

const statusConfig: Record<PostStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  rascunho: { label: 'Rascunho', variant: 'default' },
  publicando: { label: 'Publicando...', variant: 'info' },
  publicado: { label: 'Publicado', variant: 'success' },
  erro: { label: 'Erro', variant: 'error' },
}

export default function HistoricoPage() {
  const [posts, setPosts] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/posts?limit=100')
      const json = await res.json()
      setPosts(json.data || [])
    } catch {
      toast.error('Erro ao carregar posts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = posts.filter(p =>
    !search ||
    p.titulo.toLowerCase().includes(search.toLowerCase()) ||
    p.keyword.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string, titulo: string) {
    if (!confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir.')
      setPosts(prev => prev.filter(p => p.id !== id))
      toast.success('Post excluído.')
    } catch {
      toast.error('Erro ao excluir post.')
    } finally {
      setDeleting(null)
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/posts/${id}`)
      const { data } = await res.json()
      const createRes = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          titulo: `${data.titulo} (cópia)`,
          status: 'rascunho',
          wpPostId: null,
          wpPostUrl: null,
        }),
      })
      const { data: newPost } = await createRes.json()
      toast.success('Post duplicado!')
      window.location.href = `/admin/post/${newPost.id}`
    } catch {
      toast.error('Erro ao duplicar post.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Posts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Link href="/admin/novo-post">
            <Button>
              <PlusCircle className="w-4 h-4" />
              Novo Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título ou palavra-chave..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <PageLoading message="Carregando posts..." />
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                {search ? 'Nenhum post encontrado.' : 'Nenhum post criado ainda.'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Tente outra busca.' : 'Crie seu primeiro post para começar.'}
              </p>
            </div>
            {!search && (
              <Link href="/admin/novo-post">
                <Button>
                  <PlusCircle className="w-4 h-4" />
                  Criar Primeiro Post
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Título</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Palavra-chave</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Categoria</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Data</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, i) => {
                  const sc = statusConfig[post.status] || statusConfig.rascunho
                  return (
                    <tr
                      key={post.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-none' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.titulo}</p>
                          {post.wp_post_id && (
                            <p className="text-xs text-gray-400 mt-0.5">WP ID: {post.wp_post_id}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{post.keyword || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{post.categoria || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">
                          {post.publicado_em
                            ? formatDate(post.publicado_em)
                            : formatDate(post.criado_em)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {post.wp_post_url && (
                            <a
                              href={post.wp_post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver no WordPress"
                            >
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <Link href={`/admin/post/${post.id}/preview`} title="Pré-visualizar">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/post/${post.id}`} title="Editar">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Duplicar"
                            onClick={() => handleDuplicate(post.id)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Excluir"
                            onClick={() => handleDelete(post.id, post.titulo)}
                            loading={deleting === post.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
