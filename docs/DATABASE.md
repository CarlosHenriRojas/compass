# Compass Hub — Modelo de Dados do MVP

## 1. Convenções

- Chaves primárias: `uuid` gerado por `gen_random_uuid()`.
- Datas e horas de auditoria: `timestamptz` em UTC.
- Datas de negócio: `date`.
- Valores monetários: `numeric(12,2)`.
- Métricas: `numeric(18,4)` para preservar precisão.
- Nomes do banco em inglês e `snake_case`.
- Registros históricos não usam exclusão em cascata indiscriminada.
- Tabelas editáveis possuem `created_at` e `updated_at` quando aplicável.
- URLs públicas permanentes não são armazenadas para arquivos privados; será guardado o `storage_path`.

## 2. Enums

| Enum | Valores |
| --- | --- |
| `app_role` | `ADMIN`, `COLLABORATOR` |
| `client_status` | `ONBOARDING`, `ACTIVE`, `PAUSED`, `CLOSED` |
| `health_status` | `HEALTHY`, `ATTENTION`, `CRITICAL` |
| `contract_status` | `ACTIVE`, `IN_RENEWAL`, `ENDED`, `PAUSED` |
| `goal_status` | `NOT_STARTED`, `IN_PROGRESS`, `ACHIEVED`, `PAUSED`, `CANCELLED` |
| `metric_direction` | `INCREASE`, `DECREASE`, `NEUTRAL` |
| `document_category` | `CONTRACT`, `BRIEFING`, `PLANNING`, `REPORT`, `CLIENT_MATERIAL`, `OTHER` |

Enums serão utilizados somente para conjuntos realmente fechados. Unidades de métricas permanecerão em uma tabela de catálogo para permitir extensões sem migration de enum.

## 3. Identidade e usuários

### `profiles`

Complementa `auth.users`; não substitui o Supabase Auth.

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK e FK para `auth.users.id` |
| `full_name` | text | obrigatório |
| `email` | citext | obrigatório, único, cópia de exibição sincronizada pelo servidor |
| `avatar_path` | text | opcional |
| `role` | app_role | obrigatório |
| `active` | boolean | padrão `true` |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

O usuário será desativado em vez de removido, preservando autoria e auditoria.

## 4. Clientes

### `clients`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | text | nome fantasia obrigatório |
| `legal_name` | text | opcional |
| `cnpj` | varchar(14) | somente dígitos, único quando preenchido |
| `segment` | text | opcional |
| `city` | text | opcional |
| `state` | char(2) | UF opcional |
| `website_url` | text | opcional |
| `instagram_url` | text | opcional |
| `google_business_url` | text | opcional |
| `logo_path` | text | caminho privado ou público controlado |
| `status` | client_status | obrigatório |
| `health_status` | health_status | opcional conforme status |
| `joined_at` | date | data de entrada na Compass |
| `acquisition_source` | text | origem do cliente |
| `sold_by_user_id` | uuid | FK opcional para `profiles` |
| `general_notes` | text | observações gerais |
| `internal_notes` | text | observações internas |
| `created_by` | uuid | FK para `profiles` |
| `archived_at` | timestamptz | exclusão lógica |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

Regras:

- `health_status` é obrigatório para cliente ativo e opcional nos demais estados.
- arquivamento não equivale ao status `CLOSED`; encerramento é uma situação de negócio, arquivamento remove o registro das listagens normais.

### `client_contacts`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `name` | text | obrigatório |
| `position` | text | opcional |
| `phone` | varchar(20) | normalizado |
| `email` | citext | opcional |
| `is_primary` | boolean | padrão `false` |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

Um índice único parcial garantirá no máximo um contato principal por cliente.

### `client_members`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `user_id` | uuid | FK para `profiles` |
| `responsibility` | text | função no cliente, opcional |
| `is_primary` | boolean | padrão `false` |
| `created_at` | timestamptz | automático |

Restrições:

- combinação `client_id + user_id` única;
- no máximo um membro principal por cliente;
- somente perfis ativos podem receber novas atribuições.

## 5. Serviços

### `services`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `name` | text | obrigatório e único |
| `description` | text | opcional |
| `active` | boolean | padrão `true` |
| `sort_order` | integer | ordenação de exibição |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

### `client_services`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `service_id` | uuid | FK para `services` |
| `scope_description` | text | escopo específico |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

A combinação `client_id + service_id` será única.

## 6. Contratos e finanças

### `contracts`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `start_date` | date | obrigatório |
| `end_date` | date | opcional |
| `automatic_renewal` | boolean | padrão `false` |
| `status` | contract_status | obrigatório |
| `scope_included` | text | o que fazemos |
| `scope_excluded` | text | o que não fazemos |
| `created_by` | uuid | FK para `profiles` |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

A duração é calculada pelas datas e não armazenada. A modelagem aceita histórico de contratos, embora o MVP apresente prioritariamente o contrato vigente.

### `contract_financials`

Tabela separada para impedir acesso financeiro por colaboradores.

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `contract_id` | uuid | PK e FK para `contracts` |
| `monthly_value` | numeric(12,2) | valor não negativo |
| `billing_day` | smallint | entre 1 e 31 |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

Somente administradores terão política de leitura ou escrita nessa tabela.

## 7. Documentos

### `documents`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `contract_id` | uuid | FK opcional para `contracts` |
| `name` | text | nome de exibição |
| `category` | document_category | obrigatório |
| `storage_bucket` | text | bucket permitido |
| `storage_path` | text | caminho único do objeto |
| `mime_type` | text | tipo validado |
| `size_bytes` | bigint | tamanho validado |
| `uploaded_by` | uuid | FK para `profiles` |
| `created_at` | timestamptz | automático |

Regras:

- categoria `CONTRACT` exige `contract_id`;
- PDFs de contrato ficam em caminho/política restrito a administradores;
- a aplicação cria URLs assinadas somente depois de autorizar a solicitação;
- exclusão do metadado e do objeto deve ocorrer em uma operação de servidor auditada.

## 8. Métricas

### `metric_units`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `key` | text | identificador único |
| `name` | text | nome em português |
| `symbol` | text | `R$`, `%` ou vazio |
| `format` | text | formato conhecido pela aplicação |
| `active` | boolean | padrão `true` |
| `sort_order` | integer | ordenação |

Seed inicial: número, moeda, percentual, seguidores, leads, visualizações e acessos.

### `metrics`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `name` | text | obrigatório |
| `category` | text | agrupamento livre |
| `unit_id` | uuid | FK para `metric_units` |
| `default_direction` | metric_direction | padrão `NEUTRAL` |
| `baseline_value` | numeric(18,4) | valor de entrada |
| `baseline_date` | date | data do ponto de partida |
| `featured` | boolean | destaque na visão geral |
| `created_by` | uuid | FK para `profiles` |
| `archived_at` | timestamptz | exclusão lógica |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

### `metric_entries`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `metric_id` | uuid | FK para `metrics` |
| `value` | numeric(18,4) | obrigatório |
| `observed_at` | date | data da medição |
| `source` | text | origem opcional |
| `notes` | text | contexto opcional |
| `created_by` | uuid | FK para `profiles` |
| `created_at` | timestamptz | automático |

O valor atual da métrica é a entrada mais recente por `observed_at`, usando `created_at` como desempate. A linha de base permanece separada para preservar o comparativo “Antes x Agora”.

## 9. Objetivos

### `goals`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `metric_id` | uuid | FK opcional para `metrics` |
| `title` | text | obrigatório |
| `description` | text | opcional |
| `category` | text | opcional |
| `initial_value` | numeric(18,4) | necessário para progresso numérico |
| `target_value` | numeric(18,4) | necessário para progresso numérico |
| `manual_current_value` | numeric(18,4) | usado somente sem métrica associada |
| `direction` | metric_direction | `INCREASE` ou `DECREASE` para cálculo |
| `start_date` | date | obrigatório |
| `deadline` | date | opcional |
| `responsible_user_id` | uuid | FK opcional para `profiles` |
| `status` | goal_status | obrigatório |
| `completed_at` | timestamptz | opcional |
| `created_by` | uuid | FK para `profiles` |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

Se houver `metric_id`, o valor atual é obtido da entrada mais recente e `manual_current_value` deve ficar vazio. Objetivos qualitativos podem existir sem valores numéricos, exibindo apenas o status.

## 10. Atualizações semanais

### `weekly_updates`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `client_id` | uuid | FK para `clients` |
| `user_id` | uuid | FK para `profiles` |
| `week_start` | date | obrigatório |
| `week_end` | date | obrigatório |
| `summary` | text | resumo da semana |
| `actions_completed` | text | o que foi feito |
| `results_summary` | text | contexto geral dos resultados |
| `blockers` | text | problemas e bloqueios |
| `next_steps` | text | próximos passos |
| `priority_next_action` | text | ação prioritária |
| `health_status` | health_status | fotografia da saúde informada |
| `notes` | text | observações adicionais |
| `created_at` | timestamptz | automático |
| `updated_at` | timestamptz | automático |

Restrições:

- `week_end >= week_start`;
- uma atualização oficial por cliente e início de semana;
- a atualização pode ser editada, preservando auditoria;
- salvar atualização e alterar a saúde atual deve ocorrer em uma função transacional.

### `weekly_update_results`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `weekly_update_id` | uuid | FK para `weekly_updates` |
| `label` | text | título, como “Leads” |
| `value` | text | valor já formatável, como “143” ou “R$ 18,42” |
| `description` | text | opcional |
| `sort_order` | integer | ordem de exibição |

O valor é textual porque resultados destacados podem conter formatos heterogêneos. Métricas históricas continuam usando valores numéricos próprios.

## 11. Auditoria

### `audit_logs`

| Coluna | Tipo | Regra |
| --- | --- | --- |
| `id` | uuid | PK |
| `actor_user_id` | uuid | FK opcional para `profiles` |
| `entity_type` | text | tipo da entidade |
| `entity_id` | uuid | identificador afetado |
| `action` | text | `INSERT`, `UPDATE`, `ARCHIVE`, `DELETE` ou ação específica |
| `old_data` | jsonb | estado anterior filtrado |
| `new_data` | jsonb | novo estado filtrado |
| `request_id` | uuid | correlação opcional |
| `created_at` | timestamptz | automático |

Dados secretos, tokens e URLs assinadas nunca serão gravados. Alterações em clientes, contratos, finanças, saúde, responsáveis e objetivos serão auditadas.

## 12. Relacionamentos

```text
auth.users 1 ── 1 profiles
profiles   1 ── N client_members N ── 1 clients
clients    1 ── N client_contacts
clients    1 ── N client_services N ── 1 services
clients    1 ── N contracts 1 ── 1 contract_financials
clients    1 ── N documents
contracts  1 ── N documents
clients    1 ── N metrics 1 ── N metric_entries
metric_units 1 ── N metrics
clients    1 ── N goals
metrics    1 ── N goals
clients    1 ── N weekly_updates 1 ── N weekly_update_results
profiles   1 ── N registros com autoria ou responsabilidade
```

## 13. Índices iniciais

- `clients(status)` e `clients(health_status)` para dashboard e filtros.
- `clients(lower(name))` ou índice trigram para busca por nome.
- `clients(archived_at)` para listagens ativas.
- `client_members(user_id, client_id)` para “Meus clientes”.
- `client_services(service_id, client_id)` para filtros.
- `contracts(status, end_date)` para vencimentos.
- `metrics(client_id, featured)` para indicadores principais.
- `metric_entries(metric_id, observed_at desc, created_at desc)` para valor atual.
- `goals(client_id, status, deadline)` para atrasos.
- `weekly_updates(client_id, week_start desc)` para timeline e atraso.
- `weekly_updates(created_at desc)` para feed global.
- `audit_logs(entity_type, entity_id, created_at desc)` para histórico.

## 14. Views e funções previstas

### Views

- `latest_metric_entries`: última medição de cada métrica.
- `client_last_updates`: última atualização e quantidade de dias sem acompanhamento.
- `client_overview`: dados operacionais necessários para a listagem principal.

Views deverão respeitar o usuário invocador e não poderão contornar RLS.

### Funções

- `is_admin()` — verifica perfil ativo e função administrativa.
- `is_client_member(uuid)` — verifica atribuição do usuário ao cliente.
- `submit_weekly_update(...)` — salva atualização, resultados, saúde e auditoria em transação.
- `set_client_health(...)` — alteração controlada e auditada.
- `touch_updated_at()` — manutenção padronizada de timestamps.

## 15. Matriz de RLS resumida

| Tabela | Leitura de colaborador | Escrita de colaborador |
| --- | --- | --- |
| `profiles` | Perfis ativos necessários à interface | Não |
| `clients` | Dados operacionais não arquivados | Apenas saúde via função controlada e se membro |
| `client_contacts` | Sim | Não no MVP |
| `client_members` | Sim | Não |
| `services` | Ativos | Não |
| `client_services` | Sim | Não |
| `contracts` | Vigência, status e escopo | Não |
| `contract_financials` | Nunca | Nunca |
| `documents` | Exceto contratos | Inserção operacional se membro |
| `metrics` | Sim | Não na definição |
| `metric_entries` | Sim | Inserção se membro |
| `goals` | Sim | Atualização limitada se membro |
| `weekly_updates` | Sim | Inserção/edição se membro |
| `weekly_update_results` | Sim | Conforme a atualização pai |
| `audit_logs` | Não | Somente triggers/funções |

Administradores possuem acesso integral às entidades de negócio, respeitando validações e auditoria.

## 16. Seeds planejados

### Catálogos

- Serviços solicitados na especificação.
- Unidades iniciais de métricas.

### Demonstração

Cinco clientes com dados inteiramente fictícios e cenários distintos:

- saudável e atualizado;
- crítico;
- onboarding;
- contrato vencendo;
- sem atualização recente.

Usuários do Auth não serão criados por SQL de produção. O ambiente local terá procedimento explícito para seed de autenticação e os dados demonstrativos referenciarão esses usuários conhecidos.

## 17. Questões resolvidas pelo modelo

- `client_contacts` substitui contato duplicado em `clients`.
- `client_members` é a única fonte de responsáveis.
- `documents` é a única fonte de arquivos, inclusive contratos.
- `contract_financials` resolve a restrição real de dados financeiros.
- linha de base e entradas históricas permitem “Antes x Agora”.
- próxima ação deriva da atualização mais recente.
- pendências são calculadas, não armazenadas.
- status operacional e saúde são independentes.

Este documento define o contrato de dados para as migrations. Mudanças posteriores deverão atualizar primeiro esta documentação e depois o SQL correspondente.
