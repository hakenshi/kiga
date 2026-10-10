# Kiga

> Aplicativo de Terapia Cognitivo-Comportamental (TCC) focado em simplicidade, flexibilidade e privacidade absoluta.

O **Kiga** é um software de registro e acompanhamento de pensamentos, emoções, atividades e humor. Inspirado no Cogni, porém desenhado com interface moderna, flexibilidade para gerenciar registros e uma arquitetura *local-first* orientada à privacidade.

---

## 🔒 Princípios de Privacidade

1. **Local-First por Padrão**: Todos os dados (pensamentos, registros, humor) vivem no banco SQLite local do próprio dispositivo móvel.
2. **Zero-Knowledge**: O servidor não tem acesso aos pensamentos dos usuários.
3. **Backup Criptografado Opcional**: O usuário pode optar por criar uma conta para sincronizar backups em nuvem. O banco de dados do celular é criptografado antes de ser enviado ao servidor.

---

## 🏗️ Arquitetura do Monorepo

O projeto é estruturado como um monorepo gerenciado com [Turborepo](https://turbo.build/) e [Bun](https://bun.sh/):

```
kiga/
├── apps/
│   ├── api/        # Backend enxuto (Hono + Better Auth + Drizzle ORM + Bun)
│   └── mobile/     # App mobile (React Native + Expo Router + Drizzle ORM + Expo SQLite)
├── packages/       # Pacotes compartilhados futuros
├── package.json    # Scripts globais do monorepo
└── turbo.json      # Configuração de build e pipeline do Turbo
```

---

## 🚀 Começando

### Pré-requisitos

* [Bun](https://bun.sh/) (>= 1.2)
* [Node.js](https://nodejs.org/) (recomendado LTS)
* Android Studio / Xcode (para desenvolvimento mobile)

### Instalação

```bash
bun install
```

### Rodando em Desenvolvimento

Inicia a API e o aplicativo Mobile simultaneamente:

```bash
bun run dev
```

Ou execute individualmente:

```bash
# Rodar apenas a API
bun --filter @kiga/api dev

# Rodar apenas o Mobile (Expo)
bun --filter @kiga/mobile dev
```

---

## 🗄️ Banco de Dados & Drizzle ORM

Cada aplicação possui seu próprio banco SQLite e configuração do Drizzle:

| Comando | Descrição |
| :--- | :--- |
| `bun run db:push` | Aplica alterações do schema diretamente no banco da API |
| `bun run db:generate` | Gera arquivos de migração SQL para a API |
| `bun run db:studio` | Abre o Drizzle Studio para visualizar dados da API |
| `bun run db:mobile:generate` | Gera novas migrações SQL para o app Mobile (Expo) |

---

## 🧪 Qualidade de Código

```bash
# Typecheck em todos os workspaces
bun run check-types

# Linter (oxlint ultrarrápido)
bun run lint
```
