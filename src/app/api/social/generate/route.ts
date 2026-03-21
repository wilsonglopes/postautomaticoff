import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  const { nome, creditos, linkArtigo } = await request.json()

  if (!nome) return NextResponse.json({ error: 'Nome da peça é obrigatório.' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada.' }, { status: 500 })

  const client = new Anthropic({ apiKey })

  const prompt = `Você é um redator criativo especializado em artesanato de feltro para o blog FeltroFácil.

Gere uma descrição para post de Instagram/Facebook seguindo EXATAMENTE este formato:

[Parágrafo entusiasmado e fofo descrevendo a peça, com emojis relevantes. Mencione aparência, detalhes, usos (decoração, presente, venda). 3-4 frases. Tom animado e carinhoso.]
Créditos: ${creditos || '[nome do autor]'}
Confira o molde no artigo: ${linkArtigo || 'https://feltrofacil.com.br'}
Loja de Apostilas: https://loja.feltrofacil.com.br
Feltros Santa Fé: https://feltrossantafe.net
Use o cupom FELTROFACIL e ganhe 10% de desconto.
#feltro #artesanatoemfeltro #[hashtag da peça]feltro #feltrocriativo #costuracriativa #feitoamao #diy #moldesgratis #feltroartesanato #artesanatocriativo

Peça: ${nome}

Regras:
- Escreva APENAS o texto final, sem explicações
- O parágrafo deve ser em português brasileiro, tom fofo e entusiasmado
- Use emojis relacionados à peça no parágrafo
- Crie 2-3 hashtags específicas da peça além das fixas
- Não invente links, use exatamente os links fornecidos`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })
    const description = (message.content[0] as any).text
    return NextResponse.json({ success: true, description })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
