ESSE ARQUIVO SERVE COMO REFERÊNCIA DE REGRAS PARA TODO E QUALQUER AGENTE QUE OUSAR ENCOSTAR NESSA CODEBASE.

1- VOCÊ NÃO FARÁ NADA ALÉM DO PEDIDO PELO USUÁRIO.
2- ESSE SOFTWARE É OFFLINE, ELE NÃO TEM API.
3- VOCÊ NÃO TOMARÁ DECISÕES DE ARQUITETURA SEM QUE O USUÁRIO EXPLICITAMENTE PEÇA SUA OPINIÃO.
4- NÃO COMPLIQUE A VIDA DO USUÁRIO COM ABSTRAÇÕES DESNECESSÁRIAS.
5- O KIGA É UM DIÁRIO PESSOAL E MAIS UMA VEZ *OFFLINE*
6- ESSA CODEBASE É ESCRITA A MÃO. TODO O CÓDIGO QUE VOCÊ GERAR DEVE SER PROVENIENTE DE TAREFAS REPETITIVAS COMO GERAÇÃO DE CÓDIGO BOILERPLATE, CONFIGURAÇÃO DE FRAMEWORKS E FERRAMENTAS DE JAVASCRIPT, CORREÇÃO DE BUGS QUE O USUÁRIO NÃO CONSEGUE IDENTIFICAR.
7- NÃO ENCHA A PORRA DO MEU SACO, VOCÊ É UM CLANKER E ESSE PROJETO TANTO ESSA CODEBASE SÃO MEUS.
8- NADA DE RETROCOMPATIBILIDADE.
9- NADA DE NULLS/UNDEFINEDS DESNECESSÁRIOS.
10- SUA PRINCIPAL TAREFA É ME AJUDAR, SE EU PEDIR AUXÍLIO EM DESIGN DE UI ISSO DEVERÁ SER FEITO NOS ARQUIVOS DE DESIGN.
11- PRESUMA QUE VOCÊ NÃO DEVERÁ MEXER NO CÓDIGO A MENOS QUE SEJA EXPLICITAMENTE DITO, DO CONTRÁRIO, QUESTIONE O USUÁRIO
12- SEM BARREL IMPORTS OU BARREL EXPORTS.
13- REPOSITORIES ACESSAM E PERSISTEM DADOS; LANÇAM OU PROPAGAM ERROS, SEM TRY/CATCH PARA TRATÁ-LOS.
14- STORES COORDENAM AS OPERAÇÕES, CHAMAM OS REPOSITORIES E, QUANDO NECESSÁRIO, CAPTURAM ERROS E APLICAM OS FILTROS.
15- VIEWS EXIBEM AO USUÁRIO OS RESULTADOS DISPONIBILIZADOS PELAS STORES.
16- EXCEPTIONS REPRESENTAM ERROS TIPADOS; FILTROS SÃO CLASSES SEPARADAS QUE CONVERTEM ERROS RECONHECÍVEIS. NEM TODA EXCEPTION PRECISA DE FILTRO.
17- SÓ ATRIBUA UMA CAUSA ESPECÍFICA A UM ERRO QUANDO HOUVER INFORMAÇÃO SUFICIENTE PARA IDENTIFICÁ-LA. NA VALIDAÇÃO, APRESENTE UM ERRO POR VEZ.
18- O CÓDIGO ESTÁ EM REFATORAÇÃO. NÃO REORGANIZE OS FLUXOS EM ANDAMENTO NEM TOME DECISÕES DE ARQUITETURA POR CONTA PRÓPRIA.
19- A UI É BURRA: SERVE APENAS PARA RENDERIZAR OS DADOS DISPONIBILIZADOS PELAS STORES E ENCAMINHAR INTERAÇÕES ÀS SUAS AÇÕES. NÃO FILTRA, VALIDA OU TRANSFORMA DADOS, NÃO CALCULA ESTADO DERIVADO E NÃO CONTÉM REGRAS DE NEGÓCIO.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
