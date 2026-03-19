import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { ApiResponse } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { tema, categoria } = body

    if (!tema || !tema.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Preencha o campo "Tema do Título" antes de gerar com IA.' }, { status: 400 })
    }

    const categoriaHint = categoria ? `\nCategoria do blog: ${categoria}` : ''

    const prompt = `Você é um especialista em SEO e criação de conteúdo para o blog feltrofacil.com.br, focado em artesanato com feltro.

Com base no tema abaixo, gere as informações para um post de blog otimizado para SEO.${categoriaHint}

Tema: "${tema}"

Retorne APENAS um JSON válido com exatamente esta estrutura (sem markdown, sem explicações):
{
  "titulo": "Título principal do post (com a keyword e indicando molde grátis ou passo a passo quando aplicável, até 70 chars)",
  "keyword": "Palavra-chave foco principal em português (ex: boneca bailarina de feltro)",
  "keywordVariacao": "Variação da palavra-chave sem 'de feltro' (ex: bailarina de feltro)",
  "descricao": "Descrição base atrativa de 2-3 frases contextualizando a peça, seu uso e o que torna o tutorial especial (80-180 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoTitulo": "Meta título SEO com keyword no início e | Feltro Fácil no final (50-60 chars)",
  "seoDescricao": "Meta descrição chamativa com a keyword, benefício e CTA (120-155 chars)"
}

Regras:
- A keyword deve conter obrigatoriamente "de feltro" ou "em feltro"
- Tags devem ser termos relevantes para artesanato em feltro (incluir "feltro", "artesanato", a keyword e variações)
- Meta título deve começar com a keyword principal
- Meta descrição deve ter chamada para ação (ex: "Confira o passo a passo!")
- Tudo em português brasileiro`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Resposta inválida da IA.')
    }

    const raw = textBlock.text.trim()
    // Extract JSON if wrapped in code block
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || raw.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? jsonMatch[1] : raw

    let generated
    try {
      generated = JSON.parse(jsonStr)
    } catch {
      throw new Error('A IA retornou formato inválido. Tente novamente.')
    }

    return NextResponse.json({ data: generated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar conteúdo com IA.'
    return NextResponse.json<ApiResponse>({ error: message }, { status: 500 })
  }
}
