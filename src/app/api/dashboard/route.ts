import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Fetch all posts for aggregation
  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select('id, status, categoria, criado_em, publicado_em, titulo, keyword, wp_post_url, wp_post_id, erro_publicacao')
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = posts || []

  // ── Status counts ────────────────────────────────────────────
  const byStatus = {
    total: all.length,
    publicado: all.filter(p => p.status === 'publicado').length,
    rascunho: all.filter(p => p.status === 'rascunho').length,
    publicando: all.filter(p => p.status === 'publicando').length,
    erro: all.filter(p => p.status === 'erro').length,
  }

  // ── By category (top 8) ──────────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const p of all) {
    const cat = p.categoria || 'Sem categoria'
    catMap[cat] = (catMap[cat] || 0) + 1
  }
  const byCategory = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // ── Activity last 30 days ────────────────────────────────────
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const dayMap: Record<string, number> = {}

  // Build all 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }

  for (const p of all) {
    const day = p.criado_em?.slice(0, 10)
    if (day && dayMap[day] !== undefined) dayMap[day]++
  }

  const activityTimeline = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // ── Recent posts (last 5) ────────────────────────────────────
  const recentPosts = all.slice(0, 5).map(p => ({
    id: p.id,
    titulo: p.titulo,
    keyword: p.keyword,
    status: p.status,
    categoria: p.categoria,
    wp_post_url: p.wp_post_url,
    criado_em: p.criado_em,
    publicado_em: p.publicado_em,
  }))

  // ── Error posts ───────────────────────────────────────────────
  const errorPosts = all
    .filter(p => p.status === 'erro')
    .slice(0, 3)
    .map(p => ({ id: p.id, titulo: p.titulo, erro_publicacao: p.erro_publicacao }))

  // ── Token configured ─────────────────────────────────────────
  const { data: tokenData } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'fb_access_token')
    .single()

  // ── This week vs last week ───────────────────────────────────
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6)
  const prevWeekStart = new Date(now); prevWeekStart.setDate(now.getDate() - 13)
  const thisWeek = all.filter(p => p.criado_em >= weekStart.toISOString()).length
  const lastWeek = all.filter(p =>
    p.criado_em >= prevWeekStart.toISOString() && p.criado_em < weekStart.toISOString()
  ).length

  return NextResponse.json({
    byStatus,
    byCategory,
    activityTimeline,
    recentPosts,
    errorPosts,
    tokenConfigured: !!tokenData?.value,
    thisWeek,
    lastWeek,
  })
}
