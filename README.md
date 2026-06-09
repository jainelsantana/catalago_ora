# Catálogo ORA - Admin Dashboard

Este é um sistema de gerenciamento de catálogo desenvolvido com Next.js. A aplicação permite o gerenciamento completo (CRUD) de produtos e categorias, incluindo suporte a upload de múltiplas imagens e controle de estoque.

## Requisitos do Sistema

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js**: Versão 20.9.0 ou superior.
- **Gerenciador de Pacotes**: npm, yarn, pnpm ou bun.

## Tecnologias Principais

- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Validação de Dados**: Zod
- **Formulários**: React Hook Form
- **Estado Assíncrono**: TanStack Query (React Query)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React

## Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto e configure as variáveis necessárias. Para Docker Compose, use o host `db` porque o Next.js roda na mesma rede do Postgres:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=catalogdb
DATABASE_URL="postgresql://postgres:postgres@db:5432/catalogdb?schema=public"
NEXTAUTH_SECRET="seu_segredo_para_autenticacao"
NEXTAUTH_URL="http://localhost:3007"
NEXT_PUBLIC_UPLOAD_API_URL="/api/upload"
```

Se rodar `npm run dev` direto na máquina, troque apenas o host da URL para `localhost`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/catalogdb?schema=public"
```

Em produção fora do Docker Compose, use `localhost` ou o IP real do Postgres. O host `db` só existe para containers na rede do Compose.

Se o deploy mantiver `DATABASE_URL` com `@db:5432`, defina também o host real do Postgres:

```env
DATABASE_FALLBACK_HOST=catalogo.ora.dev.br
```

## Getting Started

1. **Instale as dependências:**
```bash
npm install
```

2. **Inicie o servidor de desenvolvimento:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3007](http://localhost:3007) with your browser to see the result.

## Rodando com Docker

Antes de subir, confirme que o Docker Desktop não está pausado. Se aparecer erro como `Can't reach database server at db:5432`, abra o Docker Desktop e use **Resume/Restart**, ou rode:

```bash
docker desktop restart
```

1. **Suba a aplicação, o banco e o seed inicial:**
```bash
docker compose up -d --build
```

2. **Acesse a aplicação:**
Abra [http://localhost:3007](http://localhost:3007) no navegador.

3. **Veja os logs:**
```bash
docker compose logs -f web
```

4. **Pare os containers:**
```bash
docker compose down
```

## Deploy no Coolify

Se o deploy for por Dockerfile, o container executa automaticamente:

```bash
prisma db push --skip-generate
node prisma/seed.js
node server.js
```

Configure as variáveis como Runtime Variables no Coolify:

```env
DATABASE_URL=postgresql://postgres:SENHA@HOST_DO_POSTGRES:5432/catalogdb?schema=public
NEXTAUTH_URL=https://catalogo.ora.dev.br
NEXTAUTH_SECRET=um_segredo_longo
```

Não defina `RUNNING_IN_DOCKER=true` nem `USE_COMPOSE_DATABASE_HOST=true` em deploy por Dockerfile. Essas variáveis são usadas apenas no `docker-compose.yml` deste projeto.

## Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento.
- `npm run build`: Cria a versão de produção da aplicação.
- `npm run start`: Inicia o servidor em modo produção.
- `npm run lint`: Executa a verificação de regras do linter.

## Acesso Administrativo

Para gerenciar o catálogo de produtos e categorias, acesse a área restrita:

- **Link de Acesso:** [http://localhost:3007/admin](http://localhost:3007/admin)
- **Credenciais de Teste:**
  - **E-mail:** `admin@catalog.com`
  - **Senha:** `admin123` (ou a senha configurada no seu provedor de autenticação)

---

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


JPS
