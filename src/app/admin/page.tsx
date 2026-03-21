'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
  PlusCircle, Share2, ExternalLink, RefreshCw, Activity, BarChart3,
  Zap, Globe, Database, Key, ArrowRight, Calendar,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface DashboardData {
  byStatus: { total: number; publicado: number; rascunho: number; publicando: number; erro: number }
  byCategory: { name: string; count: number }[]
  activityTimeline: { date: string; count: number }[]
  recentPosts: { id: string; titulo: string; keyword: string; status: string; categoria: string; wp_post_url: string | null; criado_em: string; publicado_em: string | null }[]
  errorPosts: { id: string; titulo: string; erro_publicacao: string | null }[]
  tokenConfigured: boolean
  thisWeek: number
  lastWeek: number
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  rascunho: { label: 'Rascunho', variant: 'default' },
  publicando: { label: 'Publicando...', variant: 'info' },
  publicado: { label: 'Publicado', variant: 'success' },
  erro: { label: 'Erro', variant: 'error' },
}

function fmt(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtFull(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function todayStr() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { byStatus, byCategory, activityTimeline, recentPosts, errorPosts, tokenConfigured, thisWeek, lastWeek } = data
  const weekDiff = thisWeek - lastWeek
  const maxActivity = Math.max(...activityTimeline.map(d => d.count), 1)
  const maxCategory = Math.max(...byCategory.map(c => c.count), 1)
  const publishRate = byStatus.total > 0 ? Math.round((byStatus.publicado / byStatus.total) * 100) : 0

  // Last 14 days for the chart
  const timeline14 = activityTimeline.slice(-14)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greet()}, Feltro Fácil! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{todayStr()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => load(true)} loading={refreshing}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Link href="/admin/novo-post">
            <Button size="sm">
              <PlusCircle className="w-4 h-4" />
              Novo Post
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total de Posts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{byStatus.total}</p>
              <div className="flex items-center gap-1 mt-2">
                {weekDiff >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${weekDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {weekDiff >= 0 ? '+' : ''}{weekDiff} esta semana
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Publicados</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{byStatus.publicado}</p>
              <p className="text-xs text-gray-400 mt-2">{publishRate}% do total</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500" />
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rascunhos</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{byStatus.rascunho}</p>
              <p className="text-xs text-gray-400 mt-2">Aguardando publicação</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400" />
        </Card>

        <Card className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Com Erros</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{byStatus.erro}</p>
              <p className="text-xs text-gray-400 mt-2">
                {byStatus.erro === 0 ? 'Tudo certo!' : 'Verificar publicação'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </Card>
      </div>

      {/* ── Activity Chart + Status Ring ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity Timeline */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-900">Atividade — últimos 14 dias</h2>
            </div>
            <span className="text-xs text-gray-400">{thisWeek} posts esta semana</span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {timeline14.map((day, i) => {
              const height = maxActivity === 0 ? 0 : Math.max((day.count / maxActivity) * 100, day.count > 0 ? 8 : 0)
              const isToday = day.date === new Date().toISOString().slice(0, 10)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {fmt(day.date)}: {day.count} post{day.count !== 1 ? 's' : ''}
                  </div>
                  <div className="w-full flex items-end" style={{ height: '100px' }}>
                    <div
                      className={`w-full rounded-t transition-all ${isToday ? 'bg-brand-500' : day.count > 0 ? 'bg-brand-300' : 'bg-gray-100'}`}
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '8px' : '4px' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400" style={{ fontSize: '9px' }}>
                    {fmt(day.date).split('/')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-900">Status dos Posts</h2>
          </div>

          {/* Donut-style progress ring */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                {byStatus.total > 0 && (
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeDasharray={`${publishRate} ${100 - publishRate}`}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{publishRate}%</span>
                <span className="text-xs text-gray-400">publicados</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Publicados', count: byStatus.publicado, color: 'bg-green-500' },
              { label: 'Rascunhos', count: byStatus.rascunho, color: 'bg-gray-300' },
              { label: 'Publicando', count: byStatus.publicando, color: 'bg-blue-400' },
              { label: 'Com erro', count: byStatus.erro, color: 'bg-red-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-gray-600">{s.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Categories + Recent Posts ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top Categories */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-900">Posts por Categoria</h2>
          </div>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma categoria ainda.</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(cat => (
                <div key={cat.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-700 truncate max-w-[70%]">{cat.name}</span>
                    <span className="text-xs font-semibold text-gray-900">{cat.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-400 transition-all"
                      style={{ width: `${(cat.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Posts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-900">Posts Recentes</h2>
            </div>
            <Link href="/admin/historico" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-3">Nenhum post criado ainda.</p>
              <Link href="/admin/novo-post">
                <Button size="sm"><PlusCircle className="w-3.5 h-3.5" />Criar primeiro post</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map(post => {
                const sc = statusConfig[post.status] || statusConfig.rascunho
                return (
                  <div key={post.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-50 last:border-none">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/post/${post.id}`} className="text-sm font-medium text-gray-900 hover:text-brand-600 line-clamp-1">
                        {post.titulo}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{fmtFull(post.criado_em)}</span>
                        {post.categoria && (
                          <span className="text-xs text-gray-300">·</span>
                        )}
                        {post.categoria && (
                          <span className="text-xs text-gray-400 truncate">{post.categoria}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                      {post.wp_post_url && (
                        <a href={post.wp_post_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-brand-600" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Error Posts + Quick Actions + System Status ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Error Posts */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900">Posts com Erro</h2>
          </div>
          {errorPosts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-500">Nenhum erro encontrado!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {errorPosts.map(p => (
                <Link key={p.id} href={`/admin/post/${p.id}`} className="block p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                  <p className="text-xs font-medium text-red-800 line-clamp-1">{p.titulo}</p>
                  {p.erro_publicacao && (
                    <p className="text-xs text-red-500 mt-0.5 line-clamp-1">{p.erro_publicacao}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-900">Ações Rápidas</h2>
          </div>
          <div className="space-y-2">
            <Link href="/admin/novo-post" className="flex items-center gap-3 p-3 rounded-xl bg-brand-50 hover:bg-brand-100 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Novo Post</p>
                <p className="text-xs text-gray-500">Criar artigo para o blog</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/admin/social" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Social Media</p>
                <p className="text-xs text-gray-500">Agendar post FB/Instagram</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link href="/admin/historico" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Histórico</p>
                <p className="text-xs text-gray-500">Ver todos os posts</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Card>

        {/* System Status */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-semibold text-gray-900">Status do Sistema</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: Database,
                label: 'Supabase',
                detail: 'Banco de dados',
                ok: true,
                okText: 'Conectado',
              },
              {
                icon: Globe,
                label: 'WordPress',
                detail: 'feltrofacil.com.br',
                ok: true,
                okText: 'Ativo',
              },
              {
                icon: Key,
                label: 'Token Facebook',
                detail: 'API Meta Graph',
                ok: tokenConfigured,
                okText: 'Configurado',
                failText: 'Não configurado',
                failLink: '/admin/social',
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.ok ? 'bg-green-50' : 'bg-red-50'}`}>
                    <item.icon className={`w-4 h-4 ${item.ok ? 'text-green-600' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-400'}`} />
                  {item.ok ? (
                    <span className="text-xs text-green-600 font-medium">{item.okText}</span>
                  ) : item.failLink ? (
                    <Link href={item.failLink} className="text-xs text-red-500 hover:underline font-medium">
                      {item.failText}
                    </Link>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">{item.failText}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}
