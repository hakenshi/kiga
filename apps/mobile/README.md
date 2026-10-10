# @kiga/mobile

Aplicativo móvel do Kiga construído com [React Native](https://reactnative.dev/), [Expo](https://expo.dev/) (Expo Router) e [Drizzle ORM](https://orm.drizzle.team/) sobre [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/).

---

## 📱 Visão Geral

O Kiga Mobile é o cliente *local-first* para registro e acompanhamento de pensamentos, sentimentos, atividades e humor (TCC). Todos os dados do usuário são mantidos primariamente no dispositivo em um banco SQLite embutido.

---

## 🛠️ Stack Tecnológica

* **Framework**: [Expo](https://expo.dev/) (~57) com [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
* **Banco Local**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-orm/expo-sqlite`)
* **Migrações**: [Drizzle Kit](https://orm.drizzle.team/) gerando migrações embutidas no bundle (`babel-plugin-inline-import`)

---

## 📁 Estrutura

```
apps/mobile/
├── src/
│   ├── app/           # Rotas do Expo Router (_layout.tsx, index.tsx)
│   └── lib/
│       └── db/
│           ├── schema.ts   # Schemas das tabelas locais (thoughts, etc.)
│           └── index.ts    # Instância do Drizzle com openDatabaseSync
├── drizzle/           # Migrações geradas pelo drizzle-kit (SQL e migrations.js)
├── drizzle.config.ts  # Configuração do Drizzle Kit com driver: 'expo'
└── babel.config.js    # Plugin inline-import para carregar arquivos .sql
```

---

## 🗄️ Fluxo de Migrações no Mobile

No Expo, as migrações SQL são executadas dentro do aparelho do usuário:

1. Altere ou crie tabelas em `src/lib/db/schema.ts`.
2. Gere a migração com:
   ```bash
   bun run db:generate
   ```
3. O `drizzle-kit` cria o arquivo `.sql` e atualiza o `drizzle/migrations.js`.
4. Ao abrir o app, o hook `useMigrations(db, migrations)` em `src/app/_layout.tsx` executa as migrações pendentes automaticamente.

---

## 🚀 Comandos

```bash
# Iniciar ambiente Expo
bun run dev

# Rodar no emulador Android
bun run android

# Rodar no simulador iOS
bun run ios

# Gerar migrações do banco local
bun run db:generate

# Validação de tipos e lint
bun run check-types
bun run lint
```
