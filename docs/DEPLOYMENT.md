# デプロイメントガイド

このガイドでは、Remix Audio Visualizer を様々なプラットフォームにデプロイする方法を詳しく説明します。

## 📋 デプロイ前の確認事項

### 必要な準備

```bash
# 1. プロダクションビルドが成功することを確認
npm run build

# 2. テストがすべて通ることを確認
npm test

# 3. Linter エラーがないことを確認
npm run lint

# 4. TypeScript の型チェック
npm run typecheck
```

### 環境変数の設定

本番環境では以下の環境変数を設定してください：

```bash
NODE_ENV=production
PORT=3000

# オプション（必要に応じて）
VITE_APP_NAME="Remix Audio Visualizer"
VITE_APP_VERSION="1.0.0"
```

## 🚀 デプロイ先別ガイド

### 1. Vercel（推奨）

Vercel は Remix アプリケーションに最適化されており、最も簡単にデプロイできます。

#### CLI を使用したデプロイ

```bash
# Vercel CLI をインストール
npm i -g vercel

# プロジェクトディレクトリでデプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

#### GitHub 連携によるデプロイ

1. [Vercel ダッシュボード](https://vercel.com/dashboard) にアクセス
2. "New Project" をクリック
3. GitHub リポジトリを連携
4. 以下の設定を確認：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

#### Vercel 設定ファイル

プロジェクトルートに `vercel.json` を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/remix"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 2. Netlify

Netlify も Remix アプリケーションをサポートしています。

#### CLI を使用したデプロイ

```bash
# Netlify CLI をインストール
npm i -g netlify-cli

# ビルド
npm run build

# デプロイ
netlify deploy --prod --dir=build
```

#### GitHub 連携によるデプロイ

1. [Netlify ダッシュボード](https://app.netlify.com/) にアクセス
2. "New site from Git" をクリック
3. GitHub リポジトリを選択
4. ビルド設定：

```
Build command: npm run build
Publish directory: build
```

#### Netlify 設定ファイル

プロジェクトルートに `netlify.toml` を作成：

```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### 3. Railway

Railway は簡単にフルスタックアプリケーションをデプロイできます。

#### Railway CLI を使用

```bash
# Railway CLI をインストール
npm i -g @railway/cli

# ログイン
railway login

# プロジェクト初期化
railway init

# デプロイ
railway up
```

#### GitHub 連携

1. [Railway ダッシュボード](https://railway.app/dashboard) にアクセス
2. "New Project" → "Deploy from GitHub repo"
3. リポジトリを選択
4. 環境変数を設定

#### Railway 設定

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@railway/nixpacks"
    }
  ]
}
```

### 4. Render

Render は無料枠でも高性能なホスティングを提供します。

#### デプロイ手順

1. [Render ダッシュボード](https://dashboard.render.com/) にアクセス
2. "New" → "Web Service"
3. GitHub リポジトリを連携
4. 設定：

```
Environment: Node
Build Command: npm run build
Start Command: npm start
```

#### Render 設定ファイル

`render.yaml` を作成：

```yaml
services:
  - type: web
    name: remix-audio-visualizer
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
    headers:
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: X-Frame-Options
        value: DENY
```

### 5. AWS (Amazon Web Services)

#### AWS Amplify を使用

```bash
# AWS Amplify CLI をインストール
npm install -g @aws-amplify/cli

# Amplify 初期化
amplify init

# ホスティング追加
amplify add hosting

# デプロイ
amplify publish
```

#### Amazon S3 + CloudFront

1. **S3 バケット作成**
```bash
aws s3 mb s3://remix-audio-visualizer-app
```

2. **ビルドとアップロード**
```bash
npm run build
aws s3 sync build/ s3://remix-audio-visualizer-app --delete
```

3. **CloudFront 設定**
```json
{
  "Origins": [{
    "DomainName": "remix-audio-visualizer-app.s3.amazonaws.com",
    "Id": "S3-remix-audio-visualizer",
    "S3OriginConfig": {
      "OriginAccessIdentity": ""
    }
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-remix-audio-visualizer",
    "ViewerProtocolPolicy": "redirect-to-https"
  }
}
```

### 6. Google Cloud Platform

#### Cloud Run を使用

```bash
# gcloud CLI をインストール後
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Dockerfile を作成
cat > Dockerfile << EOF
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
EOF

# ビルドとデプロイ
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/remix-audio-visualizer
gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/remix-audio-visualizer --platform managed
```

### 7. Digital Ocean App Platform

#### デプロイ手順

1. [Digital Ocean コントロールパネル](https://cloud.digitalocean.com/apps) にアクセス
2. "Create App" をクリック
3. GitHub リポジトリを選択
4. ビルド設定：

```yaml
name: remix-audio-visualizer
services:
- name: web
  source_dir: /
  github:
    repo: your-username/remix-audio-visualizer
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
```

## 🐳 Docker を使用したデプロイ

### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

USER remix

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        listen 443 ssl http2;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # セキュリティヘッダー
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    }
}
```

## 🔧 パフォーマンス最適化

### ビルド最適化

```javascript
// vite.config.ts に追加
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          audio: ['audio-related-libraries']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### CDN の活用

```html
<!-- 静的アセットのCDN配信 -->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

### Service Worker

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/static/css/main.css',
        '/static/js/main.js'
      ]);
    })
  );
});
```

## 🔒 セキュリティ設定

### セキュリティヘッダー

```javascript
// app/entry.server.tsx に追加
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  // セキュリティヘッダーを追加
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("X-Frame-Options", "DENY");
  responseHeaders.set("X-XSS-Protection", "1; mode=block");
  responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 他の処理...
}
```

### CSP (Content Security Policy)

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline' fonts.googleapis.com;
               font-src 'self' fonts.gstatic.com;
               media-src 'self' blob:;">
```

## 📊 監視とログ

### アプリケーション監視

```javascript
// 簡単なエラー追跡
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // エラー追跡サービスに送信
});

// パフォーマンス監視
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Performance:', entry);
  }
}).observe({ entryTypes: ['navigation', 'paint'] });
```

### ログ設定

```javascript
// 本番環境でのログレベル制御
const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

const logger = {
  debug: logLevel === 'debug' ? console.log : () => {},
  info: console.info,
  warn: console.warn,
  error: console.error
};
```

## 🆘 トラブルシューティング

### よくある問題

#### 1. ビルドエラー
```bash
# node_modules をクリア
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run build -- --force
```

#### 2. メモリ不足
```bash
# Node.js のメモリ制限を増加
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### 3. 環境変数が認識されない
```bash
# 環境変数を確認
echo $NODE_ENV
printenv | grep VITE_
```

### デバッグ方法

```bash
# 詳細なビルドログ
npm run build -- --verbose

# 本番環境のデバッグ
NODE_ENV=production DEBUG=* npm start
```

## 📚 参考リソース

- [Remix Deployment Guide](https://remix.run/docs/en/main/guides/deployment)
- [Vercel Remix Template](https://vercel.com/templates/remix)
- [Railway Remix Starter](https://railway.app/template/remix)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

デプロイに関する質問や問題が発生した場合は、[GitHub Issues](https://github.com/your-username/remix-audio-visualizer/issues) でお気軽にお尋ねください。
