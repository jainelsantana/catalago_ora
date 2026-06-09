# Deploy no Coolify

## Configuração do projeto
- Build type: `Dockerfile`
- Porta exposta: `3007`
- CMD de produção: `node scripts/start-production.js`

## Variáveis de ambiente necessárias
No Coolify, configure as variáveis do app:

```env
DATABASE_URL=postgresql://USUARIO:SENHA_URL_ENCODED@HOST_INTERNO_REAL:5432/catalogdb?schema=public
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=troque_para_um_segredo_longo_e_seguro
NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

### Regras importantes
- `DATABASE_URL` deve ser a **Internal URL** do recurso PostgreSQL do Coolify.
- Não use `db`, `localhost`, `127.0.0.1`, `HOST_INTERNO_DO_POSTGRES`, `USER` ou `SENHA_URL_ENCODED` literais.
- Se a senha tiver caracteres especiais, use a URL interna do Coolify ou codifique os caracteres.
- `NEXTAUTH_URL` precisa ser o domínio público do app.
- `NEXTAUTH_SECRET` deve ser um segredo forte e exclusivo.

## Opcional
Se preferir não usar `DATABASE_URL`, a aplicação aceita também:

```env
DATABASE_HOST=HOST_INTERNO_REAL
DATABASE_PORT=5432
DATABASE_USER=USUARIO
DATABASE_PASSWORD=SENHA_SEM_URL_ENCODE
DATABASE_NAME=catalogdb
```

## Quando o app não alcança `postgresql-xxxx:5432`

Esse host é interno do Docker/Coolify. Ele só funciona se a aplicação e o PostgreSQL estiverem na mesma rede interna. Se aparecer:

```text
Can't reach database server at `postgresql-g04ks8c:5432`
```

faça uma destas opções:

1. Coloque a aplicação e o banco no mesmo projeto/ambiente/rede do Coolify e use a **Internal URL**.
2. Habilite acesso público no PostgreSQL do Coolify e configure no app:

```env
DATABASE_PUBLIC_URL=postgresql://USUARIO:SENHA_URL_ENCODED@HOST_PUBLICO:PORTA_PUBLICA/catalogdb?schema=public
```

A aplicação tenta `DATABASE_URL` primeiro. Se a conexão falhar, ela tenta automaticamente `DATABASE_PUBLIC_URL`, `DATABASE_FALLBACK_URL` ou `COOLIFY_DATABASE_URL`, se alguma delas estiver configurada.

## Health check
A URL de health check deve apontar para:

```text
http://<seu-dominio>/api/health
```

## Observações
- O arquivo `.env.example` agora já mostra um exemplo de `DATABASE_URL` para Coolify.
- A aplicação espera que o banco esteja acessível pelo host interno do Coolify no tempo de execução.
