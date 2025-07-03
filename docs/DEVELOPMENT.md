# 開発ガイド

このドキュメントでは、Remix Audio Visualizer の開発に関する詳細なガイドラインと手順を説明します。

## 🛠 開発環境のセットアップ

### 必要なツール

- **Node.js**: 20.0.0 以上
- **npm**: 9.0.0 以上 (または yarn 1.22.0 以上)
- **Git**: 2.30.0 以上
- **VS Code**: 推奨エディター

### 推奨 VS Code 拡張機能

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### プロジェクトのクローンと初期設定

```bash
# リポジトリをクローン
git clone https://github.com/your-username/remix-audio-visualizer.git
cd remix-audio-visualizer

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 📁 プロジェクト構造の詳細

```
remix-audio-visualizer/
├── app/                          # Remix アプリケーションのソースコード
│   ├── components/               # 再利用可能なコンポーネント
│   │   ├── HelloWorld.tsx       # サンプルコンポーネント
│   │   └── HelloWorld.test.tsx  # コンポーネントテスト
│   ├── routes/                  # Remix ルート（ページ）
│   │   └── _index.tsx          # メインページ（ビジュアライザー）
│   ├── utils/                   # ユーティリティ関数（将来追加）
│   ├── hooks/                   # カスタムフック（将来追加）
│   ├── types/                   # TypeScript 型定義（将来追加）
│   ├── entry.client.tsx         # クライアントエントリーポイント
│   ├── entry.server.tsx         # サーバーエントリーポイント
│   ├── root.tsx                # アプリケーションルート
│   └── tailwind.css            # Tailwind CSS の設定
├── public/                      # 静的ファイル
│   ├── favicon.ico             # ファビコン
│   ├── logo-dark.png           # ダークテーマのロゴ
│   └── logo-light.png          # ライトテーマのロゴ
├── test/                        # テスト設定とヘルパー
│   └── setup.ts               # テスト環境のセットアップ
├── docs/                        # ドキュメント
│   ├── API.md                  # API リファレンス
│   ├── DEVELOPMENT.md          # 開発ガイド（このファイル）
│   └── CONTRIBUTING.md         # コントリビューションガイド
├── .vscode/                     # VS Code 設定
│   └── extensions.json         # 推奨拡張機能
└── 設定ファイル群
    ├── package.json            # npm の設定と依存関係
    ├── tsconfig.json          # TypeScript 設定
    ├── tailwind.config.ts     # Tailwind CSS 設定
    ├── vite.config.ts         # Vite ビルドツール設定
    ├── .eslintrc.cjs          # ESLint 設定
    └── .gitignore             # Git 除外ファイル
```

## 🔄 開発ワークフロー

### 新機能の開発

1. **Issue の作成**
   - GitHub Issues で新機能の提案
   - 要件と仕様の明確化

2. **ブランチの作成**
   ```bash
   git checkout -b feature/new-visualizer-mode
   ```

3. **開発とテスト**
   ```bash
   # 開発サーバーを起動
   npm run dev
   
   # 別ターミナルでテストを実行
   npm test -- --watch
   ```

4. **コードレビュー**
   - ESLint でコード品質をチェック
   - TypeScript でのタイプチェック
   - テストカバレッジの確認

5. **プルリクエスト**
   - 変更内容の説明
   - テスト結果の添付
   - レビューの依頼

### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) に従ってコミットメッセージを作成します：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### タイプ一覧

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイルの変更
- `refactor`: リファクタリング
- `test`: テストの追加・修正
- `chore`: ビルドプロセスや補助ツールの変更

#### 例

```bash
git commit -m "feat(visualizer): add spectrum analyzer mode"
git commit -m "fix(audio): resolve playback issue on Safari"
git commit -m "docs: update API documentation"
```

## 🧪 テスト戦略

### テストの種類

1. **ユニットテスト**: 個別のコンポーネントや関数
2. **統合テスト**: コンポーネント間の連携
3. **E2Eテスト**: ユーザーシナリオ全体（将来追加予定）

### テストの実行

```bash
# 全テストを実行
npm test

# ウォッチモードで実行
npm test -- --watch

# カバレッジレポートを生成
npm test -- --coverage

# 特定のファイルのみテスト
npm test HelloWorld.test.tsx
```

### テストの書き方

#### コンポーネントテストの例

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import MyComponent from "~/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole("button");
    await user.click(button);
    
    expect(screen.getByText("Clicked!")).toBeInTheDocument();
  });
});
```

### Audio 関連のテスト

Audio API のテストには Mock を使用します：

```typescript
// test/mocks/audioContext.ts
export const mockAudioContext = {
  createAnalyser: vi.fn(() => ({
    fftSize: 512,
    frequencyBinCount: 256,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    connect: vi.fn(),
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
  })),
  destination: {},
};

// グローバルなオーディオコンテキストをモック
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext),
});
```

## 🎨 スタイリングガイドライン

### Tailwind CSS の使用

1. **ユーティリティクラスを優先**
   ```tsx
   // Good
   <div className="bg-gray-900 text-white p-4 rounded-lg">
   
   // 避ける
   <div style={{backgroundColor: '#1f2937', color: 'white', padding: '1rem'}}>
   ```

2. **レスポンシブデザイン**
   ```tsx
   <div className="w-full md:w-1/2 lg:w-1/3">
   ```

3. **ダークテーマの統一**
   ```tsx
   // 背景色の統一
   bg-gray-900  // メイン背景
   bg-gray-800  // カード背景
   bg-gray-700  // インプット背景
   ```

### カスタムコンポーネントの作成

```typescript
// app/components/Button/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors';
  const variantClasses = {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

## 🔧 デバッグとトラブルシューティング

### 開発ツール

1. **React Developer Tools**
   - コンポーネントの状態を確認
   - Remix のルーティングを監視

2. **ブラウザのデベロッパーツール**
   - Console でのエラー確認
   - Network タブでのAPI呼び出し監視
   - Audio タブでの音声解析

### よくある問題と解決方法

#### 1. Audio Context が初期化されない

```typescript
// 問題: ユーザーのインタラクション前にAudio Contextを初期化
const audioContext = new AudioContext(); // エラー

// 解決方法: ユーザーのクリック後に初期化
const handleUserInteraction = () => {
  if (!audioContextRef.current) {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
  }
};
```

#### 2. Canvas が描画されない

```typescript
// 確認項目
const canvas = canvasRef.current;
const ctx = canvas?.getContext('2d');

console.log('Canvas:', canvas); // null でないことを確認
console.log('Context:', ctx);   // null でないことを確認
console.log('Canvas size:', canvas?.width, canvas?.height); // サイズを確認
```

#### 3. 音声ファイルが読み込めない

```typescript
// ファイル形式の確認
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    
    // 対応形式の確認
    const supportedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!supportedTypes.includes(file.type)) {
      console.warn('Unsupported file type:', file.type);
    }
  }
};
```

### パフォーマンス最適化

#### 1. Canvas 描画の最適化

```typescript
// 条件付きクリア（バックグラウンドが変わらない場合）
if (needsFullRedraw) {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.fillStyle = "#000";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

// 部分的な更新
canvasCtx.clearRect(x, y, width, height);
```

#### 2. メモリリークの防止

```typescript
useEffect(() => {
  return () => {
    // Audio Context のクリーンアップ
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Object URL の解放
    if (audioRef.current?.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }
  };
}, []);
```

## 🏗 ビルドとデプロイ

### ローカルでのプロダクションビルド

```bash
# プロダクション用ビルド
npm run build

# ビルド結果をローカルで確認
npm start
```

### 環境別設定

#### 開発環境
```bash
NODE_ENV=development
VITE_API_URL=http://localhost:3000
```

#### 本番環境
```bash
NODE_ENV=production
VITE_API_URL=https://your-api.com
```

### CI/CD パイプライン

GitHub Actions の設定例：

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

## 📚 学習リソース

### 必須リソース
- [Remix Documentation](https://remix.run/docs)
- [Web Audio API Guide](https://developer.mozilla.org/docs/Web/API/Web_Audio_API)
- [Canvas API Tutorial](https://developer.mozilla.org/docs/Web/API/Canvas_API/Tutorial)

### 推奨リソース
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 チーム開発のベストプラクティス

### コードレビューのチェックリスト

- [ ] コードが要件を満たしているか
- [ ] テストが適切に書かれているか
- [ ] TypeScript の型定義が正しいか
- [ ] パフォーマンスに問題がないか
- [ ] セキュリティ上の問題がないか
- [ ] アクセシビリティが考慮されているか

### ペアプログラミング

複雑な機能の実装時は、ペアプログラミングを推奨します：
- Audio 関連の機能
- 新しい視覚化モードの追加
- パフォーマンス最適化

これらのガイドラインに従って、高品質なコードを効率的に開発しましょう！