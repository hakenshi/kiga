# Kiga Pro — Painel do Profissional de Saúde (TCC)

Documento de especificação de produto, modelo de negócio e arquitetura técnica para a expansão B2B2C do **Kiga**.

---

## 1. Visão Geral & Proposta de Valor

O **Kiga Pro** é uma plataforma web voltada para psicólogos e terapeutas cognitivo-comportamentais (TCC) acompanharem os registros semanais de seus pacientes entre as sessões de terapia.

### O Problema que Resolve
- **Para o Psicólogo:** Pacientes esquecem o que sentiram ao longo dos 7 dias entre as consultas. Os primeiros 10 a 15 minutos da sessão são desperdiçados tentando resgatar memórias vagas (*"Acho que quarta fiquei meio mal..."*).
- **Para o Paciente:** Não precisa entregar o celular físico para o terapeuta ficar lendo, mantendo total privacidade e conforto.

---

## 2. Modelo de Negócio (SaaS B2B2C)

| Item | Detalhe |
| :--- | :--- |
| **Público Pagante** | Psicólogos clínicos, terapeutas TCC e psiquiatras. |
| **Preço Sugerido** | **R$ 49,90 / mês** (ou R$ 479,00/ano no plano anual). |
| **Capacidade Base** | Até 30 pacientes ativos inclusos por assinatura. |
| **Preço pro Paciente** | **100% Gratuito** (o paciente nunca paga para usar ou ser acompanhado). |
| **CAC (Custo de Aquisição)** | Próximo de zero para pacientes — cada psicólogo atua como canal orgânico de distribuição. |
| **Retenção (LTV/Churn)** | Altíssima: uma vez integrado à rotina clínica semanal do consultório, a taxa de cancelamento é mínima. |

---

## 3. Experiência & Privacidade do Paciente (Mobile)

A confiança e a segurança do paciente são a premissa fundamental do Kiga:

### 3.1. Vínculo Simples e Seguro
1. No consultório ou por WhatsApp, o terapeuta compartilha um **Link de Convite**, **QR Code** ou **Código de 6 dígitos**.
2. No app Kiga, o paciente acessa `Perfil > Meu Terapeuta`, insere o código e confirma o vínculo com o nome e CRP do profissional.
3. O paciente pode revogar o acesso do terapeuta com 1 toque a qualquer momento.

### 3.2. Controle Granular de Privacidade
- **Chave de compartilhamento por post:** Cada registro tem um toggle sutil:
  - 🟢 *Compartilhar com meu terapeuta* (padrão quando vinculado).
  - 🔒 *Apenas para mim* (para desabafos ultra íntimos que o paciente ainda não quer levar para a sessão).
- **Criptografia e Sigilo:** Registros trafegam criptografados e cumprem integralmente as diretrizes do CFP (Conselho Federal de Psicologia) e LGPD.

---

## 4. Funcionalidades da Dashboard Web (Para o Profissional)

Aberto no navegador do consultório antes ou durante os atendimentos:

### 4.1. Visão do Paciente (Timeline Semanal)
- **Filtro Temporal:** Últimos 7 dias, últimos 14 dias ou período personalizado entre sessões.
- **Gráfico de Flutuação de Humor:** Linha do tempo visual indicando picos emocionais e dias críticos.
- **Feed Cronológico de Registros:**
  - Texto da situação.
  - Tags de Pensamentos Automáticos identificados.
  - Emoções e intensidade.
  - Reações fisiológicas / corporais (ex: taquicardia, tensão muscular).
  - Comportamentos executados.
- **Threads de Reestruturação:** Visualização destacada de botões **"Continuar"** (respostas do paciente horas depois) para analisar se houve mudança de perspectiva.

### 4.2. Insights Clínicos Automáticos
- **Top Emoções da Semana:** (ex: 60% Ansiedade, 25% Frustração, 15% Alívio).
- **Gatilhos Recorrentes:** Identificação de horários ou dias da semana com maior incidência de pensamentos disfuncionais.
- **Anotações Privadas da Sessão:** Bloco de notas do terapeuta (visível apenas para o profissional) para registrar objetivos terapêuticos e hipóteses clínicas.

---

## 5. Roteiro de Perguntas para Validar com sua Psicóloga

Aproveite a próxima sessão para sondar o interesse clínico de forma natural:

1. *"Você costuma pedir pros seus pacientes anotarem os pensamentos durante a semana num diário ou RPD de papel?"*
2. *"Quanto tempo da nossa sessão você acha que a gente gasta só tentando lembrar o que aconteceu nos últimos 7 dias?"*
3. *"Se você tivesse um painel web limpo no seu computador onde pudesse bater o olho nos meus relatos da semana antes de eu entrar na sala, isso te ajudaria a direcionar melhor a sessão?"*
4. *"Você pagaria uns R$ 50 por mês numa ferramenta assim se ela te ajudasse a organizar os registros de todos os seus pacientes?"*

---

## 6. Arquitetura Técnica Sugerida (Monorepo Kiga)

```
kiga/
├── apps/
│   ├── mobile/         # App Expo / React Native (Pacientes)
│   ├── api/            # API Backend (Drizzle ORM, autenticação e sincronização)
│   └── web/            # Novo app Next.js (Dashboard Web do Psicólogo)
└── packages/
    ├── schema/         # Schemas compartilhados (Drizzle / Zod)
    └── api/            # Clientes de API compartilhados
```

### Tabelas do Banco de Dados a Implementar Futuramente:
- `therapists`: Cadastro do profissional, CRP, plano e dados de assinatura (Stripe / Asaas).
- `therapist_invites`: Códigos e tokens de convite para pacientes.
- `patient_therapist_links`: Vínculo ativo, status e data de autorização.
- `entry_shares`: Controle de quais entradas o paciente permitiu compartilhar com o terapeuta.
