# Remix Audio Visualizer

このプロジェクトは、Remix を使用して構築されたオーディオビジュアライザーです。音声入力に基づいて視覚的なエフェクトを生成し、リアルタイムで表示します。

## 主な機能

*   リアルタイムオーディオ解析
*   カスタマイズ可能な視覚化エフェクト
*   Remix の高速な開発体験

- 📖 [Remix docs](https://remix.run/docs)

## Development

開発サーバーを起動します。

```sh
npm run dev
```

### テストの実行

Vitest を使用してテストを実行します。

```sh
npm test
```

### 環境変数の設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、環境変数を設定します。`.env.example` を参考にしてください。

```
cp .env.example .env
```

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
