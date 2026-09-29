# Compass Hub — Arquitetura do MVP

## 1. Objetivo arquitetural

O Compass Hub será uma central interna de inteligência sobre a carteira de clientes da Compass. A arquitetura deve favorecer dois resultados mensuráveis:

- um sócio entende a situação da carteira em menos de 60 segundos;
- um colaborador registra a atualização semanal de um cliente em 2 a 5 minutos.

O sistema não será um ERP, gerenciador de tarefas, CRM comercial ou substituto das plataformas de mídia.

## 2. Decisões principais

| Área | Decisão | Motivo |
| --- | --- | --- |
| Aplicação | Next.js com App Router e TypeScript | Frontend e backend no mesmo projeto, com baixo custo operacional |
| UI | Tailwind CSS e shadcn/ui adaptado | Componentes acessíveis sem impor uma identidade genérica |
| Dados | Supabase PostgreSQL com acesso direto | Integração simples com Auth, Storage, migrations SQL e RLS |
| Autenticação | Supabase Auth | Login, recuperação de senha e sessões seguras |
| Arquivos | Buckets privados no Supabase Storage | Contratos e documentos não devem possuir URLs públicas permanentes |
| Formulários | React Hook Form e Zod | Validação consistente no cliente e no servidor |
| Gráficos | Recharts, apenas onde necessário | Biblioteca leve e suficiente para o MVP |
| Testes | Vitest e Playwright | Regras de domínio e fluxos críticos cobertos separadamente |

Não será utilizado Prisma no MVP. O acesso direto ao Supabase evita uma segunda camada de autorização, mantém o RLS como fonte de segurança e reduz o volume de infraestrutura.

## 3. Identidade visual como fundação

A especificação visual própria da Compass prevalece sobre referências genéricas de SaaS.

- Fundo principal claro: `--compass-paper` (`#F3EDE2`).
- Áreas institucionais escuras: `--compass-deep-brown` (`#1A100B`).
- Texto principal: `--compass-ink` (`#160D09`).
- Destaque primário: `--compass-purple` (`#682A7C`), usado com moderação.
- Valores HEX serão definidos somente nos tokens do tema.
- Componentes de domínio usarão tokens semânticos, nunca cores diretas.
- Estados funcionais terão verde, âmbar, vermelho, azul e cinza em versões pouco saturadas.

## 4. Organização proposta

```text
.
├── docs/
│   ├── ARCHITECTURE.md
│   └── DATABASE.md
├── public/
│   └── brand/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── update-password/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── clients/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   │       ├── overview/
│   │   │   │       ├── goals/
│   │   │   │       ├── metrics/
│   │   │   │       ├── updates/
│   │   │   │       ├── contract/
│   │   │   │       └── documents/
│   │   │   ├── updates/
│   │   │   ├── pending/
│   │   │   └── settings/
│   │   │       └── users/
│   │   ├── auth/callback/
│   │   ├── error.tsx
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── features/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── contracts/
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── goals/
│   │   ├── metrics/
│   │   ├── pending/
│   │   ├── services/
│   │   ├── updates/
│   │   └── users/
│   ├── lib/
│   │   ├── auth/
│   │   ├── constants/
│   │   ├── formatters/
│   │   ├── permissions/
│   │   ├── supabase/
│   │   └── validations/
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── database.generated.ts
├── supabase/
│   ├── migrations/
│   ├── tests/
│   ├── config.toml
│   └── seed.sql
├── tests/
│   ├── e2e/
│   └── fixtures/
└── .env.example
```

### Regras de organização

- `app` contém rotas, layouts e composição de página; regras de negócio ficam fora dela.
- `features` agrupa componentes, consultas, ações e schemas por domínio.
- `components/ui` contém primitivas visuais; `components/shared` contém componentes reutilizados entre domínios.
- Operações privilegiadas ficam em código exclusivo de servidor.
- Consultas usadas por várias telas são centralizadas por domínio.
- Arquivos devem permanecer pequenos; componentes de página não acumulam validação, consulta e apresentação no mesmo módulo.

## 5. Rotas do MVP

| URL | Finalidade |
| --- | --- |
| `/login` | Login |
| `/forgot-password` | Solicitação de recuperação |
| `/update-password` | Definição de nova senha |
| `/dashboard` | Visão da carteira ou visão personalizada do colaborador |
| `/clients` | Lista, busca e filtros |
| `/clients/new` | Cadastro em seções curtas |
| `/clients/[id]/overview` | Resumo do cliente |
| `/clients/[id]/goals` | Objetivos e progresso |
| `/clients/[id]/metrics` | Ponto de partida e histórico de métricas |
| `/clients/[id]/updates` | Atualizações e timeline |
| `/clients/[id]/contract` | Contrato e escopo |
| `/clients/[id]/documents` | Documentos do cliente |
| `/updates` | Feed global |
| `/pending` | Acompanhamentos, contratos e objetivos pendentes |
| `/settings/users` | Gestão de usuários por administradores |

`/clients/[id]` redirecionará para `/clients/[id]/overview`.

## 6. Fronteiras dos domínios

### Clientes

Mantém dados institucionais, status operacional, saúde atual, contatos, serviços e responsáveis.

### Contratos

Mantém vigência, renovação, situação, escopo incluído e excluído. Informações financeiras são isoladas em uma tabela protegida.

### Métricas e objetivos

Métricas registram uma linha de base e uma série histórica. Objetivos podem se conectar a uma métrica para calcular progresso.

### Atualizações

Uma atualização semanal guarda o relato, bloqueios, resultados, próximos passos e a saúde informada naquele momento. Os resultados destacados ficam em registros filhos.

### Pendências

Não é uma entidade própria. É uma leitura derivada de atualizações, contratos, objetivos, status e saúde.

### Auditoria

Registra alterações sensíveis sem fazer parte do fluxo de edição normal.

## 7. Regras de domínio consolidadas

### Status e saúde

São conceitos separados:

- status operacional: `ONBOARDING`, `ACTIVE`, `PAUSED`, `CLOSED`;
- saúde: `HEALTHY`, `ATTENTION`, `CRITICAL`.

A saúde pode ficar vazia em onboarding, pausado ou encerrado. Na interface, onboarding, pausado e encerrado continuam aparecendo com seus badges próprios.

### Atualizações atrasadas

- Aplica-se a clientes `ACTIVE` e, quando já houver operação ativa, `ONBOARDING`.
- Mais de 7 dias sem atualização: alerta de atenção.
- Mais de 14 dias: alerta crítico de acompanhamento.
- O alerta não altera a saúde automaticamente.
- Um cliente sem nenhuma atualização usa sua data de entrada como referência inicial.

### Contratos vencendo

- Somente contratos `ACTIVE` ou `IN_RENEWAL`.
- Data final entre hoje e os próximos 30 dias, inclusive.
- Contratos sem data final não entram nesse alerta.

### Objetivos atrasados

- Prazo anterior à data atual.
- Status `NOT_STARTED` ou `IN_PROGRESS`.

### Progresso

- `INCREASE`: `(atual - inicial) / (meta - inicial)`.
- `DECREASE`: `(inicial - atual) / (inicial - meta)`.
- O valor exibido fica entre 0% e 100%.
- Metas já superadas podem receber um indicador textual sem expandir a barra além de 100%.
- Divisão por zero e metas sem valores suficientes resultam em progresso indisponível, não em erro.

### Próxima ação

A próxima ação exibida no dashboard vem da atualização semanal mais recente. Não será copiada para `clients`, evitando fontes conflitantes.

## 8. Modelo de autorização

| Ação | Administrador | Colaborador |
| --- | --- | --- |
| Visualizar clientes e dados operacionais | Todos | Todos |
| Criar, editar, arquivar cliente | Sim | Não |
| Gerenciar serviços e responsáveis | Sim | Não |
| Ver vigência e escopo | Sim | Sim |
| Ver valores financeiros | Sim | Não |
| Ver PDF de contrato | Sim | Não |
| Ver documentos operacionais | Sim | Sim |
| Enviar documentos operacionais | Sim | Apenas clientes atribuídos |
| Criar atualização semanal | Sim | Apenas clientes atribuídos |
| Atualizar métricas | Sim | Apenas clientes atribuídos |
| Alterar saúde | Sim | Apenas clientes atribuídos, por operação controlada |
| Gerenciar objetivos | Sim | Atualização operacional em clientes atribuídos |
| Gerenciar usuários | Sim | Não |
| Consultar auditoria | Sim | Não |

O MVP permite que colaboradores visualizem a carteira, mas restringe alterações aos clientes dos quais são membros. Essa regra favorece colaboração sem permitir mudanças indevidas.

## 9. Segurança

- Toda tabela de negócio terá RLS habilitado.
- Funções auxiliares `is_admin()` e `is_client_member(client_id)` centralizarão as políticas.
- Nenhuma chave `service_role` será exposta ao navegador.
- Criação de usuários será executada por uma ação de servidor exclusiva para administradores.
- A tabela financeira terá política de leitura apenas para administradores.
- PDFs de contratos terão políticas diferentes dos documentos operacionais.
- Uploads guardarão caminho do objeto, tipo MIME, tamanho e autor; a URL será assinada sob demanda.
- Alteração de saúde feita por colaborador passará por função controlada, sem liberar edição irrestrita da linha do cliente.
- Validação Zod ocorrerá antes das gravações e restrições SQL protegerão o banco independentemente da interface.
- CNPJ e telefones serão normalizados antes do armazenamento.

## 10. Estratégia de consulta

- Páginas são renderizadas no servidor por padrão.
- Componentes de cliente são usados apenas para interações, filtros e formulários.
- KPIs e pendências serão calculados por consultas ou views específicas, evitando carregar toda a carteira no navegador.
- Paginação será aplicada à lista de clientes, feed global e auditoria.
- Índices serão criados para status, saúde, datas de contrato, atualização semanal, responsáveis e métricas.
- Tipos TypeScript serão gerados a partir do schema Supabase depois das migrations.

## 11. Responsividade

- Desktop e notebook usarão sidebar fixa/colapsável e tabelas.
- Tablet utilizará sidebar recolhida e colunas reduzidas.
- Celular converterá tabelas em listas de cards e priorizará visão geral, próxima ação e atualização semanal.
- O formulário semanal será uma única experiência curta, sem wizard desnecessário.

## 12. Sequência após esta definição

1. Inicializar o projeto e configurar qualidade de código.
2. Implementar tokens Compass e o shell visual.
3. Criar migrations, seeds de catálogos e testes de RLS.
4. Integrar Auth e proteção das rotas.
5. Construir os módulos na ordem definida no plano do projeto.

Cada etapa deve terminar com build, testes relevantes e verificação visual antes da próxima.
