# Testes de Interface com Maestro

O [Maestro](https://maestro.mobile.dev/) é o framework de testes E2E do projeto para automação de interface no Android e iOS.

## Comandos Rápidos

```bash
# Rodar todos os fluxos de teste no emulador conectado
bun test:e2e

# Rodar um fluxo específico
bun maestro test tests/e2e/login-validation.yaml

# Abrir o Maestro Studio (Inspector visual no navegador - igual ao Playwright Codegen)
bun maestro:studio
```

## Como funciona

Por padrão, os testes usam `APP_ID=host.exp.exponent` (Expo Go). Caso esteja usando uma build de desenvolvimento / standalone (`com.kiga.mobile`), basta passar a variável de ambiente:

```bash
APP_ID=com.kiga.mobile maestro test tests/e2e/login-validation.yaml
```

## Maestro Studio

O **Maestro Studio** é a ferramenta interativa mais poderosa do Maestro:
1. Deixe o emulador com o app aberto.
2. Execute `bun maestro:studio`.
3. Abra a URL exibida no navegador (geralmente `http://localhost:9999`).
4. Você verá o espelho da tela do celular. Clique nos botões ou campos e ele gerará os comandos do teste automaticamente.
