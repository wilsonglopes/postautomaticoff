import { wpFetch } from './client'
import type { WpPostResponse, WpCategory, WpTag } from '@/types'

export interface CreateWpPostPayload {
  title: string
  content: string
  slug: string
  status: 'publish' | 'draft'
  featured_media?: number
  meta?: {
    _yoast_wpseo_title?: string
    _yoast_wpseo_metadesc?: string
    _yoast_wpseo_focuskw?: string
    rank_math_title?: string
    rank_math_description?: string
    rank_math_focus_keyword?: string
  }
  categories?: number[]
  tags?: number[]
}

export async function createWpPost(payload: CreateWpPostPayload): Promise<WpPostResponse> {
  return wpFetch<WpPostResponse>('posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateWpPost(
  wpPostId: number,
  payload: Partial<CreateWpPostPayload>
): Promise<WpPostResponse> {
  return wpFetch<WpPostResponse>(`posts/${wpPostId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function findOrCreateCategory(name: string): Promise<number> {
  const encoded = encodeURIComponent(name)
  const categories = await wpFetch<WpCategory[]>(`categories?search=${encoded}&per_page=5`)
  const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase())
  if (existing) return existing.id

  const created = await wpFetch<WpCategory>('categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return created.id
}

export async function findOrCreateTag(name: string): Promise<number> {
  const encoded = encodeURIComponent(name)
  const tags = await wpFetch<WpTag[]>(`tags?search=${encoded}&per_page=5`)
  const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (existing) return existing.id

  const created = await wpFetch<WpTag>('tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return created.id
}
