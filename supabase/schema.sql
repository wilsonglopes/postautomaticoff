-- ================================================================
-- Feltro Fácil Blog Manager – Schema Supabase
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- ================================================================

-- Extensão UUID
create extension if not exists "uuid-ossp";

-- ================================================================
-- TABELA: posts
-- ================================================================
create table if not exists posts (
  id                        uuid primary key default uuid_generate_v4(),

  -- Dados principais
  tema                      text not null default '',
  titulo                    text not null default '',
  keyword                   text not null default '',
  keyword_variacao          text not null default '',
  descricao                 text not null default '',
  creditos                  text not null default '',
  execucao                  text not null default '',

  -- Taxonomia
  categoria                 text not null default '',
  tags                      text[] not null default '{}',

  -- SEO
  slug                      text not null default '',
  seo_titulo                text not null default '',
  seo_descricao             text not null default '',

  -- Links
  link_artigo_relacionado   text,
  sem_artigo_relacionado    boolean not null default false,

  -- Interno
  observacoes_internas      text,
  html_artigo               text,

  -- Status
  status                    text not null default 'rascunho'
                            check (status in ('rascunho','publicando','publicado','erro')),
  erro_publicacao           text,

  -- WordPress
  wp_post_id                integer,
  wp_post_url               text,
  wp_featured_media_id      integer,

  -- Timestamps
  criado_em                 timestamptz not null default now(),
  atualizado_em             timestamptz not null default now(),
  publicado_em              timestamptz
);

-- Índices úteis
create index if not exists posts_status_idx   on posts(status);
create index if not exists posts_criado_em_idx on posts(criado_em desc);
create index if not exists posts_keyword_idx  on posts using gin(to_tsvector('portuguese', keyword));

-- Trigger para atualizar atualizado_em
create or replace function update_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists posts_atualizado_em on posts;
create trigger posts_atualizado_em
  before update on posts
  for each row execute procedure update_atualizado_em();

-- ================================================================
-- TABELA: post_imagens
-- ================================================================
create table if not exists post_imagens (
  id              uuid primary key default uuid_generate_v4(),
  post_id         uuid not null references posts(id) on delete cascade,

  -- Tipo e ordem
  tipo            text not null default 'peca'
                  check (tipo in ('peca', 'molde', 'destaque')),
  ordem           smallint not null default 0,

  -- Storage Supabase
  storage_path    text not null default '',
  url_supabase    text not null default '',

  -- WordPress (preenchido após upload para WP)
  wp_media_id     integer,
  url_wp          text,

  -- Metadados
  alt_text        text not null default '',
  legenda         text not null default '',
  nome_arquivo    text not null default '',
  tamanho_arquivo integer,

  criado_em       timestamptz not null default now()
);

create index if not exists post_imagens_post_id_idx  on post_imagens(post_id);
create index if not exists post_imagens_tipo_idx     on post_imagens(post_id, tipo);
create index if not exists post_imagens_ordem_idx    on post_imagens(post_id, ordem);

-- ================================================================
-- TABELA: post_links_internos
-- ================================================================
create table if not exists post_links_internos (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references posts(id) on delete cascade,
  url         text not null,
  anchor_text text not null,
  ordem       smallint not null default 0
);

create index if not exists post_links_post_id_idx on post_links_internos(post_id);

-- ================================================================
-- ROW LEVEL SECURITY
-- Para uso no ambiente de produção com autenticação.
-- Por enquanto, as API routes usam a chave de serviço (service role)
-- que bypassa o RLS automaticamente.
-- ================================================================
alter table posts               enable row level security;
alter table post_imagens        enable row level security;
alter table post_links_internos enable row level security;

-- Política permissiva para service role (usada nas API routes)
-- O service role sempre bypassa RLS, então estas políticas
-- só afetam o anon key / authenticated users.
create policy "Acesso público de leitura" on posts
  for select using (true);

create policy "Acesso público de leitura" on post_imagens
  for select using (true);

create policy "Acesso público de leitura" on post_links_internos
  for select using (true);

-- ================================================================
-- STORAGE BUCKET
-- Crie manualmente no Supabase Dashboard > Storage:
--
-- Nome: post-images
-- Tipo: Public
-- Max file size: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Ou execute via Supabase CLI:
-- supabase storage create post-images --public
-- ================================================================

-- Verificar criação
select 'Schema criado com sucesso!' as status;
