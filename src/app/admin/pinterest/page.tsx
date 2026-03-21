'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Pin, Upload, X, ExternalLink, Settings, CheckCircle2,
  AlertCircle, Loader2, ChevronDown, ImageIcon, Link2,
  Tag, AlignLeft, Type,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import toast from 'react-hot-toast'

interface Board {
  id: string
  name: string
  description: string
}

export default function PinterestPage() {
  // ── Token state ────────────────────────────────────────────
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [boardIdInput, setBoardIdInput] = useState('')
  const [savingToken, setSavingToken] = useState(false)
  const [testingToken, setTestingToken] = useState(false)
  const [tokenUser, setTokenUser] = useState('')

  // ── Boards ─────────────────────────────────────────────────
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [showBoardDropdown, setShowBoardDropdown] = useState(false)

  // ── Image ──────────────────────────────────────────────────
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Form ───────────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [altText, setAltText] = useState('')
  const [tags, setTags] = useState('')

  // ── Submit ─────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ pinId: string; pinUrl: string } | null>(null)

  // Check token on mount
  useEffect(() => {
    fetch('/api/pinterest/token')
      .then(r => r.json())
      .then(d => setTokenConfigured(d.configured))
  }, [])

  // Load boards when token is configured
  useEffect(() => {
    if (!tokenConfigured) return
    setLoadingBoards(true)
    fetch('/api/pinterest/boards')
      .then(r => r.json())
      .then(d => {
        if (d.boards) {
          setBoards(d.boards)
          if (d.defaultBoardId) setSelectedBoard(d.defaultBoardId)
          else if (d.boards.length > 0) setSelectedBoard(d.boards[0].id)
        }
      })
      .finally(() => setLoadingBoards(false))
  }, [tokenConfigured])

  // ── Image handling ─────────────────────────────────────────
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são suportadas.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 20MB.')
      return
    }
    setImage(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    if (!altText) setAltText(file.name.replace(/\.[^.]+$/, ''))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [altText])

  // ── Token actions ──────────────────────────────────────────
  async function saveToken() {
    if (!tokenInput.trim()) return
    setSavingToken(true)
    try {
      const res = await fetch('/api/pinterest/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim(), boardId: boardIdInput.trim() || undefined }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Token salvo!')
      setTokenConfigured(true)
      setShowTokenModal(false)
      setTokenInput('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingToken(false)
    }
  }

  async function testToken() {
    setTestingToken(true)
    setTokenUser('')
    try {
      const res = await fetch('/api/pinterest/token', { method: 'PUT' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setTokenUser(data.name)
      toast.success(`Token válido! Usuário: @${data.name}`)
    } catch (err: any) {
      toast.error(`Token inválido: ${err.message}`)
    } finally {
      setTestingToken(false)
    }
  }

  // ── Build description with tags ────────────────────────────
  function buildFullDescription() {
    const tagList = tags
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`))
      .join(' ')
    return description + (tagList ? '\n\n' + tagList : '')
  }

  // ── Submit pin ─────────────────────────────────────────────
  async function handleSubmit() {
    if (!image) { toast.error('Selecione uma imagem.'); return }
    if (!title.trim()) { toast.error('Título é obrigatório.'); return }
    if (!selectedBoard) { toast.error('Selecione um board.'); return }

    setSubmitting(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('image', image)
      fd.append('title', title)
      fd.append('description', buildFullDescription())
      fd.append('link', link)
      fd.append('boardId', selectedBoard)
      fd.append('altText', altText || title)

      const res = await fetch('/api/pinterest/pin', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setResult({ pinId: data.pinId, pinUrl: data.pinUrl })
      toast.success('Pin criado com sucesso!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedBoardName = boards.find(b => b.id === selectedBoard)?.name || 'Selecionar board'
  const descPreview = buildFullDescription()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Pin className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pinterest</h1>
            <p className="text-sm text-gray-500">Criar e publicar pins</p>
          </div>
        </div>

        {/* Token button */}
        <button
          onClick={() => setShowTokenModal(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            tokenConfigured
              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${tokenConfigured ? 'bg-red-500' : 'bg-gray-400'}`} />
          <Settings className="w-3 h-3" />
          Token Pinterest
        </button>
      </div>

      {/* ── Not configured warning ───────────────────────── */}
      {!tokenConfigured && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Token não configurado</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Configure o Access Token do Pinterest para criar pins. Gere um token em{' '}
              <span className="font-medium">developers.pinterest.com</span> com os escopos{' '}
              <code className="bg-amber-100 px-1 rounded">pins:write</code> e{' '}
              <code className="bg-amber-100 px-1 rounded">boards:read</code>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Image + Link ──────────────────────────── */}
        <div className="space-y-4">

          {/* Image upload */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Imagem do Pin</h2>
              <span className="text-xs text-red-500">*</span>
            </div>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-72" />
                <button
                  onClick={() => { setImage(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs truncate">{image?.name}</p>
                  <p className="text-white/70 text-xs">{image ? (image.size / 1024).toFixed(0) + ' KB' : ''}</p>
                </div>
              </div>
            ) : (
              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                  dragging ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-red-600">Clique para escolher</span> ou arraste aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Máx 20MB · Proporção 2:3 recomendada</p>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </Card>

          {/* Link */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Link de Destino</h2>
            </div>
            <Input
              placeholder="https://feltrofacil.com.br/artigo-da-peca"
              value={link}
              onChange={e => setLink(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-2">URL para onde o pin vai redirecionar ao clicar</p>
          </Card>
        </div>

        {/* ── Right: Pin details ──────────────────────────── */}
        <div className="space-y-4">

          {/* Board selector */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Board</h2>
              <span className="text-xs text-red-500">*</span>
            </div>
            <div className="relative">
              <button
                onClick={() => tokenConfigured && setShowBoardDropdown(!showBoardDropdown)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                  tokenConfigured
                    ? 'border-gray-300 hover:border-red-400 bg-white'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className={selectedBoard ? 'text-gray-900' : 'text-gray-400'}>
                  {loadingBoards ? 'Carregando boards...' : selectedBoardName}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showBoardDropdown && boards.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {boards.map(board => (
                    <button
                      key={board.id}
                      onClick={() => { setSelectedBoard(board.id); setShowBoardDropdown(false) }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-red-50 transition-colors ${
                        board.id === selectedBoard ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Title */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Título</h2>
              <span className="text-xs text-red-500">*</span>
            </div>
            <Input
              placeholder="Ex: Coelhinha de Feltro — Molde Grátis e Passo a Passo"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
          </Card>

          {/* Description */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <AlignLeft className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Descrição</h2>
            </div>
            <Textarea
              placeholder="Descreva o pin de forma atrativa..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
          </Card>

          {/* Tags / Hashtags */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Tags / Hashtags</h2>
            </div>
            <Input
              placeholder="feltro artesanato coelhinha moldes #diy #feltrofacil"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-2">Separe por espaço ou vírgula. # é adicionado automaticamente.</p>

            {/* Tag preview */}
            {tags.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.split(/[\s,]+/).filter(Boolean).map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full font-medium">
                    {t.startsWith('#') ? t : `#${t}`}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Alt text */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Texto Alternativo</h2>
            </div>
            <Input
              placeholder="Descrição da imagem para acessibilidade"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              maxLength={500}
            />
          </Card>
        </div>
      </div>

      {/* ── Preview da descrição completa ─────────────────── */}
      {descPreview && (
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview da Descrição</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{descPreview}</p>
        </Card>
      )}

      {/* ── Result ─────────────────────────────────────────── */}
      {result && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">Pin criado com sucesso!</p>
            <p className="text-xs text-green-600 mt-0.5">ID: {result.pinId}</p>
          </div>
          <a href={result.pinUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="text-green-700">
              <ExternalLink className="w-4 h-4" />
              Ver Pin
            </Button>
          </a>
        </div>
      )}

      {/* ── Submit button ───────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!tokenConfigured || !image || !title || !selectedBoard}
          className="bg-red-600 hover:bg-red-700 text-white px-8"
        >
          <Pin className="w-4 h-4" />
          Publicar Pin
        </Button>
      </div>

      {/* ── Token Modal ─────────────────────────────────────── */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Configurar Token Pinterest</h3>
              </div>
              <button onClick={() => setShowTokenModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">Como obter o Access Token:</p>
                <p>1. Acesse <strong>developers.pinterest.com</strong></p>
                <p>2. Crie um App e gere um Access Token</p>
                <p>3. Escopos necessários: <code className="bg-white px-1 rounded border">pins:write</code> <code className="bg-white px-1 rounded border">boards:read</code></p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Access Token</label>
                <Input
                  type="password"
                  placeholder="Cole o Access Token aqui"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Board ID padrão (opcional)</label>
                <Input
                  placeholder="ID do board que será selecionado por padrão"
                  value={boardIdInput}
                  onChange={e => setBoardIdInput(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Deixe em branco para selecionar manualmente depois.</p>
              </div>

              {tokenUser && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">@{tokenUser}</span>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={testToken} loading={testingToken}>
                Testar
              </Button>
              <Button size="sm" onClick={saveToken} loading={savingToken}
                className="bg-red-600 hover:bg-red-700 text-white">
                Salvar Token
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
