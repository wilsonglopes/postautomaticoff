# Feltro Fácil Blog Manager

Sistema completo para criação e publicação de artigos no blog [feltrofacil.com.br](https://feltrofacil.com.br) (WordPress).

## Funcionalidades

- ✅ Formulário completo de criação de posts (tema, título, keyword, descrição, créditos, etc.)
- ✅ Upload progressivo de imagens (peça e molde) com ordenação drag-up/down
- ✅ Imagem destacada com preview
- ✅ Gerador de artigo SEO em HTML compatível com WordPress
- ✅ Análise SEO on-page em tempo real (score + checklist)
- ✅ Auto-sugestões de keyword, slug, meta título, meta descrição e tags
- ✅ Links internos e externos automáticos (Loja + Santa Fé)
- ✅ Auto-save a cada 3 segundos
- ✅ Integração WordPress via REST API + Application Passwords
- ✅ Upload de imagens para biblioteca de mídia do WordPress
- ✅ Preview do artigo, do HTML e do SEO
- ✅ Histórico de posts com status, duplicar, editar, excluir
- ✅ Deploy no Netlify (via `@netlify/plugin-nextjs`)

## Stack

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Front-end    | Next.js 14 (App Router, TypeScript) |
| Estilo       | Tailwind CSS + lucide-react       |
| Banco        | Supabase (PostgreSQL)             |
| Storage      | Supabase Storage                  |
| Notificações | react-hot-toast                   |
| Deploy       | Netlify + `@netlify/plugin-nextjs` |
| WordPress    | REST API + Application Passwords  |

---

## Rodar localmente

### 1. Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) (gratuita)
- Blog WordPress com REST API habilitada (padrão no WP 5.6+)

### 2. Clonar e instalar

```bash
git clone https://github.com/SEU_USUARIO/feltrofacil-blog-manager.git
cd feltrofacil-blog-manager
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

WP_BASE_URL=https://feltrofacil.com.br
WP_USERNAME=admin
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No menu lateral: **SQL Editor** → cole o conteúdo de `supabase/schema.sql` → **Run**
3. No menu lateral: **Storage** → **New bucket** → nome: `post-images` → marcar **Public** → **Save**
4. Copie as chaves em: **Project Settings → API**

### 5. Configurar WordPress Application Password

1. Acesse seu WP Admin > **Usuários** > **Perfil**
2. Role até **Senhas de Aplicativo**
3. Nome: `Blog Manager` → **Adicionar Nova Senha de Aplicativo**
4. Copie a senha gerada (formato: `xxxx xxxx xxxx xxxx xxxx xxxx`)
5. Cole em `WP_APP_PASSWORD` no `.env.local`

> ⚠️ Se a opção de Application Password não aparecer, verifique se o seu WordPress está em versão 5.6+ e se os permalinks personalizados estão habilitados.

### 6. Rodar

```bash
npm run dev
```

Acesse: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Estrutura do Projeto

```
feltrofacil-blog-manager/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── historico/         # Histórico de posts
│   │   │   ├── novo-post/         # Criar novo post
│   │   │   └── post/[id]/         # Editar post + preview
│   │   └── api/
│   │       ├── posts/             # CRUD de posts
│   │       ├── upload/            # Upload de imagens
│   │       ├── generate/          # Geração do artigo HTML
│   │       └── wordpress/         # Integração WP
│   ├── components/
│   │   ├── layout/                # Sidebar, Topbar
│   │   ├── post/PostEditor.tsx    # Formulário principal
│   │   └── ui/                    # Componentes primitivos
│   ├── lib/
│   │   ├── generator/             # Gerador de artigo HTML
│   │   ├── seo/                   # Análise SEO
│   │   ├── supabase/              # Clientes Supabase
│   │   ├── wordpress/             # Integração WP
│   │   └── utils/                 # Slugify, datas, etc.
│   └── types/                     # Interfaces TypeScript
├── supabase/schema.sql            # Schema do banco
├── .env.example                   # Template de variáveis
├── netlify.toml                   # Config Netlify
└── README.md
```

---

## Deploy no Netlify

### 1. Subir no GitHub

```bash
git init
git add .
git commit -m "feat: sistema de blog Feltro Fácil"
git remote add origin https://github.com/SEU_USUARIO/feltrofacil-blog-manager.git
git push -u origin main
```

### 2. Conectar ao Netlify

1. Acesse [netlify.com](https://netlify.com)
2. **Add new site** → **Import an existing project**
3. Escolha **GitHub** → selecione o repositório
4. Configurações de build (já estão no `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Clique em **Deploy site**

### 3. Configurar variáveis de ambiente no Netlify

No painel do Netlify: **Site settings → Environment variables** → adicione:

| Variável                         | Valor                                    |
|----------------------------------|------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | `https://xxxx.supabase.co`               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | `eyJ...`                                 |
| `SUPABASE_SERVICE_ROLE_KEY`      | `eyJ...`                                 |
| `WP_BASE_URL`                    | `https://feltrofacil.com.br`             |
| `WP_USERNAME`                    | `admin`                                  |
| `WP_APP_PASSWORD`                | `xxxx xxxx xxxx xxxx xxxx xxxx`          |
| `NEXT_PUBLIC_APP_URL`            | `https://SEU-PROJETO.netlify.app`        |

### 4. Redeploy

Após adicionar as variáveis: **Deploys** → **Trigger deploy** → **Deploy site**

---

## Fluxo de uso

1. Acesse `/admin/novo-post`
2. Preencha tema, título, keyword, descrição, créditos
3. Faça upload da imagem destacada
4. Adicione fotos da peça e moldes (em ordem)
5. Adicione links internos (posts relacionados)
6. Clique em **Gerar Artigo** — o HTML é gerado automaticamente
7. Revise no **Preview** (aba preview, HTML, SEO)
8. Clique **Publicar no WordPress** ou **Salvar no WP** (rascunho)

---

## Gerador de Artigo

O gerador cria um artigo com a seguinte estrutura:

```
H2: Subtítulo criativo
P:  Introdução com keyword
P:  Segundo parágrafo
[Links "Veja também"]
H2: Sobre a Peça
P:  Descrição
[Imagens da peça]
H2: Molde
P:  Explicação
[Imagens do molde]
H2: Materiais
P:  Lista de materiais + execução
P:  Links externos (Loja + Santa Fé)
H2: Fechamento
P:  Links internos finais
---
P:  Créditos
```

---

## Integração WordPress

O sistema usa a **WordPress REST API** com **Application Passwords**.

Endpoints utilizados:
- `POST /wp-json/wp/v2/media` — upload de imagens
- `POST /wp-json/wp/v2/posts` — criação de post
- `POST /wp-json/wp/v2/posts/{id}` — atualização de post
- `GET /wp-json/wp/v2/categories` — buscar categorias
- `GET /wp-json/wp/v2/tags` — buscar tags

Campos SEO suportados (Yoast SEO e RankMath):
- `_yoast_wpseo_title` / `rank_math_title`
- `_yoast_wpseo_metadesc` / `rank_math_description`
- `_yoast_wpseo_focuskw` / `rank_math_focus_keyword`

---

## Segurança

- Credenciais do WordPress ficam **apenas nas variáveis de ambiente do servidor**
- Nunca são expostas ao front-end
- O `SUPABASE_SERVICE_ROLE_KEY` é usado apenas nas API routes (servidor)
- O `NEXT_PUBLIC_SUPABASE_ANON_KEY` pode ir ao front-end com segurança

---

## Próximas melhorias

- [ ] Integração com Claude/OpenAI para geração de conteúdo com IA
- [ ] Editor rich text para a introdução
- [ ] Banco de links internos (sugestões automáticas por tema)
- [ ] Exportação do artigo em `.docx`
- [ ] Autenticação para proteger o painel
- [ ] Webhook para receber updates do WordPress
