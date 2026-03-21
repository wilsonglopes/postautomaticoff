'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import toast from 'react-hot-toast'
import {
  Instagram,
  Facebook,
  Sparkles,
  Calendar,
  Upload,
  X,
  Settings,
  Send,
  Image as ImageIcon,
} from 'lucide-react'

interface FileItem {
  file: File
  url: string
}

export default function SocialPage() {
  // ── Form state ──────────────────────────────────────────────────────────
  const [files, setFiles] = useState<FileItem[]>([])
  const [description, setDescription] = useState('')
  const [nomePeca, setNomePeca] = useState('')
  const [creditos, setCreditos] = useState('')
  const [linkArtigo, setLinkArtigo] = useState('')
  const [doFacebook, setDoFacebook] = useState(true)
  const [doInstagram, setDoInstagram] = useState(true)
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')

  // ── UI state ────────────────────────────────────────────────────────────
  const [scheduling, setScheduling] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [tokenModal, setTokenModal] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenOk, setTokenOk] = useState(false)
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setDefaultDateTime()
    checkToken()
  }, [])

  function setDefaultDateTime() {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30)
    const pad = (n: number) => String(n).padStart(2, '0')
    setSchedDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
    setSchedTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`)
  }

  async function checkToken() {
    try {
      const res = await fetch('/api/social/token')
      const data = await res.json()
      setTokenOk(!!data.configured)
    } catch {}
  }

  // ── Imagens ─────────────────────────────────────────────────────────────
  function addFiles(newFiles: File[]) {
    const images = newFiles.filter(f => f.type.startsWith('image/'))
    if (files.length + images.length > 10) {
      toast.error('Máximo de 10 imagens por post.')
      return
    }
    setFiles(prev => [...prev, ...images.map(f => ({ file: f, url: URL.createObjectURL(f) }))])
  }

  function removeFile(index: number) {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    addFiles([...e.dataTransfer.files])
  }

  function handleReorder(targetIdx: number) {
    if (dragSrcIdx === null || dragSrcIdx === targetIdx) return
    setFiles(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragSrcIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    setDragSrcIdx(null)
  }

  // ── IA ──────────────────────────────────────────────────────────────────
  async function generateDescription() {
    if (!nomePeca) return toast.error('Informe o nome da peça.')
    setGenerating(true)
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomePeca, creditos, linkArtigo }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setDescription(data.description)
        setTokenOk(true)
        toast.success('Descrição gerada!')
      }
    } catch {
      toast.error('Erro ao gerar descrição.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Token ────────────────────────────────────────────────────────────────
  async function saveToken() {
    if (!tokenInput.trim()) return toast.error('Cole o token primeiro.')
    try {
      const res = await fetch('/api/social/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      })
      const data = await res.json()
      if (data.error) return toast.error(data.error)
      setTokenOk(true)
      setTokenModal(false)
      setTokenInput('')
      toast.success('Token salvo!')
    } catch {
      toast.error('Erro ao salvar token.')
    }
  }

  async function testToken() {
    try {
      const res = await fetch('/api/social/token', { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        setTokenOk(true)
        toast.success(`Token válido — ${data.name}`)
      } else {
        setTokenOk(false)
        toast.error(`Token inválido: ${data.error}`)
      }
    } catch {
      toast.error('Erro ao testar token.')
    }
  }

  // ── Agendar ──────────────────────────────────────────────────────────────
  async function schedulePost() {
    if (!files.length) return toast.error('Selecione pelo menos uma imagem.')
    if (!description.trim()) return toast.error('Escreva a descrição do post.')
    if (!schedDate || !schedTime) return toast.error('Defina a data e hora.')
    if (!doFacebook && !doInstagram) return toast.error('Selecione pelo menos uma plataforma.')
    if (!tokenOk) {
      toast.error('Configure o Token do Facebook primeiro.')
      setTokenModal(true)
      return
    }

    setScheduling(true)
    try {
      const formData = new FormData()
      files.forEach(item => formData.append('images', item.file))
      formData.append('description', description)
      formData.append('scheduledTime', `${schedDate}T${schedTime}:00`)
      formData.append('facebook', String(doFacebook))
      formData.append('instagram', String(doInstagram))

      const res = await fetch('/api/social/schedule', { method: 'POST', body: formData })
      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'Erro ao agendar post.')
        return
      }

      const platforms = [
        data.results.facebook && 'Facebook',
        data.results.instagram && 'Instagram',
      ].filter(Boolean)

      toast.success(`Agendado para ${platforms.join(' e ')}!`)
      if (data.warnings?.length) {
        setTimeout(() => toast.error(`⚠️ ${data.warnings.join(' | ')}`), 3000)
      }

      // Reset
      files.forEach(f => URL.revokeObjectURL(f.url))
      setFiles([])
      setNomePeca('')
      setCreditos('')
      setLinkArtigo('')
      setDescription('')
      setDoFacebook(true)
      setDoInstagram(true)
      setDefaultDateTime()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setScheduling(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
          <p className="text-sm text-gray-500 mt-1">Agende posts no Facebook e Instagram</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTokenModal(true)}>
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${tokenOk ? 'bg-green-500' : 'bg-red-400'}`}
          />
          <Settings className="w-3.5 h-3.5 mr-1" />
          Token Facebook
        </Button>
      </div>

      {/* Imagens */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Imagens
        </h2>

        {files.length === 0 ? (
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              <span className="text-brand-600 font-semibold">Clique para escolher</span> ou arraste aqui
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · até 10 imagens · 10MB cada</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 text-right">
              <span className="font-semibold text-brand-600">{files.length}</span> imagem(ns) · arraste para reordenar
            </div>
            <div className="grid grid-cols-3 gap-3">
              {files.map((item, i) => (
                <div
                  key={item.url}
                  draggable
                  onDragStart={() => setDragSrcIdx(i)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleReorder(i)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-400 cursor-grab active:opacity-60 transition-all group"
                >
                  <img src={item.url} alt={`img ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {files.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all text-gray-400 text-xs gap-1"
                >
                  <Upload className="w-5 h-5" />
                  <span>Adicionar</span>
                </div>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { addFiles([...(e.target.files || [])]); e.target.value = '' }}
        />
      </Card>

      {/* Descrição com IA */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Descrição
        </h2>

        <div className="grid grid-cols-1 gap-3 mb-3">
          <Input
            placeholder="Nome da peça (ex: Caracol de feltro)"
            value={nomePeca}
            onChange={e => setNomePeca(e.target.value)}
          />
          <Input
            placeholder="Créditos (ex: Jussara Bastos)"
            value={creditos}
            onChange={e => setCreditos(e.target.value)}
          />
          <Input
            placeholder="Link do artigo (ex: https://feltrofacil.com.br/molde-de-caracol/)"
            value={linkArtigo}
            onChange={e => setLinkArtigo(e.target.value)}
          />
        </div>

        <Button
          variant="secondary"
          className="w-full mb-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:opacity-90 border-0"
          onClick={generateDescription}
          disabled={generating}
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Gerando...' : 'Gerar descrição com IA'}
        </Button>

        <Textarea
          placeholder="A descrição gerada pela IA aparecerá aqui. Você pode editar antes de programar."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={6}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{description.length} caracteres</p>
      </Card>

      {/* Plataformas */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Publicar em
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setDoFacebook(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
              doFacebook
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <Facebook className="w-4 h-4" /> Facebook
          </button>
          <button
            onClick={() => setDoInstagram(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
              doInstagram
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <Instagram className="w-4 h-4" /> Instagram
          </button>
        </div>
      </Card>

      {/* Data e hora */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Agendar para
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
            <input
              type="date"
              value={schedDate}
              onChange={e => setSchedDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora</label>
            <input
              type="time"
              value={schedTime}
              onChange={e => setSchedTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Botão agendar */}
      <Button
        className="w-full py-4 text-base"
        onClick={schedulePost}
        disabled={scheduling}
      >
        <Send className="w-5 h-5" />
        {scheduling ? `Enviando ${files.length} imagem(ns)...` : 'Programar publicação'}
      </Button>

      {/* Modal token */}
      {tokenModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setTokenModal(false) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-1">🔑 Token de Acesso</h2>
            <p className="text-sm text-gray-500 mb-4">
              Gere um token no <strong>Graph API Explorer</strong> do Meta for Developers com permissões{' '}
              <code className="bg-gray-100 px-1 rounded">pages_manage_posts</code> e{' '}
              <code className="bg-gray-100 px-1 rounded">instagram_basic</code>.
            </p>
            <Input
              placeholder="EAABCSVUUiB4..."
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveToken()}
              className="font-mono text-xs mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={testToken} size="sm">Testar token atual</Button>
              <Button variant="outline" onClick={() => setTokenModal(false)} size="sm">Cancelar</Button>
              <Button onClick={saveToken} size="sm">Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
