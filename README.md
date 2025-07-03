# Remix Audio Visualizer

このプロジェクトは、Remix を使用して構築されたオーディオビジュアライザーです。音声入力に基づいて視覚的なエフェクトを生成し、リアルタイムで表示します。

## 主な機能

*   リアルタイムオーディオ解析
*   カスタマイズ可能な視覚化エフェクト
*   Remix の高速な開発体験
*   複数のビジュアライザータイプ

## ビジュアライザータイプ

### 1. Circular（円形）
周波数データを円形に配置したクラシックなビジュアライザー

### 2. Waveform（波形）
音声の波形をリアルタイムで表示

### 3. Frequency Bars（周波数バー）
周波数スペクトラムを縦棒グラフで表示

### 4. Solar System（太陽系）🆕
太陽系の惑星軌道をイメージした多層円形ビジュアライザー

#### Solar Systemの特徴
- **5つの軌道レベル**: 異なる半径、回転速度、惑星数で構成
- **音連動エフェクト**:
  - 軌道サイズが音の強度に応じて動的に拡大
  - 音が大きいほど回転速度が上昇
  - 個々の周波数データに応じた惑星サイズの変化
  - 音が大きい惑星にはグロー（発光）効果
  - アクティブな惑星に軌跡エフェクト
  - 高強度時に軌道間の接続線が出現
- **中央の太陽**: 全体の音の強度に応じてパルス効果
- **色彩豊か**: 軌道ごとに異なる色相、音に応じた明度・彩度変化
- **滑らかなアニメーション**: 時間ベースの回転システム

## 使用方法

1. 音声ファイルを選択
2. ビジュアライザータイプを選択
3. 再生ボタンを押してビジュアライザーを楽しむ
4. Solar Systemモードでは色設定は自動（各軌道で異なる色相を使用）

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
