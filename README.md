# Compass Hub

Central interna de inteligência e acompanhamento da carteira de clientes da Compass Agência.

O Hub organiza contexto institucional, responsáveis, serviços, contratos, documentos, métricas, objetivos e atualizações semanais. O produto foi desenhado para que a situação de qualquer cliente possa ser entendida em menos de 60 segundos, sem substituir o ClickUp ou as plataformas de mídia.

## Recursos do MVP

- autenticação privada com Supabase Auth e recuperação de senha;
- perfis de administrador e colaborador com permissões distintas;
- cadastro, edição, arquivamento, busca e filtros de clientes;
- catálogo de serviços e definição de escopo por cliente;
- responsáveis principais e secundários;
- contratos, vigência, renovação, escopo e dados financeiros protegidos;
- documentos privados no Supabase Storage;
- métricas personalizadas, histórico e comparação entre início e situação atual;
- objetivos vinculados a métricas com cálculo de progresso;
- atualizações semanais, resultados destacados e timeline;
- dashboard executivo, feed global e alertas de pendências;
- auditoria automática das alterações sensíveis no banco.

## Stack

- Next.js 16 com App Router, React 19 e TypeScript;
- Tailwind CSS e componentes Base UI/shadcn adaptados à identidade Compass;
- Supabase PostgreSQL, Auth e Storage;
- Zod para validação no servidor;
- RLS como camada obrigatória de autorização no banco.

Requisito de runtime: Node.js `20.9.0` ou superior. Para produção, prefira uma versão LTS atual.

## Instalação local

```bash
npm ci
```

Copie `.env.example` para `.env.local` e preencha as quatro variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

`SUPABASE_SECRET_KEY` é exclusiva do servidor. Nunca use o prefixo `NEXT_PUBLIC_` nessa variável e nunca a envie ao repositório.

## Supabase

O passo a passo completo está em [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

Depois de autenticar e vincular a CLI ao projeto:

```bash
npx supabase db push --dry-run
npx supabase db push
```

As migrations em `supabase/migrations` criam o schema, catálogos, funções, views, auditoria, políticas RLS e o bucket privado de documentos.

No Dashboard do Supabase, mantenha o cadastro público desativado e configure a URL do ambiente em `Authentication > URL Configuration`.

## Executar

Desenvolvimento:

```bash
npm run dev
```

Abra `http://localhost:3000`.

Produção local:

```bash
npm run build
npm run start
```

## Verificações

Antes de publicar uma versão:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

Com a aplicação executando, o endpoint `GET /api/health` responde sem autenticação e pode ser utilizado pelo monitor da VPS.

## Rotas principais

| Rota | Finalidade |
| --- | --- |
| `/dashboard` | Visão executiva da carteira |
| `/clients` | Clientes, busca e filtros |
| `/clients/[id]/overview` | Resumo estratégico do cliente |
| `/clients/[id]/goals` | Objetivos e progresso |
| `/clients/[id]/metrics` | Ponto de partida e histórico |
| `/clients/[id]/updates` | Atualizações e timeline |
| `/clients/[id]/contract` | Contrato, financeiro e escopo |
| `/clients/[id]/documents` | Documentos privados |
| `/updates` | Feed global de atualizações |
| `/pending` | Alertas operacionais |
| `/settings/users` | Administração de acessos |
| `/settings/services` | Catálogo de serviços |

## Segurança

- todas as rotas internas exigem sessão válida;
- ações sensíveis verificam a permissão novamente no servidor;
- colaboradores só alteram dados operacionais dos clientes atribuídos;
- valores financeiros e contratos ficam restritos aos administradores;
- arquivos permanecem em bucket privado e downloads usam URLs assinadas curtas;
- o banco utiliza RLS mesmo quando a interface já oculta uma ação;
- alterações sensíveis geram registros em `audit_logs`.

## Deploy na VPS

O guia de produção com Node.js, systemd, Nginx, HTTPS, limites de upload e procedimento de atualização está em [docs/DEPLOY_VPS.md](docs/DEPLOY_VPS.md).

## Documentação técnica

- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo de dados](docs/DATABASE.md)
- [Configuração do Supabase](docs/SUPABASE_SETUP.md)
- [Deploy na VPS](docs/DEPLOY_VPS.md)
