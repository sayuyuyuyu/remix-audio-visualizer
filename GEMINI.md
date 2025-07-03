# Remix Audio Visualizer 開発ガイドライン

## ビルドと実行

変更を提出する前に、**完全な品質チェック**を実行して内容を検証することが重要です。以下のコマンドで、プロジェクトのすべての品質ゲートを満たしていることを確認できます。

### 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# テスト実行
npm test

# 型チェック
npm run typecheck

# リンティング
npm run lint
```

### 品質チェック

変更を提出する前に、以下のコマンドを順番に実行して品質を確認してください：

```bash
# 1. 型チェック
npm run typecheck

# 2. リンティング
npm run lint

# 3. テスト実行
npm test

# 4. ビルド確認
npm run build
```

## プロジェクト構成

### ファイル構造

* **ルート**: `app/routes/` ディレクトリ内に配置
* **コンポーネント**: `app/components/` ディレクトリ内に配置
* **スタイル**: `app/tailwind.css` でTailwind CSSを管理
* **エントリーポイント**: `app/entry.client.tsx` と `app/entry.server.tsx`

### 技術スタック

* **フレームワーク**: Remix (React-based)
* **ビルドツール**: Vite
* **言語**: TypeScript
* **スタイリング**: Tailwind CSS
* **テスト**: Vitest + @testing-library/react
* **リンティング**: ESLint

## Remix フレームワーク

### ルート設計

* **ファイルベースルーティング**: ファイル名がURLパスになります
* **ネストルート**: フォルダ構造でネストを表現
* **動的ルート**: `[param].tsx` 形式で動的パラメータを定義
* **レイアウトルート**: `_layout.tsx` で共通レイアウトを定義

### データフェッチング

* **Loader**: `loader` 関数でサーバーサイドデータフェッチ
* **Action**: `action` 関数でフォーム送信やデータ更新
* **useLoaderData**: クライアントサイドでローダーデータにアクセス
* **useActionData**: アクションの結果にアクセス

### エラーハンドリング

* **Error Boundary**: `ErrorBoundary` コンポーネントでエラーをキャッチ
* **Catch Boundary**: `CatchBoundary` コンポーネントでHTTPエラーをキャッチ

## React

### ガイドライン

* **関数コンポーネントと Hooks を使う**: クラスコンポーネントや古いライフサイクルメソッドは使わない。
* **副作用は useEffect 内で管理**: コンポーネント本体では副作用を起こさず、純粋な関数として保つ。
* **状態の直接変更禁止**: スプレッド構文などで新しいオブジェクトや配列を作る。
* **Hooks は条件分岐内で呼ばない**。
* **refs は必要な場合のみ使う**。
* **小さいコンポーネントに分割し、Composition を優先する**。
* **並列データフェッチや Suspense を活用してネットワーク待ちを減らす**。
* **React Compiler を信頼する**: 不要な memo や useCallback は書かず、シンプルなコードを優先する。

### Remix固有のReactパターン

* **Form コンポーネント**: Remixの `Form` コンポーネントを使用してフォーム送信
* **Link コンポーネント**: クライアントサイドナビゲーションには `Link` を使用
* **useNavigate**: プログラムによるナビゲーション
* **useSubmit**: プログラムによるフォーム送信

## スタイリング（Tailwind CSS）

### 基本方針

* **ユーティリティファースト**: Tailwind CSSのユーティリティクラスを優先使用
* **カスタムCSS最小化**: 可能な限りTailwindクラスでスタイリング
* **レスポンシブデザイン**: Tailwindのレスポンシブプレフィックスを活用
* **ダークモード対応**: `dark:` プレフィックスでダークモードスタイルを定義

### カスタムスタイル

* **コンポーネント固有**: `@apply` ディレクティブでカスタムクラスを作成
* **グローバルスタイル**: `app/tailwind.css` でグローバルスタイルを定義
* **CSS変数**: テーマカラーなどはCSS変数で管理

## オーディオ処理

### Web Audio API

* **AudioContext**: オーディオ処理の中心となるコンテキスト
* **AnalyserNode**: 音声データの解析に使用
* **MediaDevices**: マイク入力の取得
* **AudioWorklet**: 高性能なオーディオ処理（必要に応じて）

### パフォーマンス考慮事項

* **requestAnimationFrame**: 視覚化の更新には `requestAnimationFrame` を使用
* **メモリ管理**: 不要なAudioNodeは適切に破棄
* **バッファサイズ**: 適切なバッファサイズでレイテンシーとパフォーマンスのバランスを取る

## テストの記述

このプロジェクトでは、**Vitest** と **@testing-library/react** が主要なテストフレームワークとして使われています。テストを書く際には、既存のパターンに従うよう心がけてください。

### テスト構造とフレームワーク

* **フレームワーク**: すべてのテストは Vitest（`describe`, `it`, `expect`, `vi`）で書かれています。
* **React Testing Library**: Reactコンポーネントのテストには `@testing-library/react` を使用します。
* **ファイル配置**: テストファイル（ロジック用は `*.test.ts`、Reactコンポーネント用は `*.test.tsx`）は、テスト対象のソースファイルと同じ場所に配置します。
* **設定**: テスト環境は `vite.config.ts` ファイルで定義されています。
* **セットアップ**: `test/setup.ts` で `@testing-library/jest-dom` が設定されています。

### モック（Vitest の `vi`）

* **ES モジュール**: `vi.mock('モジュール名', async (importOriginal) => { ... })` を使ってモックします。選択的にモックする場合は `importOriginal` を使います。

  * *例*:

    ```js
    vi.mock('os', async (importOriginal) => {
      const actual = await importOriginal();
      return { ...actual, homedir: vi.fn() };
    });
    ```
* **モックの順序**: モジュールレベルの定数に影響する重要な依存関係（例: `os`, `fs`）は、他のインポートより前にファイルの最上部で `vi.mock` を記述します。
* **ホイスティング**: モック関数を `vi.mock` ファクトリ内で使用する前に定義したい場合は `vi.hoisted(() => vi.fn())` を使います。
* **モック関数**: `vi.fn()` で作成します。`mockImplementation()`, `mockResolvedValue()`, `mockRejectedValue()` で動作を定義できます。
* **スパイ**: `vi.spyOn(object, 'methodName')` を使います。`afterEach` で `mockRestore()` を呼んで戻します。

### React コンポーネントテスト

* `@testing-library/react` の `render()` を使います。
* 出力は `screen.getByRole()`, `screen.getByText()` などで検証します。
* アクセシビリティを考慮したテストを書く（`getByRole` を優先）。
* 必要に応じて `Context.Provider` でコンポーネントをラップします。
* カスタムフックや複雑な子コンポーネントは `vi.mock()` でモックします。

### 非同期テスト

* `async/await` を使います。
* タイマー関連は `vi.useFakeTimers()`, `vi.advanceTimersByTimeAsync()`, `vi.runAllTimersAsync()` を使います。
* Promise の拒否は `await expect(promise).rejects.toThrow(...)` でテストします。

### 一般的なガイダンス

* テストを追加する前に、既存のテスト（例: `app/components/HelloWorld.test.tsx`）を見て慣れたパターンに合わせるようにしてください。
* テストファイルの冒頭にあるモックは重要な依存関係の扱い方を示しているので注意深く見ましょう。

## JavaScript / TypeScript

React、Node、TypeScript コードベースに貢献する際は、JavaScript クラス構文ではなく、**プレーンなオブジェクトと TypeScript のインターフェイスまたは型宣言を使うことを優先してください**。これには以下の利点があります。

### クラスよりプレーンオブジェクトを推奨する理由

* **React との統合が容易**: React は props と state に基づく明確なデータフローを重視します。クラスは内部状態をインスタンスに保持するため、props や state の伝搬が把握しにくくなります。プレーンオブジェクトは不変性を保ちやすく、props として簡単に渡せるのでデータフローがシンプルになります。

* **ボイラープレート削減 & 簡潔さ**: クラスはコンストラクタ、this バインド、getter/setter など、冗長なコードが増えがちです。TypeScript の型システムを活用することで、クラスの冗長さを回避しつつ強力な型安全を実現できます。

* **読みやすさと予測可能性**: プレーンオブジェクトは構造が明示的で、内部状態や継承チェーンに悩まされることがありません。

* **イミュータブル性の促進**: プレーンオブジェクトは不変なデータ構造を取りやすく、React の再調和処理と相性抜群です。

* **シリアライズ/デシリアライズが容易**: プレーンオブジェクトは JSON に簡単に変換でき、API 通信やローカルストレージと連携しやすいです。

### ESモジュール構文によるカプセル化

Java のようなクラスの public/private メンバー管理よりも、**ESモジュール（import/export）構文**を使って API の公開範囲を管理することを推奨します。

* **明確な公開API**: export されたものだけが他から使えるため、公開・非公開が一目でわかります。
* **内部実装のテストを避ける**: 非公開関数をテストする必要がある場合は、その関数を切り出して独立したモジュールにするのが健全です。

### `any` 型と型アサーションを避け、`unknown` を使う

* **`any` の危険性**: TypeScript の型安全性を失い、保守性が低下します。
* **`unknown` の利点**: `unknown` は安全性を保ったまま柔軟に使えます。操作前に型を絞る必要があるため、誤った操作を防げます。

```ts
function processValue(value: unknown) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  } else if (typeof value === 'number') {
    console.log(value * 2);
  }
}
```

### JavaScript の配列演算子を活用する

`.map()`, `.filter()`, `.reduce()` などの配列演算子は、不変性を保ちながら宣言的にデータを操作でき、コードの可読性や予測可能性を向上させます。

## 環境変数

* **開発環境**: `.env` ファイルで環境変数を管理
* **本番環境**: ホスティングプラットフォームで環境変数を設定
* **型安全**: 環境変数は適切に型定義する

## コメント方針

コメントを書くなら、**価値の高い内容に限定する**こと。コメントでユーザーに話しかけるのは避けます。

### 良いコメントの例

```ts
// 複雑なビジネスロジックの説明
// なぜこの実装を選んだかの理由
// 将来の変更時の注意点
```

### 避けるべきコメント

```ts
// 変数名から明らかな内容
// コードの動作を説明するだけの内容
// 古くなりやすい実装詳細
```

## デプロイメント

### ビルドプロセス

1. `npm run build` で本番ビルド
2. `build/server` と `build/client` ディレクトリが生成
3. ホスティングプラットフォームにデプロイ

### 推奨ホスティング

* **Vercel**: Remixとの相性が良い
* **Netlify**: 簡単なデプロイ設定
* **Railway**: Node.jsアプリケーションに最適
* **Fly.io**: グローバルデプロイメント

## トラブルシューティング

### よくある問題

* **型エラー**: `npm run typecheck` で型の問題を確認
* **リントエラー**: `npm run lint` でコードスタイルの問題を確認
* **テスト失敗**: `npm test` でテストの問題を確認
* **ビルドエラー**: `npm run build` でビルドの問題を確認

### デバッグ

* **開発者ツール**: ブラウザの開発者ツールでクライアントサイドの問題を確認
* **サーバーログ**: サーバーサイドの問題はコンソールログで確認
* **Remix DevTools**: 開発時のデバッグに活用

## Git リポジトリ

このプロジェクトのメインブランチ名は **main** です。
