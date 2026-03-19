const WP_BASE_URL = process.env.WP_BASE_URL
const WP_USERNAME = process.env.WP_USERNAME
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD

function getAuthHeader(): string {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error('Credenciais do WordPress não configuradas.')
  }
  const credentials = `${WP_USERNAME}:${WP_APP_PASSWORD}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

export function getWpApiUrl(endpoint: string): string {
  if (!WP_BASE_URL) {
    throw new Error('WP_BASE_URL não configurado.')
  }
  return `${WP_BASE_URL}/wp-json/wp/v2/${endpoint}`
}

export async function wpFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getWpApiUrl(endpoint)
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = `WordPress API error: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.message || errorMessage
    } catch {
      // ignore json parse errors
    }
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}
