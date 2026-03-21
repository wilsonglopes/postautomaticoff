import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://postautomaticoff.netlify.app'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/admin/pinterest?error=${error || 'sem_codigo'}`)
  }

  const clientId = process.env.PINTEREST_CLIENT_ID!
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET!
  const redirectUri = `${APP_URL}/api/pinterest/callback`

  // Trocar code por access_token
  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    const data = await res.json()

    if (!data.access_token) {
      console.error('Pinterest OAuth error:', data)
      return NextResponse.redirect(`${APP_URL}/admin/pinterest?error=token_invalido`)
    }

    // Salvar access_token e refresh_token no Supabase
    await supabaseAdmin.from('settings').upsert({
      key: 'pinterest_access_token',
      value: data.access_token,
    })

    if (data.refresh_token) {
      await supabaseAdmin.from('settings').upsert({
        key: 'pinterest_refresh_token',
        value: data.refresh_token,
      })
    }

    // Redirecionar de volta ao painel com sucesso
    return NextResponse.redirect(`${APP_URL}/admin/pinterest?connected=true`)
  } catch (err: any) {
    console.error('Pinterest callback error:', err)
    return NextResponse.redirect(`${APP_URL}/admin/pinterest?error=${encodeURIComponent(err.message)}`)
  }
}
