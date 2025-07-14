# Remix Audio Visualizer

![Audio Visualizer](./public/logo-light.png)

[![CI](https://github.com/sayuyuyuyu/remix-audio-visualizer/workflows/CI/badge.svg)](https://github.com/sayuyuyuyu/remix-audio-visualizer/actions/workflows/ci.yml)
[![CD](https://github.com/sayuyuyuyu/remix-audio-visualizer/workflows/CD/badge.svg)](https://github.com/sayuyuyuyu/remix-audio-visualizer/actions/workflows/cd.yml)
[![codecov](https://codecov.io/gh/sayuyuyuyu/remix-audio-visualizer/branch/main/graph/badge.svg)](https://codecov.io/gh/sayuyuyuyu/remix-audio-visualizer)
[![Lighthouse](https://img.shields.io/badge/lighthouse-100%2F100-brightgreen.svg)](https://github.com/sayuyuyuyu/remix-audio-visualizer/actions/workflows/cd.yml)

このプロジェクトは、Remix を使用して構築されたオーディオビジュアライザーです。音声入力に基づいて視覚的なエフェクトを生成し、リアルタイムで表示します。Web Audio API を活用した高性能な音声解析と、Canvas を使った美しい視覚化効果を提供します。

## ✨ 主な機能
=======
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

## 🚀 クイックスタート

### 前提条件
- Node.js 20.0.0 以上
- npm または yarn

### インストール

```sh
# リポジトリをクローン
git clone https://github.com/your-username/remix-audio-visualizer.git
cd remix-audio-visualizer

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```sh
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアプリケーションにアクセスします。

## 📖 使用方法

### 基本的な使い方

1. **音声ファイルのアップロード**
   - "Audio" ボタンをクリックして音声ファイルを選択
   - 対応形式: MP3, WAV, OGG, M4A など

2. **中央画像の設定**（オプション）
   - "Center Image" ボタンをクリックして画像ファイルを選択
   - 円形ビジュアライザーの中央に表示されます

3. **視覚化の開始**
   - "Play" ボタンをクリックして音声再生と視覚化を開始

4. **視覚化モードの変更**
   - ドロップダウンメニューから希望のモードを選択:
     - **Circular**: カラフルな円形パターン
     - **Waveform**: 音声波形表示
     - **Frequency Bars**: 周波数スペクトラム

5. **色のカスタマイズ**
   - Waveform と Frequency Bars モードでは色を自由に変更可能

### 高度な使い方

#### カスタム視覚化の追加
新しい視覚化モードを追加するには、`app/routes/_index.tsx` の `visualize` 関数内に新しいケースを追加します：

```typescript
else if (visualizerType === "custom") {
    // カスタム視覚化ロジック
    analyser.getByteFrequencyData(dataArray);
    // 独自の描画処理
}
```

## 🛠 開発

### 技術スタック

- **フレームワーク**: [Remix](https://remix.run/) - フルスタック React フレームワーク
- **言語**: TypeScript - 型安全性と開発効率の向上
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSS
- **テスト**: [Vitest](https://vitest.dev/) - 高速なテスト実行環境
- **音声処理**: Web Audio API - ブラウザネイティブの音声処理
- **描画**: HTML5 Canvas - 高性能な2Dグラフィックス

### プロジェクト構造

```
remix-audio-visualizer/
├── app/
│   ├── components/          # 再利用可能なReactコンポーネント
│   │   ├── HelloWorld.tsx
│   │   └── HelloWorld.test.tsx
│   ├── routes/              # Remix ルートファイル
│   │   └── _index.tsx       # メインページ（ビジュアライザー）
│   ├── entry.client.tsx     # クライアントサイドエントリーポイント
│   ├── entry.server.tsx     # サーバーサイドエントリーポイント
│   ├── root.tsx            # アプリケーションルート
│   └── tailwind.css        # Tailwind CSSエントリーポイント
├── public/                  # 静的アセット
│   ├── favicon.ico
│   ├── logo-dark.png
│   └── logo-light.png
├── test/                   # テスト設定
│   └── setup.ts
├── package.json            # 依存関係とスクリプト
├── tailwind.config.ts      # Tailwind CSS設定
├── tsconfig.json          # TypeScript設定
└── vite.config.ts         # Vite設定
```

### 利用可能なスクリプト

```sh
# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start

# テストの実行
npm test

# リンターの実行
npm run lint

# 型チェック
npm run typecheck
```

### テストの実行

Vitest を使用してテストを実行します：

```sh
# 全テストの実行
npm test

# ウォッチモードでテストを実行
npm test -- --watch

# カバレッジレポートの生成
npm test -- --coverage
```

### コーディング規約

このプロジェクトでは以下の規約に従っています：

- **ESLint**: コード品質の維持
- **TypeScript**: 型安全性の確保
- **Prettier**: コードフォーマットの統一
- **従来のコミット**: コミットメッセージの標準化

### 新しいコンポーネントの追加

1. `app/components/` ディレクトリに新しいコンポーネントファイルを作成
2. 対応するテストファイルを作成（`.test.tsx`）
3. TypeScript の型定義を含める
4. Export/Import を適切に設定

例：
```typescript
// app/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  // プロパティの型定義
}

const MyComponent: React.FC<MyComponentProps> = ({ /* props */ }) => {
  return (
    // コンポーネントのJSX
  );
};

export default MyComponent;
```

## 🏗 本番環境への展開

### ビルド

プロダクション用にアプリケーションをビルドします：

```sh
npm run build
```

### 展開

このアプリケーションは以下のプラットフォームに展開できます：

#### Vercel
```sh
# Vercel CLI をインストール
npm i -g vercel

# 展開
vercel
```

#### Netlify
```sh
# Netlify CLI をインストール
npm i -g netlify-cli

# 展開
netlify deploy --prod
```

#### Railway
```sh
# Railway CLI をインストール
npm i -g @railway/cli

# 展開
railway deploy
```

#### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 環境変数

本番環境では以下の環境変数を設定してください：

```sh
NODE_ENV=production
PORT=3000
```

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

### コントリビューションの流れ

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 報告とフィードバック

- バグ報告: [Issues](https://github.com/your-username/remix-audio-visualizer/issues)
- 機能提案: [Discussions](https://github.com/your-username/remix-audio-visualizer/discussions)

## 🛠 トラブルシューティング

### よくある問題

#### 音声が再生されない
- ブラウザで音声ファイルがサポートされているか確認
- ブラウザのセキュリティ設定でオーディオの自動再生が許可されているか確認

#### 視覚化が表示されない
- ブラウザでWeb Audio APIがサポートされているか確認
- Canvasが正しく初期化されているか確認

#### パフォーマンスの問題
- 大きな音声ファイルの場合、ブラウザのメモリ制限に注意
- 高解像度ディスプレイでのCanvas描画負荷を考慮

### サポートされているブラウザ

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

## 📚 参考資料

- 📖 [Remix Documentation](https://remix.run/docs)
- 🎵 [Web Audio API Documentation](https://developer.mozilla.org/docs/Web/API/Web_Audio_API)
- 🎨 [Canvas API Documentation](https://developer.mozilla.org/docs/Web/API/Canvas_API)
- 💨 [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- ⚡ [Vite Documentation](https://vitejs.dev/guide/)

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙋‍♂️ 作者

- GitHub: [@your-username](https://github.com/your-username)
- Email: your-email@example.com

---

⭐ このプロジェクトが役に立った場合は、ぜひスターを付けてください！
