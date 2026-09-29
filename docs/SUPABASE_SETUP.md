# Compass Hub — Configuração do Supabase

Este guia conecta o projeto local ao Supabase sem expor credenciais no repositório ou no chat.

## 1. Variáveis locais

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Onde encontrar:

- Project URL: `Project Settings > API` ou botão `Connect`.
- Publishable key: `Project Settings > API Keys`.
- Secret key: `Project Settings > API Keys`.

Regras:

- a secret key nunca pode usar o prefixo `NEXT_PUBLIC_`;
- `.env.local` não deve ser versionado;
- não envie a secret key, senha do banco ou access token por chat;
- em produção, configure as mesmas variáveis diretamente na plataforma de deploy.

## 2. Configuração de autenticação no Dashboard

No projeto hospedado, abra as configurações de autenticação:

1. Mantenha o provedor de e-mail habilitado.
2. Desative o cadastro público de novos usuários.
3. Configure a Site URL como `http://localhost:3000` durante o desenvolvimento.
4. Adicione as URLs de redirecionamento:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/update-password`
5. Quando houver deploy, adicione as URLs equivalentes do domínio de produção.

O arquivo `supabase/config.toml` já replica essas regras para o ambiente local, mas as opções do projeto hospedado precisam ser conferidas no Dashboard.

## 3. Vincular a CLI

No terminal, dentro da raiz do Compass Hub:

```powershell
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
```

O `project ref` é o identificador presente na URL do Dashboard:

```text
https://supabase.com/dashboard/project/SEU_PROJECT_REF
```

A CLI pode solicitar a senha do banco criada junto com o projeto. Digite-a somente no prompt local.

## 4. Validar e aplicar migrations

Primeiro faça uma simulação:

```powershell
npx supabase db push --dry-run
```

Depois aplique:

```powershell
npx supabase db push
```

As migrations criam:

- schema completo do MVP;
- catálogos de serviços e unidades;
- perfis e papéis;
- RLS;
- views operacionais;
- auditoria;
- buckets privados e políticas de Storage.

Não use `db reset --linked`: esse comando apaga o banco remoto.

## 5. Criar o primeiro administrador

Somente depois de aplicar as migrations:

1. Abra `Authentication > Users`.
2. Crie o primeiro usuário da Compass com e-mail e senha.
3. O primeiro perfil criado será promovido automaticamente a `ADMIN`.
4. Faça login em `http://localhost:3000/login`.

Usuários posteriores podem ser convidados por `/settings/users` dentro do Compass Hub.

## 6. Gerar tipos do banco

Depois de aplicar as migrations:

```powershell
npx supabase gen types typescript --linked --schema public > src/types/database.ts
```

O arquivo gerado deve ser atualizado sempre que o schema mudar.

## 7. Verificações

```powershell
npx supabase migration list
npx supabase db lint --linked
npm run lint
npm run build
```

O lint remoto deve ser executado antes de começar o módulo de clientes.
