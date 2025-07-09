# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

### 開発
```bash
npm run dev          # 開発サーバー起動 (http://localhost:5173)
npm run build        # プロダクションビルド
npm start           # プロダクションサーバー起動
```

### テスト
```bash
npm test            # Vitestで全テスト実行
npm run test:ui     # UIモードでテスト実行
npm run test:coverage # カバレッジレポート付きテスト実行
npm run test:e2e    # Playwright E2Eテスト実行
npm run test:e2e:ui # UIモードでE2Eテスト実行
```

### コード品質
```bash
npm run lint        # ESLint実行
npm run typecheck   # TypeScript型チェック実行
```

**重要**: 変更をコミットする前に必ず `npm run lint` と `npm run typecheck` を実行してください。

## アーキテクチャ

このプロジェクトはクリーンアーキテクチャの原則に従い、3つの明確な層に分離されています：

### ドメイン層 (`app/domain/`)
- **エンティティ**: バリデーション付きビジネスオブジェクト (`AudioFileEntity`, `CenterImageEntity`, `VisualizerConfigEntity`)
- **リポジトリ**: データアクセスのインターフェース (`AudioRepository`, `FileRepository`)
- **ユースケース**: ビジネスロジックの調整 (`PlayAudioUseCase`, `UploadFileUseCase`)

### インフラストラクチャ層 (`app/infrastructure/`)
- **オーディオサービス**: Web Audio APIラッパー (`WebAudioService`) とCanvasレンダリング (`VisualizerEngine`)
- **リポジトリ実装**: ドメインインターフェースの具体的実装

### プレゼンテーション層 (`app/presentation/`)
- **コンポーネント**: 単一責任を持つ再利用可能なUIコンポーネント
- **フック**: 状態管理のためのカスタムReactフック (`useAudio`, `useVisualizer`, `useFileUpload`)
- **UIコンポーネント**: Tailwind CSSを使用したモダンなデザインシステム

## 主要コンポーネント

### オーディオビジュアライゼーションシステム
- **5つのビジュアライザータイプ**: 円形、波形、周波数バー、太陽系、パーティクルフィールド
- **リアルタイム解析**: Web Audio APIのAnalyserNodeを使用した周波数/時間領域データ
- **Canvasレンダリング**: グラデーション効果とアニメーション付きハードウェアアクセラレーション2D Canvas
- **設定可能パラメータ**: FFTサイズ、スムージング、感度、テーマ

### ファイル処理
- **マルチフォーマット対応**: オーディオ（MP3、WAV、OGG、AAC、FLAC）と画像（JPEG、PNG、GIF、WebP）
- **バリデーション**: ファイル署名検証、サイズ制限、MIMEタイプチェック
- **進捗追跡**: 視覚的フィードバック付きアップロード進捗シミュレーション
- **リソース管理**: オブジェクトURLとオーディオコンテキストの適切なクリーンアップ

## テスト戦略

### テスト構造
- **単体テスト**: コンポーネント、フック、ビジネスロジック
- **統合テスト**: 層間の相互作用
- **E2Eテスト**: Playwrightを使用したユーザーワークフロー
- **モック**: Web Audio APIとDOM APIをテスト用にモック

### テストファイルの場所
- コンポーネントテスト: `app/presentation/components/*.test.tsx`
- フックテスト: `app/presentation/hooks/*.test.ts`
- ルートテスト: `app/routes/*.test.tsx`
- E2Eテスト: `test/e2e/*.spec.ts`

## 開発ガイドライン

### コーディング規約
- **TypeScript**: 全レイヤーで完全な型安全性
- **ESLint/Prettier**: 一貫したコードフォーマット
- **クリーンアーキテクチャ**: 層の境界を尊重 - ドメインはインフラストラクチャに依存しない
- **単一責任**: 各コンポーネント/フックは明確な目的を持つ

### 日本語開発コンテキスト
`.cursor/rules/my-custom-rule.mdc`に基づく：
- 変数/関数名は英語、UIテキストは日本語
- コメントは主に英語、日本語は追加コンテキストに使用
- UIラベルは自然な日本語表現を使用
- エラーメッセージには実行可能なガイダンスを含む
- デザインはシンプルさ、モバイルファースト、アクセシビリティを重視

### パフォーマンス考慮事項
- **アニメーションフレーム管理**: 効率的なCanvasレンダリングループ
- **Web Audio Context再利用**: オーディオコンテキスト作成を最小化
- **メモリ管理**: リソースとイベントリスナーの適切なクリーンアップ
- **リソース廃棄**: useEffectクリーンアップでオブジェクトURLとオーディオコンテキストを常にクリーンアップ

### 一般的なパターン
- **カスタムフック**: 状態とビジネスロジックをカプセル化
- **依存性注入**: ユースケースはリポジトリをパラメータとして受け取る
- **エラーバウンダリ**: コンポーネントはエラーを適切に処理
- **イミュータブル更新**: 設定変更は新しいインスタンスを作成

## 技術スタック

- **フレームワーク**: Remix（Reactベースのフルスタックフレームワーク）
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **テスト**: Vitest + React Testing Library + Playwright
- **オーディオ**: Web Audio API
- **グラフィックス**: HTML5 Canvas
- **ビルドツール**: Vite

## 新機能の追加

### 新しいビジュアライザーモード
1. `VisualizerConfigEntity`タイプにモードを追加
2. `VisualizerEngine`でレンダリングロジックを実装
3. `AudioControls`コンポーネントにUIコントロールを追加
4. 新機能のテストを作成

### 新しいオーディオ機能
1. ドメイン層でビジネスロジックを定義
2. `WebAudioService`で実装
3. 必要に応じてユースケースを更新
4. プレゼンテーション層にUIコンポーネントを追加

### 新機能のテスト
1. ビジネスロジックの単体テストを作成
2. React Testing LibraryでUIコンポーネントをテスト
3. ユーザーワークフローのE2Eテストを追加
4. アクセシビリティ準拠を確認

## トラブルシューティング

### よくある問題
- **Audio Contextが初期化されない**: AudioContext作成前にユーザーインタラクションを確実に実行
- **Canvasがレンダリングされない**: Canvas refとコンテキスト初期化を確認
- **ファイルアップロードが失敗する**: ファイルタイプとサイズ制限を確認
- **パフォーマンスの問題**: オーディオ/Canvasクリーンアップでメモリリークをチェック

### メモリ管理
useEffectクリーンアップで常にリソースをクリーンアップ：
```typescript
useEffect(() => {
  return () => {
    audioContextRef.current?.close();
    if (audioRef.current?.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }
  };
}, []);
```