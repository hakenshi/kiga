# Testes de interface com Maestro

**Use somente um emulador dedicado a testes. Os fluxos usam `clearState: true`,
apagando contas, notas e rascunhos do app nesse dispositivo.**

Instale uma build atual de `com.kiga.mobile` no emulador. Os fluxos não usam Expo Go.
Uma development build precisa do Metro em execução; uma build standalone não.
Não use um APK antigo para validar alterações recentes.

Na raiz do repositório:

```bash
bun run test:e2e
```

Em `apps/mobile`, para executar ou verificar um fluxo:

```bash
maestro test tests/e2e/thread-flow.yaml
maestro check-syntax tests/e2e/thread-flow.yaml
bun run maestro:studio
```

## Fluxos

- `navigation-flow.yaml`: início, cadastro e login offline.
- `login-validation.yaml`: campos inválidos e credenciais inexistentes.
- `register-validation.yaml`: cadastro por etapas, confirmação de senha e teclado do PIN.
- `protected-route.yaml`: bloqueio da área privada sem sessão.
- `thread-flow.yaml`: cria uma nota, salva duas respostas e confere a conversa após reabrir o app.

Os vínculos de humor, emoções, pensamentos, reações, comportamentos e imagens de
cada resposta são verificados com SQLite real na suíte de integração.
Validar sintaxe dos fluxos não equivale a executá-los em um dispositivo.
