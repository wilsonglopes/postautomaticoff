import { getWpApiUrl } from './client'
import type { WpMediaResponse } from '@/types'

const WP_USERNAME = process.env.WP_USERNAME
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD

function getAuthHeader(): string {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error('Credenciais do WordPress não configuradas.')
  }
  return `Basic ${Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')}`
}

/**
 * Faz upload de uma imagem a partir de uma URL (Supabase) para a biblioteca de mídia do WordPress.
 */
export async function uploadMediaFromUrl(
  imageUrl: string,
  fileName: string,
  altText: string = ''
): Promise<WpMediaResponse> {
  // 1. Baixar a imagem da URL do Supabase
  const imgResponse = await fetch(imageUrl)
  if (!imgResponse.ok) {
    throw new Error(`Falha ao baixar imagem: ${imageUrl}`)
  }

  const imageBuffer = await imgResponse.arrayBuffer()
  const contentType = imgResponse.headers.get('content-type') || 'image/jpeg'

  // 2. Upload para WordPress
  const url = getWpApiUrl('media')
  const wpResponse = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': contentType,
    },
    body: imageBuffer,
  })

  if (!wpResponse.ok) {
    let errorMessage = `Erro no upload de mídia WP: ${wpResponse.status}`
    try {
      const errorBody = await wpResponse.json()
      errorMessage = errorBody.message || errorMessage
    } catch {
      // ignore
    }
    throw new Error(errorMessage)
  }

  const media = await wpResponse.json() as WpMediaResponse

  // 3. Atualizar alt text se fornecido
  if (altText) {
    const updateUrl = getWpApiUrl(`media/${media.id}`)
    await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alt_text: altText }),
    }).catch(() => {
      // não bloquear se update falhar
    })
  }

  return media
}
