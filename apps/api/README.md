# @kiga/api

Backend minimalista e enxuto do Kiga, construído com [Hono](https://hono.dev/), [Better Auth](https://www.better-auth.com/) e [Drizzle ORM](https://orm.drizzle.team/) sobre o runtime [Bun](https://bun.sh/).

---

## 🎯 Objetivo & Escopo

A API foi projetada com foco em **simplicidade e privacidade**.

* **O que a API faz**:
  * Autenticação segura de usuários que optarem por criar conta ([Better Auth](https://www.better-auth.com/)).
  * Armazenamento de backups criptografados do banco SQLite local de cada usuário.
* **O que a API NÃO faz**:
  * Não processa nem tem acesso aos pensamentos, humor ou registros em texto puro. O conteúdo chega ao servidor já criptografado pelo cliente (*zero-knowledge*).

---

## 🛠️ Stack Tecnológica

* **Runtime**: [Bun](https://bun.sh/)
* **Framework Web**: [Hono](https://hono.dev/)
* **Autenticação**: [Better Auth](https://www.better-auth.com/) com adaptador Drizzle
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/) com driver nativo `bun:sqlite`
* **Migrations / Kit**: [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) com `@libsql/client`

---

## 📁 Estrutura

```
apps/api/
├── lib/
│   ├── auth/          # Configuração do Better Auth
│   └── db/
│       ├── schema.ts       # Export central de schemas
│       ├── auth-schema.ts  # Tabelas do Better Auth (user, session, account...)
│       └── index.ts        # Instância Drizzle conectada ao bun:sqlite
├── src/
│   └── index.ts       # Servidor HTTP Hono e rotas de autenticação
├── drizzle.config.ts  # Configuração de migração do Drizzle Kit
└── package.json
```

---

## 🚀 Comandos

```bash
# Rodar servidor com hot-reload
bun run dev

# Aplicar schema ao banco SQLite local
bun run db:push

# Gerar migrações SQL
bun run db:generate

# Drizzle Studio (UI visual do banco)
bun run db:studio

# Validação de tipos e lint
bun run check-types
bun run lint
```
