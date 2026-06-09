# Catálogo ORA

Aplicação React full-stack com Next.js 16 App Router para catálogo público, painel administrativo, upload de imagens, autenticação e APIs internas com Prisma/PostgreSQL.

## Stack

- React 19 com componentes funcionais
- Next.js 16 App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth Credentials
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS 4
- Docker multi-stage com `output: "standalone"`

## Estrutura

```txt
src/
  app/
    admin/
    api/
    produto/[slug]/
    uploads/[...path]/
    layout.tsx
    page.tsx
    providers.tsx
  components/
  features/
  lib/
  types/
  proxy.ts
prisma/
scripts/
public/
Dockerfile
docker-compose.yml
```

## Rodando localmente

1. Instale dependências:

```bash
npm install
```

2. Configure `.env` para um PostgreSQL acessível pela máquina:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/catalogdb?schema=public
NEXTAUTH_URL=http://localhost:3007
NEXTAUTH_SECRET=troque_para_um_segredo_longo_e_seguro
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

3. Prepare banco e seed:

```bash
npm run db:push
npm run db:seed
```

4. Rode a aplicação:

```bash
npm run dev
```

Acesse `http://localhost:3007`.

## Rodando com Docker

O Compose usa credenciais locais isoladas (`COMPOSE_*`) para não misturar variáveis de deploy do `.env` com o Postgres local.

```bash
docker compose up -d --build
```

Acesse `http://localhost:3007`.

Comandos úteis:

```bash
docker compose ps
docker compose logs -f web
docker compose down
```

Se um volume antigo de Postgres tiver credenciais incompatíveis, pare e remova os volumes somente se puder perder os dados locais:

```bash
docker compose down -v
docker compose up -d --build
```

## Deploy no Coolify

Use o build pack **Dockerfile** e exponha a porta `3007`.

No recurso PostgreSQL do Coolify, copie a **Internal URL** do banco e configure a aplicação com:

```env
DATABASE_URL=postgresql://USUARIO:SENHA_URL_ENCODED@HOST_INTERNO_REAL:5432/catalogdb?schema=public
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=troque_para_um_segredo_longo_e_seguro
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

A variável `DATABASE_URL` é obrigatória no Coolify. Não deixe `HOST_INTERNO_DO_POSTGRES`, `USER` ou `SENHA_URL_ENCODED` no valor de `DATABASE_URL`; esses nomes são apenas exemplos.

Se a senha tiver caracteres especiais, use a URL interna já copiada do Coolify ou codifique caracteres como `@` para `%40`.

Se preferir, configure variáveis separadas:

```env
DATABASE_HOST=HOST_INTERNO_REAL
DATABASE_PORT=5432
DATABASE_USER=USUARIO
DATABASE_PASSWORD=SENHA_SEM_URL_ENCODE
DATABASE_NAME=catalogdb
```

Se o log mostrar `Can't reach database server at postgresql-xxxx:5432`, o app não está conseguindo acessar a rede interna do banco. Nesse caso, coloque app e PostgreSQL no mesmo projeto/ambiente/rede do Coolify ou habilite acesso público no PostgreSQL e configure uma URL pública como fallback:

```env
DATABASE_PUBLIC_URL=postgresql://USUARIO:SENHA_URL_ENCODED@HOST_PUBLICO:PORTA_PUBLICA/catalogdb?schema=public
```

Na inicialização, a aplicação tenta `DATABASE_URL` primeiro e, se a conexão falhar, tenta `DATABASE_PUBLIC_URL`, `DATABASE_FALLBACK_URL` ou `COOLIFY_DATABASE_URL` quando essas variáveis existirem.

## Scripts

- `npm run dev`: inicia Next em `localhost:3007`.
- `npm run build`: gera build de produção.
- `npm run start`: inicia produção em `localhost:3007`.
- `npm run lint`: executa ESLint.
- `npm run prisma:generate`: gera Prisma Client.
- `npm run db:push`: aplica schema no banco.
- `npm run db:seed`: cria admin, categorias padrão e banner padrão.

## Admin

- URL: `http://localhost:3007/admin`
- E-mail: `admin@catalog.com`
- Senha: `admin123`

## Health check

```bash
curl http://localhost:3007/api/health
```

Retorna `healthy` quando o app consegue conectar ao banco.
