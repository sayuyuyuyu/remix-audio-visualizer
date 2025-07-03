# コントリビューションガイド

Remix Audio Visualizer へのコントリビューションに興味を持っていただき、ありがとうございます！このガイドでは、プロジェクトに貢献するための手順とガイドラインを説明します。

## 🌟 コントリビューションの種類

私たちは以下のような貢献を歓迎しています：

### 💻 コード貢献
- 新機能の追加
- バグ修正
- パフォーマンス改善
- リファクタリング
- テストの追加

### 📚 ドキュメント貢献
- ドキュメントの改善
- チュートリアルの作成
- API リファレンスの更新
- 翻訳

### 🐛 Issue 報告
- バグ報告
- 機能提案
- 改善案の提出

### 🎨 デザイン貢献
- UI/UX の改善
- アイコンやアセットの作成
- デザインシステムの改善

## 🚀 はじめ方

### 1. 環境のセットアップ

```bash
# フォークしたリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/remix-audio-visualizer.git
cd remix-audio-visualizer

# オリジナルリポジトリをアップストリームとして追加
git remote add upstream https://github.com/ORIGINAL_OWNER/remix-audio-visualizer.git

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 2. 開発環境の確認

```bash
# すべてのテストが通ることを確認
npm test

# リンターエラーがないことを確認
npm run lint

# TypeScript の型チェック
npm run typecheck

# ビルドが成功することを確認
npm run build
```

## 📋 Issue 報告

### バグ報告

バグを発見した場合は、以下の情報を含めて Issue を作成してください：

```markdown
### バグの概要
簡潔にバグの内容を説明してください。

### 再現手順
1. ...に移動
2. ...をクリック
3. ...が表示される

### 期待する動作
何が起こるべきかを説明してください。

### 実際の動作
実際に何が起こったかを説明してください。

### 環境情報
- OS: [例: macOS 13.0]
- ブラウザ: [例: Chrome 108.0]
- Node.js: [例: 18.12.0]
- npm: [例: 8.19.0]

### 追加情報
スクリーンショット、エラーログ、その他関連する情報
```

### 機能提案

新機能を提案する場合は、以下の情報を含めてください：

```markdown
### 機能の概要
提案する機能の簡潔な説明

### 動機
なぜこの機能が必要なのか

### 詳細な説明
機能の詳細な仕様や動作

### 実装案
可能であれば、実装のアイデアや参考資料

### 代替案
検討した他の解決方法があれば記載
```

## 🔧 プルリクエスト

### 1. ブランチの作成

機能やバグ修正ごとに新しいブランチを作成してください：

```bash
# main ブランチを最新に更新
git checkout main
git pull upstream main

# 新しいブランチを作成
git checkout -b feature/add-spectrum-analyzer
# または
git checkout -b fix/audio-playback-issue
```

### 2. ブランチ命名規則

以下の命名規則に従ってください：

- `feature/機能名`: 新機能の追加
- `fix/修正内容`: バグ修正
- `docs/内容`: ドキュメント更新
- `refactor/内容`: リファクタリング
- `test/内容`: テスト追加・修正

### 3. コミット規則

[Conventional Commits](https://www.conventionalcommits.org/) に従ってください：

```bash
# 例
git commit -m "feat(visualizer): add spectrum analyzer mode"
git commit -m "fix(audio): resolve Safari playback issue"
git commit -m "docs(api): update audio context documentation"
```

### 4. プルリクエストのテンプレート

プルリクエストを作成する際は、以下のテンプレートを使用してください：

```markdown
## 変更内容
この PR で何を変更したかの概要

## 関連 Issue
Fixes #(issue番号)

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] 重大な変更（既存機能に影響）
- [ ] ドキュメント更新

## テスト
- [ ] 新規テストを追加
- [ ] 既存テストを更新
- [ ] 手動テストを実施

## チェックリスト
- [ ] 自分のコードをレビューした
- [ ] コメントを適切に追加した
- [ ] ドキュメントを更新した
- [ ] テストが通ることを確認した
- [ ] リンターエラーがないことを確認した

## スクリーンショット
（UI に変更がある場合）

## 追加情報
レビュアーに伝えたい追加情報
```

### 5. コード品質ガイドライン

#### TypeScript
```typescript
// Good: 明確な型定義
interface AudioConfig {
  fftSize: number;
  smoothingTimeConstant: number;
}

// Good: デフォルトパラメータの使用
function createAnalyser(config: Partial<AudioConfig> = {}) {
  const defaultConfig: AudioConfig = {
    fftSize: 512,
    smoothingTimeConstant: 0.8,
    ...config
  };
  // ...
}
```

#### React コンポーネント
```typescript
// Good: 関数コンポーネントとフック
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  audioFile,
  onVisualizationChange 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onVisualizationChange?.('playing');
  }, [onVisualizationChange]);

  return (
    <div className="audio-visualizer">
      {/* コンポーネントの内容 */}
    </div>
  );
};
```

#### テスト
```typescript
// Good: 分かりやすいテスト名
describe('AudioVisualizer', () => {
  it('should start visualization when play button is clicked', async () => {
    const user = userEvent.setup();
    const onVisualizationChange = vi.fn();
    
    render(
      <AudioVisualizer 
        audioFile={mockAudioFile} 
        onVisualizationChange={onVisualizationChange}
      />
    );
    
    await user.click(screen.getByRole('button', { name: /play/i }));
    
    expect(onVisualizationChange).toHaveBeenCalledWith('playing');
  });
});
```

## 🎨 デザインガイドライン

### UI/UX 原則
1. **シンプルさ**: インターフェースはシンプルで直感的であること
2. **アクセシビリティ**: すべてのユーザーが使いやすいこと
3. **レスポンシブ**: すべてのデバイスで適切に動作すること
4. **パフォーマンス**: 高速で滑らかな動作

### カラーパレット
```css
/* プライマリ */
--violet-600: #7c3aed;
--violet-700: #6d28d9;

/* グレースケール */
--gray-900: #111827;
--gray-800: #1f2937;
--gray-700: #374151;

/* アクセント */
--pink-600: #db2777;
--blue-600: #2563eb;
```

### タイポグラフィ
- **フォント**: Inter
- **見出し**: font-bold, tracking-wider
- **本文**: font-normal
- **コード**: font-mono

## 🧪 テストガイドライン

### テストの書き方

#### 1. ユニットテスト
```typescript
// コンポーネントのプロパティのテスト
it('should render with custom name', () => {
  render(<HelloWorld name="Contributor" />);
  expect(screen.getByText('Hello, Contributor!')).toBeInTheDocument();
});

// 状態変更のテスト
it('should update playing state when button is clicked', async () => {
  const user = userEvent.setup();
  render(<AudioPlayer />);
  
  const playButton = screen.getByRole('button', { name: /play/i });
  await user.click(playButton);
  
  expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
});
```

#### 2. 統合テスト
```typescript
// 複数コンポーネントの連携テスト
it('should visualize audio when file is uploaded and played', async () => {
  const user = userEvent.setup();
  const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mp3' });
  
  render(<AudioVisualizerApp />);
  
  // ファイルアップロード
  const fileInput = screen.getByLabelText(/audio file/i);
  await user.upload(fileInput, mockFile);
  
  // 再生開始
  const playButton = screen.getByRole('button', { name: /play/i });
  await user.click(playButton);
  
  // 視覚化が開始されることを確認
  expect(screen.getByRole('region', { name: /visualization/i })).toBeInTheDocument();
});
```

### テストカバレッジ

新しいコードには適切なテストを追加してください：
- **コンポーネント**: 最低80%のカバレッジ
- **ユーティリティ関数**: 90%以上のカバレッジ
- **重要な機能**: エッジケースも含めた完全なテスト

## 📝 ドキュメントガイドライン

### README の更新

機能を追加した場合は、README の以下のセクションを更新してください：
- 主な機能
- 使用方法
- API リファレンス

### API ドキュメント

新しい関数やコンポーネントには、TSDoc コメントを追加してください：

```typescript
/**
 * オーディオファイルから周波数データを抽出します
 * 
 * @param audioBuffer - 解析対象のオーディオバッファ
 * @param fftSize - FFT のサイズ（デフォルト: 512）
 * @returns 周波数データの配列
 * 
 * @example
 * ```typescript
 * const frequencyData = extractFrequencyData(buffer, 1024);
 * console.log(frequencyData.length); // 512
 * ```
 */
function extractFrequencyData(
  audioBuffer: AudioBuffer, 
  fftSize: number = 512
): Float32Array {
  // 実装
}
```

## 🌍 国際化

### 多言語対応

現在は日本語のドキュメントが中心ですが、英語での貢献も歓迎しています：
- README の英語版作成
- コメントの英語併記
- エラーメッセージの多言語化

## 🔒 セキュリティ

セキュリティに関する問題を発見した場合：

1. **公開的な Issue は作成しないでください**
2. メール（security@example.com）で直接報告してください
3. 詳細な情報と再現手順を含めてください

## 🏆 コントリビューター認定

### 認定レベル

1. **Contributor**: 1つ以上の PR がマージされた方
2. **Regular Contributor**: 5つ以上の PR がマージされた方
3. **Core Contributor**: 継続的に貢献し、プロジェクトの方向性に関わる方

### 特典
- README での名前掲載
- 特別なコントリビューターバッジ
- 重要な決定への参加権

## 💬 コミュニケーション

### チャンネル
- **GitHub Issues**: バグ報告、機能提案
- **GitHub Discussions**: 一般的な質問、アイデア共有
- **Pull Request**: コードレビュー、実装に関する議論

### コミュニケーションガイドライン

1. **敬意を持って**: すべての参加者を尊重する
2. **建設的であること**: 問題だけでなく解決策も提示する
3. **明確であること**: 分かりやすく具体的に説明する
4. **忍耐強く**: 初心者にも優しく接する

## 📜 ライセンス

このプロジェクトに貢献することで、あなたの貢献が MIT ライセンスの下で公開されることに同意したものとみなします。

## 🙏 最後に

Remix Audio Visualizer への貢献を検討していただき、ありがとうございます！あなたの貢献がプロジェクトをより良いものにします。

質問がある場合は、遠慮なく Issue を作成するか、Discussion で質問してください。私たちはあなたの参加を心から歓迎しています！

---

Happy Coding! 🎵✨