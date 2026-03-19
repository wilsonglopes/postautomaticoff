'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

const breadcrumbMap: Record<string, string> = {
  admin: 'Dashboard',
  'novo-post': 'Novo Post',
  historico: 'Histórico',
  preview: 'Pré-visualização',
  editar: 'Editar Post',
}

export function Topbar() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] ?? seg,
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <nav className="flex items-center gap-1 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-gray-900 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {crumbs.slice(1).map(crumb => (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {crumb.isLast ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
