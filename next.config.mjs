/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Erros de tipo não bloqueiam o build em produção
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'feltrofacil.com.br',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

export default nextConfig
