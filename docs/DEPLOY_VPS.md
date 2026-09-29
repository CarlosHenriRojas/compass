# Compass Hub — Deploy em VPS

Este guia utiliza uma única instância Node.js atrás do Nginx. É uma configuração simples e adequada ao MVP. O Supabase continua hospedando banco, autenticação e arquivos.

## 1. Requisitos

- Linux atualizado;
- Node.js LTS compatível com Next.js 16 (`>= 20.9.0`);
- Nginx;
- domínio apontando para o IP da VPS;
- usuário de sistema sem privilégios de root para executar a aplicação.

Não exponha a porta `3000` à internet. Deixe o Nginx receber o tráfego público e encaminhar para `127.0.0.1:3000`.

## 2. Preparar a aplicação

Exemplo de diretório:

```bash
sudo mkdir -p /var/www/compass-hub
sudo chown -R SEU_USUARIO:SEU_USUARIO /var/www/compass-hub
cd /var/www/compass-hub
```

Copie ou clone o projeto nesse diretório e instale exatamente as versões do lockfile:

```bash
npm ci
```

Crie `/var/www/compass-hub/.env.production` com permissões restritas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SITE_URL=https://hub.seudominio.com.br
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

```bash
chmod 600 /var/www/compass-hub/.env.production
npm run build
```

As variáveis `NEXT_PUBLIC_*` são incorporadas durante o build. Portanto, o arquivo de produção precisa existir antes de `npm run build`.

## 3. Serviço systemd

Crie `/etc/systemd/system/compass-hub.service`:

```ini
[Unit]
Description=Compass Hub
After=network.target

[Service]
Type=simple
User=SEU_USUARIO
Group=SEU_USUARIO
WorkingDirectory=/var/www/compass-hub
Environment=NODE_ENV=production
EnvironmentFile=/var/www/compass-hub/.env.production
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

Confirme os caminhos de `node` e `npm` com `which node` e `which npm`. Se o Node foi instalado via NVM, prefira uma instalação de sistema para serviços ou use os caminhos absolutos retornados pelo ambiente do usuário.

Ative o serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now compass-hub
sudo systemctl status compass-hub
```

Teste localmente na VPS:

```bash
curl --fail http://127.0.0.1:3000/api/health
```

## 4. Nginx

Crie `/etc/nginx/sites-available/compass-hub`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name hub.seudominio.com.br;

    client_max_body_size 22M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Necessário para preservar streaming e estados de carregamento do App Router.
        proxy_buffering off;
        proxy_read_timeout 60s;
    }
}
```

Ative e valide:

```bash
sudo ln -s /etc/nginx/sites-available/compass-hub /etc/nginx/sites-enabled/compass-hub
sudo nginx -t
sudo systemctl reload nginx
```

Depois habilite HTTPS com a solução que você já utiliza na VPS, como Certbot. Não publique login, cookies ou recuperação de senha sem HTTPS.

## 5. Configurar URLs no Supabase

Em `Authentication > URL Configuration`:

- Site URL: `https://hub.seudominio.com.br`;
- Redirect URL: `https://hub.seudominio.com.br/auth/callback`;
- Redirect URL: `https://hub.seudominio.com.br/update-password`.

Também confirme que o cadastro público continua desativado.

## 6. Aplicar migrations

Faça migrations como uma etapa explícita antes de trocar a aplicação:

```bash
npx supabase db push --dry-run
npx supabase db push
```

Nunca execute `db reset --linked` contra o projeto de produção.

## 7. Atualizações futuras

No diretório da aplicação:

```bash
git pull --ff-only
npm ci
npm run lint
npx tsc --noEmit
npm run test
npm run build
sudo systemctl restart compass-hub
curl --fail https://hub.seudominio.com.br/api/health
```

O `SIGTERM` enviado pelo systemd permite que o Next.js finalize requisições em andamento antes de encerrar.

## 8. Diagnóstico

```bash
sudo journalctl -u compass-hub -n 200 --no-pager
sudo journalctl -u compass-hub -f
sudo nginx -t
curl -I https://hub.seudominio.com.br/login
```

Não registre nem compartilhe o conteúdo de `.env.production`, cookies de sessão ou a `SUPABASE_SECRET_KEY`.
