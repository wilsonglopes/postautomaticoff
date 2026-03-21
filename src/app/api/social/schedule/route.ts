import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const FB_API = 'https://graph.facebook.com/v25.0'
const PAGE_ID = process.env.FB_PAGE_ID || '853130718066857'
const IG_ID = process.env.IG_ACCOUNT_ID || '17841404758984548'

async function getToken(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'fb_access_token')
    .single()
  if (!data?.value) throw new Error('Token do Facebook não configurado. Acesse Configurações > Token.')
  return data.value
}

// Faz upload de uma imagem para o Facebook e retorna { photoId, imageUrl }
async function uploadPhoto(file: File, token: string): Promise<{ photoId: string; imageUrl: string }> {
  const form = new FormData()
  form.append('source', file, file.name)
  form.append('published', 'false')
  form.append('temporary', 'true')
  form.append('access_token', token)

  const res = await fetch(`${FB_API}/${PAGE_ID}/photos`, { method: 'POST', body: form })
  const data = await res.json()
  if (data.error) throw new Error(`Upload Facebook: ${data.error.message}`)

  const photoId: string = data.id

  // Obter URL pública (necessária para o Instagram)
  const infoRes = await fetch(`${FB_API}/${photoId}?fields=images&access_token=${token}`)
  const info = await infoRes.json()
  const imageUrl: string = info.images?.[0]?.source ?? ''

  return { photoId, imageUrl }
}

// Aguarda container do Instagram ficar FINISHED (máx 25s)
async function waitContainer(containerId: string, token: string): Promise<void> {
  const deadline = Date.now() + 25_000
  while (Date.now() < deadline) {
    const res = await fetch(`${FB_API}/${containerId}?fields=status_code,status&access_token=${token}`)
    const data = await res.json()
    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') throw new Error(`Container Instagram com erro: ${data.status}`)
    await new Promise(r => setTimeout(r, 2500))
  }
  throw new Error('Timeout aguardando processamento da imagem no Instagram.')
}

export async function POST(request: NextRequest) {
  let token: string
  try {
    token = await getToken()
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const formData = await request.formData()
  const files = formData.getAll('images') as File[]
  const description = (formData.get('description') as string) || ''
  const scheduledTime = (formData.get('scheduledTime') as string) || ''
  const doFacebook = formData.get('facebook') === 'true'
  const doInstagram = formData.get('instagram') === 'true'

  if (!files.length) return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 })
  if (!scheduledTime) return NextResponse.json({ error: 'Data e hora são obrigatórios.' }, { status: 400 })
  if (!doFacebook && !doInstagram) return NextResponse.json({ error: 'Selecione ao menos uma plataforma.' }, { status: 400 })

  const scheduledTs = Math.floor(new Date(scheduledTime).getTime() / 1000)
  const nowTs = Math.floor(Date.now() / 1000)
  const minGap = doInstagram ? 1200 : 600 // IG: 20min, FB: 10min
  if (scheduledTs < nowTs + minGap) {
    const label = doInstagram ? '20 minutos' : '10 minutos'
    return NextResponse.json({ error: `O horário deve ser pelo menos ${label} no futuro.` }, { status: 400 })
  }

  // Upload de todas as imagens para o Facebook
  let uploads: Array<{ photoId: string; imageUrl: string }>
  try {
    uploads = await Promise.all(files.map(f => uploadPhoto(f, token)))
  } catch (err: any) {
    return NextResponse.json({ error: `Erro no upload das imagens: ${err.message}` }, { status: 500 })
  }

  const photoIds = uploads.map(u => u.photoId)
  const imageUrls = uploads.map(u => u.imageUrl).filter(Boolean)

  const results: Record<string, string> = {}
  const warnings: string[] = []

  // ── Facebook ─────────────────────────────────────────────────────────────
  if (doFacebook) {
    try {
      const res = await fetch(`${FB_API}/${PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: description,
          attached_media: photoIds.map(id => ({ media_fbid: id })),
          scheduled_publish_time: scheduledTs,
          published: false,
          access_token: token,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      results.facebook = data.id
    } catch (err: any) {
      warnings.push(`Facebook: ${err.message}`)
    }
  }

  // ── Instagram ─────────────────────────────────────────────────────────────
  if (doInstagram) {
    if (!imageUrls.length) {
      warnings.push('Instagram: não foi possível obter URLs públicas das imagens.')
    } else if (imageUrls.length === 1) {
      // Post simples
      try {
        const containerRes = await fetch(`${FB_API}/${IG_ID}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrls[0],
            caption: description,
            published: false,
            scheduled_publish_time: scheduledTs,
            access_token: token,
          }),
        })
        const container = await containerRes.json()
        if (container.error) throw new Error(container.error.message)

        await waitContainer(container.id, token)

        const publishRes = await fetch(`${FB_API}/${IG_ID}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: container.id, access_token: token }),
        })
        const published = await publishRes.json()
        if (published.error) throw new Error(published.error.message)
        results.instagram = published.id
      } catch (err: any) {
        warnings.push(`Instagram: ${err.message}`)
      }
    } else {
      // Carrossel (2–10 imagens)
      try {
        const childIds: string[] = []
        for (const url of imageUrls) {
          const r = await fetch(`${FB_API}/${IG_ID}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: token }),
          })
          const child = await r.json()
          if (child.error) throw new Error(child.error.message)
          await waitContainer(child.id, token)
          childIds.push(child.id)
        }

        const carouselRes = await fetch(`${FB_API}/${IG_ID}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'CAROUSEL',
            children: childIds.join(','),
            caption: description,
            published: false,
            scheduled_publish_time: scheduledTs,
            access_token: token,
          }),
        })
        const carousel = await carouselRes.json()
        if (carousel.error) throw new Error(carousel.error.message)
        await waitContainer(carousel.id, token)

        const publishRes = await fetch(`${FB_API}/${IG_ID}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: carousel.id, access_token: token }),
        })
        const published = await publishRes.json()
        if (published.error) throw new Error(published.error.message)
        results.instagram = published.id
      } catch (err: any) {
        warnings.push(`Instagram carrossel: ${err.message}`)
      }
    }
  }

  if (warnings.length && !Object.keys(results).length) {
    return NextResponse.json({ error: warnings.join(' | ') }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    results,
    warnings: warnings.length ? warnings : undefined,
  })
}
