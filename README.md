# Catálogo ORA

Aplicação full-stack com Next.js 16 App Router para catálogo público, painel administrativo, upload de imagens, autenticação e APIs internas. O banco oficial do projeto é PostgreSQL via Prisma.

## Stack

- React 19
- Next.js 16 App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth Credentials
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS 4
- Docker multi-stage com `output: "standalone"`

## Banco de dados

O schema canônico do Prisma fica em `prisma/schema.prisma`.

As alterações do banco são versionadas em `prisma/migrations/`. A migration inicial do PostgreSQL é:

```text
prisma/migrations/20260618113000_init_postgresql/migration.sql
```

Use `prisma migrate` como fluxo padrão:

```bash
npm run db:migrate
npm run db:seed
```

Em produção, o script `scripts/start-production.js` espera o PostgreSQL responder, executa `prisma migrate deploy`, roda o seed e só então inicia o servidor Next.

## Rodando localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie um banco PostgreSQL local chamado `catalogdb`.

3. Configure `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/catalogdb?schema=public
NEXTAUTH_URL=http://localhost:3007
NEXTAUTH_SECRET=troque_para_um_segredo_longo_e_seguro
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

4. Aplique migrations e seed:

```bash
npm run db:migrate
npm run db:seed
```

5. Rode a aplicação:

```bash
npm run dev
```

Acesse `http://localhost:3007`.

## Migrando uma base existente

Se o PostgreSQL já tem as tabelas criadas anteriormente com `prisma db push`, marque a migration inicial como aplicada uma única vez:

```bash
npm run db:baseline:postgres
npm run db:deploy
npm run db:seed
```

Use esse baseline apenas quando a estrutura existente já corresponde ao schema atual. Para um banco novo, use `npm run db:migrate`.

## Produtos da planilha ORA

A planilha `Cópia de banco_precos_ora.xlsx` foi adaptada para o formato do cadastro da loja em `prisma/products.ora.json`.

Campos usados da planilha:

- `Fabricante`
- `Categoria`
- `Modelo`
- `Descricao`
- `Preco`

Campos ignorados porque não fazem parte do cadastro público da loja: fornecedor, NCM, pagamento, data, proposta e contato.

O seed cria as categorias da planilha e cadastra os produtos pelo `sku`. Produtos já existentes com o mesmo SKU não são sobrescritos, para preservar edições feitas no painel administrativo.

Foram importadas somente as linhas com produto real e preço positivo. Linhas de teste, linhas sem preço e linhas vazias ficaram fora do arquivo.

## Rodando com Docker

O Compose sobe dois serviços: `app` e `postgres`. O app acessa o PostgreSQL interno pelo host `postgres:5432`.

```bash
docker compose up -d --build
```

Acesse `http://localhost:3007`.

Credenciais locais do Compose:

```env
DATABASE_URL=postgresql://catalogadmin:SecurePassw0rd2024@postgres:5432/catalogdb?schema=public
POSTGRES_USER=catalogadmin
POSTGRES_PASSWORD=SecurePassw0rd2024
POSTGRES_DB=catalogdb
```

Comandos úteis:

```bash
docker compose ps
docker compose logs -f app
docker compose down
```

Se um volume antigo do Postgres tiver credenciais incompatíveis e você puder perder os dados locais:

```bash
docker compose down -v
docker compose up -d --build
```

## Deploy no Coolify

Use o build pack **Dockerfile** e exponha a porta `3007`.

No recurso PostgreSQL do Coolify, copie a **Internal URL** do banco e configure:

```env
DATABASE_URL=postgresql://USUARIO:SENHA_URL_ENCODED@HOST_INTERNO_REAL:5432/catalogdb?schema=public
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=troque_para_um_segredo_longo_e_seguro
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

Regras importantes:

- `DATABASE_URL` deve apontar para PostgreSQL.
- No Coolify, prefira a Internal URL quando app e banco estiverem na mesma rede.
- Não use `localhost`, `127.0.0.1`, `db`, `USER`, `SENHA_URL_ENCODED` ou `HOST_INTERNO_DO_POSTGRES` como valores literais.
- Se a senha tiver caracteres especiais, use a URL já copiada do Coolify ou codifique caracteres como `@` para `%40`.
- Se a variável contiver `$`, marque a variável como Literal no Coolify.

Como alternativa, a aplicação também aceita variáveis separadas para montar a URL:

```env
DATABASE_HOST=HOST_INTERNO_REAL
DATABASE_PORT=5432
DATABASE_USER=USUARIO
DATABASE_PASSWORD=SENHA_SEM_URL_ENCODE
DATABASE_NAME=catalogdb
```

Se o app não alcançar o host interno do PostgreSQL, coloque app e banco na mesma rede do Coolify ou configure uma URL pública de fallback:

```env
DATABASE_PUBLIC_URL=postgresql://USUARIO:SENHA_URL_ENCODED@HOST_PUBLICO:PORTA_PUBLICA/catalogdb?schema=public
```

## Scripts

- `npm run dev`: inicia Next em `localhost:3007`.
- `npm run build`: gera build de produção.
- `npm run start`: inicia produção em `localhost:3007`.
- `npm run lint`: executa ESLint.
- `npm run prisma:generate`: gera Prisma Client.
- `npm run db:migrate`: cria/aplica migrations em desenvolvimento.
- `npm run db:deploy`: aplica migrations em produção ou CI.
- `npm run db:baseline:postgres`: marca a migration inicial como aplicada em uma base PostgreSQL existente.
- `npm run db:push`: sincroniza schema sem histórico de migration; use só para protótipos.
- `npm run db:seed`: cria admin, categorias padrão, banner padrão e produtos de `prisma/products.ora.json`.

## Admin

- URL: `http://localhost:3007/admin`
- E-mail: `admin@catalog.com`
- Senha: `admin123`

Em deploys existentes, configure `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente e rode o deploy novamente para sincronizar o usuário admin.

## Health check

```bash
curl http://localhost:3007/api/health
```

Retorna `healthy` quando o app consegue conectar ao PostgreSQL.
