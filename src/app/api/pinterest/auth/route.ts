import { NextResponse } from 'next/server'

// Redireciona o usuário para o Pinterest OAuth com os escopos necessários
export async function GET() {
  const clientId = process.env.PINTEREST_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'PINTEREST_CLIENT_ID não configurado.' }, { status: 500 })
  }

  const redirectUri = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://postautomaticoff.netlify.app'}/api/pinterest/callback`
  )

  // Escopos necessários: criar pins, ler boards, ler conta
  const scope = encodeURIComponent('pins:read,pins:write,boards:read,user_accounts:read')

  const state = Math.random().toString(36).substring(2) // CSRF protection básico

  const authUrl =
    `https://www.pinterest.com/oauth/?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${state}`

  return NextResponse.redirect(authUrl)
}
